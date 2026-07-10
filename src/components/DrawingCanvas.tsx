'use client';

import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  onChange: (dataUrl: string) => void;
}

const DrawingCanvas = forwardRef<{ clearCanvas: () => void; }, DrawingCanvasProps>(
  ({ onChange }, ref) => {
    const [lines, setLines] = useState<any[]>([]);
    const [color, setColor] = useState('#1f2937');
    const isDrawing = useRef(false);
    const stageRef = useRef<any>(null);

    const clearCanvas = () => {
      setLines([]);
      onChange('');
    };

    useImperativeHandle(ref, () => ({
      clearCanvas
    }));

    const handleMouseDown = (e: any) => {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, { tool: 'pen', points: [pos.x, pos.y], color }]);
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing.current || !stageRef.current) return;

      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      let lastLine = lines[lines.length - 1];

      if (!lastLine) return;

      lastLine.points = lastLine.points.concat([point.x, point.y]);
      lines.splice(lines.length - 1, 1, lastLine);
      const newLines = lines.concat();
      setLines(newLines);

      onChange(stageRef.current.toDataURL());
    };

    const handleMouseUp = () => {
      isDrawing.current = false;
    };

    return (
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
        <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
          {[
            '#1f2937', '#ef4444', '#3b82f6', '#22c55e', '#f97316',
          ].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                width: '24px', height: '24px', borderRadius: '50%', marginRight: '0.5rem', cursor: 'pointer', border: 'none',
                backgroundColor: item,
                outline: color === item ? '2px solid #60a5fa' : 'none',
                transform: color === item ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => setColor(item)}
              aria-label={`${item} 색상`}
            />
          ))}
          <button
            type="button"
            onClick={clearCanvas}
            style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
          >
            전체 지우기
          </button>
        </div>
        <Stage
          ref={stageRef}
          width={520}
          height={260}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: 'crosshair' }}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.color}
                strokeWidth={4}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;