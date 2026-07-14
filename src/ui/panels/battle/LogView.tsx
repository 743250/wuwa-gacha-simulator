// 战斗日志组件
import { h } from 'preact';
import { formatLogLine } from './helpers';

interface LogViewProps {
  logs: any[];
}

export function LogView({ logs }: LogViewProps) {
  const recent = logs.slice(-8);
  return (
    <div class="bf-log">
      {recent.length === 0 && <div class="bf-log-empty">战斗开始</div>}
      {recent.map((l, i) => {
        const text = formatLogLine(l);
        return text ? <div class="bf-log-line" key={i} dangerouslySetInnerHTML={{ __html: text }} /> : null;
      })}
    </div>
  );
}
