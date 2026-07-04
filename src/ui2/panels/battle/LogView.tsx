// 战斗日志组件
import { h } from 'preact';
import { formatLogLine } from './helpers';

interface LogViewProps {
  logs: any[];
}

export function LogView({ logs }: LogViewProps) {
  const recent = logs.slice(-8);
  return (
    <div style={{
      marginBottom: 12, fontSize: 11, color: 'var(--muted)',
      maxHeight: 100, overflowY: 'auto',
      background: 'rgba(0,0,0,.25)', borderRadius: 8,
      padding: '8px 12px', lineHeight: 1.6
    }}>
      {recent.map((l, i) => {
        const text = formatLogLine(l);
        return text ? <div key={i} dangerouslySetInnerHTML={{ __html: text }} /> : null;
      })}
    </div>
  );
}
