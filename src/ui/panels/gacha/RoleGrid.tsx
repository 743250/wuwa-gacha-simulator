// 角色方块网格 · Stage 6.1b
// mount 到 #roles(已是 grid 容器),组件用 Fragment 直接渲染 .role 子元素
// 不要再包裹 <div id="roles"> —— 会套娃且破坏 CSS grid

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { openRoleModal } from '../../../ui/render/roleModal.js';
import { getRoleArt } from '../../assets/index.ts';

// 排序:5★ 优先 → 共鸣链高优先 → 等级高优先 → 名字
function roleSortKey(o: any): [number, number, number, string] {
  return [
    -(o.r || 0),           // 5★ 在前
    -(o.chain || 0),       // 共鸣链高在前
    -(o.level || 1),       // 等级高在前
    String(o.n || ''),     // 名字升序
  ];
}

export function RoleGrid() {
  const S = useS();
  const arr = Object.values(S.roles).sort((a: any, b: any) => {
    const ka = roleSortKey(a), kb = roleSortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return (ka[i] as number) - (kb[i] as number);
    }
    return 0;
  });

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
        const ra = getRoleArt(o.n);
        const art = ra?.portrait || ra?.bannerBg;
        return (
          <div class={`role r${o.r}`}
            onClick={() => openRoleModal(o.n)}
            style={{ cursor: 'pointer' }}>
            {art && <div class="role-art" style={{ backgroundImage: `url("${art}")` }}></div>}
            <div class="role-shade"></div>
            <div class={`chain-badge ${chainCls}`}>+{o.chain}/6</div>
            {o.spare > 0 ? <div class="spare-dot">频段 {o.spare}</div> : null}
            <div class="stars">{stars}</div>
            <div class="rname">{o.n}</div>
            <div class="rlv">LV {lv}{o.equipWeapon ? ' · 装备' : ''}</div>
          </div>
        );
      })}
    </Fragment>
  );
}
