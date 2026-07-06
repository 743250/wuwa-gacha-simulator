// 编队 actions · Phase 5 从 src/ui/teambuilder.js shim 迁入
// openTeamPicker 用 Preact VNode body,闭包 onClick 无 window 桥
import { h } from 'preact';
import { S, msg, $ } from '../../../state.js';
import { getMeta } from '../../../battle/template.js';
import { calcBP } from '../../../battle/stats.js';
import { openModal } from '../../../modal.js';
import { bumpStateVersion } from '../../signals';

export const TEAM_SIZE = 3;

function setTeamMember(slotIdx: number, name: string) {
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) team[existingIdx] = null;
  team[slotIdx] = name;
  S.team = team;
  msg(`编入 ${name}`, false);
  bumpStateVersion();
  $('modal').classList.remove('on');
}

export function openTeamPicker(slotIdx: number) {
  const roles = Object.values(S.roles).filter((r: any) => r.owned > 0).sort((a: any, b: any) => calcBP(b.n) - calcBP(a.n));
  const body = h('div', null,
    roles.length === 0
      ? h('div', { style: { color: 'var(--muted)', textAlign: 'center' } }, '还没有角色')
      : roles.map((r: any) => {
        const bp = calcBP(r.n);
        return h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: '10px',
            border: '1px solid var(--line)', borderRadius: '8px',
            padding: '8px 10px', marginBottom: '4px', cursor: 'pointer',
          },
          onClick: () => setTeamMember(slotIdx, r.n),
        },
          h('div', { style: { flex: 1 } },
            h('b', null, r.n), ' ',
            h('span', { style: { fontSize: '10px', color: 'var(--muted)' } }, getMeta(r.n).element)
          ),
          h('span', { style: { color: 'var(--gold)', fontSize: '11px' } }, bp.toLocaleString()),
          h('span', { style: { fontSize: '10px', color: 'var(--muted)' } }, `LV${r.level || 1} · +${r.chain || 0}链`)
        );
      })
  );
  openModal({
    title: `选择编队成员（第 ${slotIdx + 1} 位）`,
    body,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
}

export function toggleTeamMember(name: string) {
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) {
    team[existingIdx] = null;
    msg(`移出 ${name}`, false);
  } else {
    const empty = team.indexOf(null);
    if (empty >= 0) team[empty] = name;
    else { msg('编队已满，先移出再添加'); return; }
  }
  S.team = team;
  bumpStateVersion();
}

export function swapTeamMember(fromIdx: number, toIdx: number) {
  const team = S.team || [null, null, null];
  if (fromIdx < 0 || fromIdx >= team.length || toIdx < 0 || toIdx >= team.length) return;
  if (fromIdx === toIdx) return;
  const tmp = team[fromIdx];
  team[fromIdx] = team[toIdx];
  team[toIdx] = tmp;
  S.team = team;
  bumpStateVersion();
}
