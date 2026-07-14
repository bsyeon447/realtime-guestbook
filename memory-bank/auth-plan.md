# 인증/인가 구현 및 마이그레이션 계획

## 1. 목표

현재 애플리케이션은 모든 사용자가 익명으로 방명록 글과 이미지를 등록하고, 클라이언트에서 Supabase anon key로 `posts` 테이블과 `guestbook` Storage 버킷에 직접 접근하는 구조이다.

인증/인가 마이그레이션의 목표는 다음과 같다.

* Supabase Auth를 도입하여 사용자를 식별한다.
* `posts` 레코드와 업로드 파일을 작성자와 연결한다.
* Row Level Security(RLS)와 Storage 정책으로 읽기/쓰기/수정/삭제 권한을 명확히 제한한다.
* Next.js App Router 구조를 유지하면서 클라이언트 컴포넌트의 Supabase 접근을 인증 세션 기반으로 전환한다.
* 기존 공개 방명록 경험은 가능한 유지하되, 글 작성/수정/삭제 같은 변경 작업은 인증된 사용자에게만 허용한다.

## 2. 권한 모델

### 사용자 역할

* **익명 사용자**
    * 방명록 글 목록 조회 가능
    * 이미지 조회 가능
    * 글 작성, 이미지 업로드, 수정, 삭제 불가
* **인증 사용자**
    * 방명록 글 목록 조회 가능
    * 본인 글 작성 가능
    * 본인이 업로드한 이미지 등록 가능
    * 본인 글 수정/삭제 가능
* **관리자**
    * 모든 글과 이미지 관리 가능
    * 초기 구현에서는 별도 관리자 UI를 만들지 않고, 필요 시 `profiles.role` 또는 custom claim 기반으로 확장한다.

### 정책 원칙

* 공개 조회는 허용한다.
* 데이터 변경은 `auth.uid()`가 존재하는 사용자에게만 허용한다.
* `posts.user_id`는 로그인한 사용자 ID와 일치해야 한다.
* Storage 객체 경로는 사용자 ID로 namespace를 분리한다.
* 서비스 롤 키는 브라우저에 절대 노출하지 않는다.

## 3. 데이터베이스 마이그레이션 계획

### 3.1 `posts` 테이블 확장

현재 타입 기준 `posts`는 최소한 다음 필드를 사용한다.

* `id`
* `created_at`
* `message`
* `image_url`

인증 도입 시 다음 컬럼을 추가한다.

```sql
alter table public.posts
add column if not exists user_id uuid references auth.users(id) on delete set null,
add column if not exists updated_at timestamptz,
add column if not exists image_path text;
```

`image_url`은 기존 표시 호환성을 위해 당분간 유지한다. 신규 업로드부터는 `image_path`를 저장하고, 화면 표시 시 Supabase Storage public URL 또는 signed URL을 생성하는 방향으로 전환한다.

### 3.2 기존 데이터 처리

기존 익명 글은 작성자를 알 수 없으므로 `user_id = null` 상태로 유지한다.

권장 정책:

* 기존 글은 계속 공개 조회 가능하게 둔다.
* 기존 글은 일반 사용자가 수정/삭제할 수 없게 둔다.
* 관리자가 필요할 때만 직접 정리한다.

### 3.3 `profiles` 테이블 추가

사용자 표시명과 관리자 확장을 위해 `profiles` 테이블을 추가한다.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
```

신규 회원 가입 시 profile을 자동 생성하는 trigger를 추가한다.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

## 4. RLS 정책 계획

### 4.1 `posts` RLS

```sql
alter table public.posts enable row level security;
```

조회 정책:

```sql
create policy "Anyone can read posts"
on public.posts
for select
using (true);
```

작성 정책:

```sql
create policy "Authenticated users can insert own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);
```

수정 정책:

```sql
create policy "Users can update own posts"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

삭제 정책:

```sql
create policy "Users can delete own posts"
on public.posts
for delete
to authenticated
using (auth.uid() = user_id);
```

관리자 정책은 초기 범위에서는 보류한다. 관리자 기능이 필요해지면 `profiles.role = 'admin'` 확인 함수를 만들고 별도 정책을 추가한다.

### 4.2 `profiles` RLS

```sql
alter table public.profiles enable row level security;
```

```sql
create policy "Anyone can read profiles"
on public.profiles
for select
using (true);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## 5. Storage 마이그레이션 계획

현재 `GuestbookForm.tsx`는 `guestbook` 버킷의 `public/{timestamp}-{filename}` 경로에 업로드한다.

인증 도입 후 경로를 다음 형태로 변경한다.

```text
posts/{user_id}/{timestamp}-{filename}
```

Storage 정책 방향:

* 이미지 조회는 공개 허용한다.
* 업로드는 인증 사용자만 허용한다.
* 사용자는 자기 `user_id` prefix 아래에만 업로드할 수 있다.
* 삭제는 자기 prefix 객체만 가능하게 한다.

예시 정책:

```sql
create policy "Anyone can read guestbook images"
on storage.objects
for select
using (bucket_id = 'guestbook');

create policy "Authenticated users can upload own guestbook images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'guestbook'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy "Users can delete own guestbook images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'guestbook'
  and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text
);
```

## 6. Next.js 코드 변경 계획

### 6.1 Supabase 클라이언트 구성

현재 파일:

* `src/lib/supabaseClient.ts`

현재 구조는 하나의 브라우저 클라이언트를 export한다. 인증 도입 후에도 클라이언트 컴포넌트용 브라우저 클라이언트는 유지하되, 세션 처리가 명확하도록 다음 구조로 정리한다.

* `src/lib/supabase/client.ts`: 브라우저 클라이언트
* `src/lib/supabase/server.ts`: 서버 컴포넌트/Route Handler용 서버 클라이언트
* `src/lib/supabase/middleware.ts`: 세션 refresh용 middleware helper

권장 패키지:

```bash
npm install @supabase/ssr
```

### 6.2 Auth UI 컴포넌트 추가

추가 예정 컴포넌트:

* `src/components/AuthButton.tsx`
    * 로그인/로그아웃 버튼
    * 현재 사용자 이메일 또는 표시명 표시
* `src/components/AuthForm.tsx`
    * 이메일 magic link 또는 이메일/비밀번호 로그인
    * 초기 구현은 magic link가 가장 단순하다.

라우트 후보:

* `app/login/page.tsx`
* `app/auth/callback/route.ts`

### 6.3 `GuestbookForm.tsx` 변경

변경 사항:

* 현재 세션을 확인한다.
* 로그인하지 않은 사용자는 작성 폼 대신 로그인 안내/버튼을 보여준다.
* insert 시 `user_id: user.id`를 포함한다.
* 업로드 경로를 `posts/${user.id}/...`로 변경한다.
* 업로드 후 `image_url`과 함께 `image_path`도 저장한다.

주의:

* 클라이언트에서 `user_id`를 넣더라도 RLS `with check (auth.uid() = user_id)`가 최종 보호막이어야 한다.
* 사용자가 임의로 다른 `user_id`를 넣으면 DB가 거부해야 한다.

### 6.4 `PostItGrid.tsx` 변경

변경 사항:

* `posts` 조회 시 `profiles(display_name, avatar_url)`를 함께 가져오는 방식을 검토한다.
* 글 카드에 작성자 표시를 추가한다.
* 현재 로그인 사용자가 작성자인 경우에만 수정/삭제 버튼을 보여준다.
* 삭제 시 Storage 객체도 함께 삭제한다. 이때 `image_path`를 사용한다.

### 6.5 `app/page.tsx` 변경

변경 사항:

* 상단에 `AuthButton`을 배치한다.
* 초기 데이터 조회는 현재처럼 클라이언트에서 유지할 수 있다.
* 이후 최적화 단계에서 서버 컴포넌트 초기 조회 + 클라이언트 Realtime 구독으로 분리할 수 있다.

### 6.6 TypeScript 타입 변경

`src/types/index.ts`의 `Post` 타입을 확장한다.

```ts
export type Post = {
  id: number;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  message: string | null;
  image_url: string | null;
  image_path: string | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
};
```

## 7. Supabase MCP 작업 순서

Supabase MCP를 사용할 때는 다음 순서로 진행한다.

1. 현재 원격 프로젝트의 테이블, 컬럼, RLS 상태 확인
2. `posts` 테이블 스키마와 기존 정책 백업
3. `profiles` 테이블 생성 마이그레이션 적용
4. `posts` 컬럼 추가 마이그레이션 적용
5. RLS 정책 적용
6. Storage `guestbook` 버킷과 정책 확인 및 적용
7. Auth provider 설정 확인
8. 로컬 코드 변경
9. 로컬 빌드 확인
10. 실제 Supabase 프로젝트에서 로그인, 작성, 조회, Realtime 동작 확인

## 8. 단계별 실행 계획

### 1단계: 사전 점검

* Supabase 프로젝트의 `posts` 스키마 확인
* `guestbook` Storage 버킷 공개 여부 확인
* 현재 RLS 활성화 여부 확인
* 인증 방식 결정
    * 1차 권장: Email magic link
    * 대안: Email/password
    * 추후 확장: OAuth provider

### 2단계: DB/Auth 기반 준비

* `profiles` 테이블 추가
* 신규 사용자 profile 자동 생성 trigger 추가
* `posts.user_id`, `posts.updated_at`, `posts.image_path` 컬럼 추가
* 기존 익명 데이터 유지 전략 확정

### 3단계: RLS와 Storage 정책 적용

* `posts` RLS 활성화
* 공개 조회 정책 추가
* 인증 사용자 본인 글 insert/update/delete 정책 추가
* `profiles` 조회/수정 정책 추가
* `guestbook` Storage 읽기/업로드/삭제 정책 추가

### 4단계: Next.js 인증 UI 구현

* Supabase SSR 패키지 도입
* 브라우저/서버 Supabase 클라이언트 분리
* 로그인 페이지와 callback route 추가
* 헤더 로그인/로그아웃 UI 추가
* 세션 refresh middleware 추가

### 5단계: 방명록 작성 흐름 변경

* 비로그인 사용자의 작성 차단
* 업로드 경로에 `user.id` 포함
* insert payload에 `user_id`, `image_path` 포함
* RLS 거부 오류 메시지 처리

### 6단계: 소유자 기반 수정/삭제 추가

* 현재 사용자와 `post.user_id` 비교
* 본인 글에만 수정/삭제 UI 표시
* 삭제 시 `posts` row와 Storage 객체 정리
* 기존 익명 글은 일반 사용자 수정/삭제 불가 처리

### 7단계: 검증

* 비로그인 사용자가 목록을 볼 수 있는지 확인
* 비로그인 사용자가 글 작성에 실패하는지 확인
* 로그인 사용자가 글과 이미지를 등록할 수 있는지 확인
* 다른 사용자의 `user_id`로 insert가 거부되는지 확인
* 다른 사용자의 글 수정/삭제가 거부되는지 확인
* Realtime INSERT 구독이 로그인/비로그인 양쪽에서 동작하는지 확인
* `npm run build` 성공 확인

## 9. 위험 요소와 대응

* **기존 데이터 소유자 부재**
    * 기존 글은 `user_id = null`로 유지하고 수정/삭제를 제한한다.
* **Storage URL 관리**
    * 기존 `image_url`은 유지하고, 신규 파일은 `image_path`를 함께 저장한다.
* **클라이언트 신뢰 문제**
    * 클라이언트에서 보내는 `user_id`는 편의 값일 뿐이며, RLS가 최종 검증해야 한다.
* **Realtime과 RLS 상호작용**
    * Realtime으로 전달되는 row도 RLS 정책의 영향을 받을 수 있으므로 공개 조회 정책을 명확히 유지한다.
* **service role key 노출 위험**
    * `.env.local`에 service role key가 있더라도 브라우저 번들에서 사용하지 않는다.
    * 서비스 롤이 필요한 작업은 Route Handler 또는 서버 전용 스크립트에서만 수행한다.

## 10. 완료 기준

* 인증 사용자가 로그인/로그아웃할 수 있다.
* 익명 사용자는 글 목록과 이미지를 볼 수 있지만 작성할 수 없다.
* 인증 사용자는 본인 글과 이미지만 생성/수정/삭제할 수 있다.
* RLS와 Storage 정책이 클라이언트 조작을 방어한다.
* 기존 익명 글은 계속 조회 가능하다.
* `npm run build`가 성공한다.
* `memory-bank/progress.md`가 실제 구현 상태에 맞게 갱신되어 있다.
