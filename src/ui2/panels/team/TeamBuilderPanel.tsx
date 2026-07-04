// 编队面板 · Preact 主入口 · Stage 6.1a
//
// 迁移策略(playbook step 3):
//   · UI 层完全用 Preact JSX 重写,不再拼 innerHTML 字符串
//   · 数据层继续读 src/state.js 的 S 单例,靠 sSignal(stateVersion)驱动重渲染
//   · 按钮 onClick 直接调 openTeamPicker / toggleTeamMember(import 来的纯函数)
//   · 老 renderTeamBuilder 已变成 no-op shim

import { h } from 'preact';
import { useS } from '../../signals';
import { openTeamPicker, toggleTeamMember } from '../../../ui/teambuilder.js';
import { getMeta } from '../../../battle/template';
import { calcBP } from '../../../battle/stats';

const TEAM_SIZE = 3;

function TeamSlot({ slotIdx, name }: { slotIdx: number; name: string | null }) {
  const S = useS();
  const role = name ? S.roles[name] : null;
  const meta = name ? getMeta(name) : null;
  const bp = name ? calcBP(name) : 0;

  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 10, padding: 12,
      textAlign: 'center', minHeight: 120,
      background: role ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: name ? 'var(--gold)' : 'var(--dim)' }}>
        {name || '空位'}
      </div>
      {name && meta && (
        <>
          <div style={{ margin: '4px 0' }}>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{meta.element} · {meta.type}</span>
          </div>
          <div>
            <span style={{ color: 'var(--gold)', fontSize: 11 }}>BP {bp.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            Lv{role?.level || 1} · +{role?.chain || 0}链
          </div>
        </>
      )}
      <button class="mbtn" style={{ marginTop: 6 }}
        onClick={() => openTeamPicker(slotIdx)}>
        {name ? '更换' : '选择'}
      </button>
    </div>
  );
}

function RoleListItem({ name }: { name: string }) {
  const S = useS();
  const team = S.team || [null, null, null];
  const inTeam = team.includes(name);
  const meta = getMeta(name);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      border: `1px solid ${inTeam ? 'var(--gold)' : 'var(--line)'}`, borderRadius: 8, marginBottom: 4,
      cursor: 'pointer',
      background: inTeam ? 'rgba(245,207,107,.06)' : undefined,
    }}
      onClick={() => toggleTeamMember(name)}>
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6 }}>{meta?.element}</span>
      </div>
      <span style={{ fontSize: 10, color: inTeam ? 'var(--gold)' : 'var(--dim)' }}>
        {inTeam ? '已编入' : '点击加入'}
      </span>
    </div>
  );
}

export function TeamBuilderPanel() {
  const S = useS();
  const team = S.team || [null, null, null];
  const allRoles = Object.values(S.roles)
    .filter((r: any) => r.owned > 0)
    .sort((a: any, b: any) => calcBP(b.n) - calcBP(a.n));

  return (
    <div>
      <h2 class="col-head" style={{ marginTop: 0 }}>编 队（3 人）</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[0, 1, 2].map(i => (
          <TeamSlot key={i} slotIdx={i} name={team[i]} />
        ))}
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {allRoles.map((r: any) => <RoleListItem key={r.n} name={r.n} />)}
      </div>
    </div>
  );
}
