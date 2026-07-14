export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
};

export type Post = {
  id: number;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  message: string | null;
  image_url: string | null;
  image_path: string | null;
  profiles?: Profile | null;
};
