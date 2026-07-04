// 角色方块网格 · Stage 6.1b
// mount 到 #roles(已是 grid 容器),组件用 Fragment 直接渲染 .role 子元素
// 不要再包裹 <div id="roles"> —— 会套娃且破坏 CSS grid

import { h, Fragment } from 'preact';
import { useS } from '../../signals';

export function RoleGrid() {
  const S = useS();
  const arr = Object.values(S.roles).sort((a: any, b: any) =>
    (b.r || 0) - (a.r || 0) || (b.level || 1) - (a.level || 1) || String(a.n || '').localeCompare(String(b.n || ''), 'zh')
  );

  if (arr.length === 0) {
    return (
      <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', padding: '30px', fontSize: '12px', letterSpacing: '1px' }}>
        还没有角色 / 武器
      </div>
    );
  }

  return (
    <Fragment>
      {arr.map((o: any) => {
        const stars = '★'.repeat(o.r);
        const chainCls = o.chain >= 6 ? 'full' : (o.chain > 0 ? 'has' : '');
        const lv = o.level || 1;
        return (
          <div class={`role r${o.r}`}
            onClick={() => (window as any).openRoleModal(o.n.replace(/'/g, "\\'"))}
            style={{ cursor: 'pointer' }}>
            <div class={`chain-badge ${chainCls}`}>+{o.chain}/6</div>
            {o.spare > 0 ? <div class="spare-dot">频段 {o.spare}</div> : null}
            <div class="stars">{stars}</div>
            <div class="rname">{o.n}</div>
            <div style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', marginTop: '3px', letterSpacing: '.5px' }}>
              LV {lv}{o.equipWeapon ? ' · 已装备' : ''}
            </div>
          </div>
        );
      })}
    </Fragment>
  );
}
