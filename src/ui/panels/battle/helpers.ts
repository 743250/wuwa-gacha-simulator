// Shared helpers for battle UI components

export const displayName = (u: any): string =>
  (u && u.displayName) ? u.displayName : (u ? u.name : '');

/** Build safe HTML string for a log line */
export function formatLogLine(l: any): string {
  if (l.type === 'attack') return `${l.src} ${l.action || '普攻'} → ${l.tgt} <b style="color:var(--red)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'skill') return `${l.src} 技能 → ${l.tgt} <b style="color:var(--accent)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'heavy') return `${l.src} 💢 ${l.action || '重击'} → ${l.tgt} <b style="color:#ff8c5e">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'burst') return `${l.src} 解放 → ${l.results.map((r: any) => `${r.tgt}${r.primary ? '★' : ''} <b style="color:var(--gold)">${r.dmg}</b>`).join(', ')}`;
  if (l.type === 'switch') return `↑ ${l.src} 上场`;
  if (l.type === 'enemy_attack') return `<span style="color:var(--red)">${l.src}</span> 攻击 → ${l.tgt} <b>${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'dodge') return `<span style="color:var(--accent)">${l.tgt} 闪避了 ${l.src} 的攻击！</span>`;
  if (l.type === 'heal') return `${l.src} 治疗 ${l.tgt} <b style="color:var(--green)">+${l.dmg}</b>`;
  if (l.type === 'burn') return `🔥 ${l.tgt} 受到点燃 <b>${l.dmg}</b>`;
  if (l.type === 'freeze') return `❄ ${l.tgt} 被冻结`;
  if (l.type === 'summon') return `🟢 ${l.src} 召唤 ${l.tgt}`;
  if (l.type === 'mechanic') return `⚠ ${l.src} · ${l.msg}`;
  if (l.type === 'system') return `<span style="color:var(--gold)">${l.msg}</span>`;
  return '';
}
