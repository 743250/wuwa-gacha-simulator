// 统计 tab · Stage 6.1b
// 接管 #paneStat

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { cur, poolKind } from '../../../gacha/core.js';

export function StatsTab() {
  const S = useS();
  const b = cur();

  const curPool = b ? b.pool : 'eventChar';
  const charPityPool = poolKind(curPool) === 'char' ? curPool : 'eventChar';
  const weapPityPool = poolKind(curPool) === 'weapon' ? curPool : 'eventWeapon';

  const roleArr = Object.values(S.roles || {}).filter((r: any) => r.owned > 0);
  const role5 = roleArr.filter((r: any) => r.r === 5).length;
  const role4 = roleArr.filter((r: any) => r.r === 4).length;
  const weaponArr = Object.values(S.weapons || {});
  const weapon5 = weaponArr.filter((w: any) => w.r === 5).length;
  const weapon4 = weaponArr.filter((w: any) => w.r === 4).length;

  return (
    <Fragment>
      <div class="stats">
        <div class="stat"><b>{S.total}</b><span>总抽数</span></div>
        <div class="stat"><b>{S.five}</b><span>五星</span></div>
        <div class="stat"><b>{S.four}</b><span>四星</span></div>
        <div class="stat"><b>{S.five ? (S.total / S.five).toFixed(1) : '-'}</b><span>出金均值</span></div>
        <div class="stat"><b>{S.upHits}</b><span>提升命中</span></div>
        <div class="stat"><b>{Object.values(S.waveBuy as Record<string,number>).reduce((a, b) => a + b, 0)}</b><span>波段持有</span></div>
        <div class="stat"><b>{S.pity[charPityPool] || 0}</b><span>角色垫</span></div>
        <div class="stat"><b>{S.pity[weapPityPool] || 0}</b><span>武器垫</span></div>
        <div class="stat"><b>{roleArr.length}</b><span>已拥角色</span></div>
        <div class="stat"><b>{weaponArr.length}</b><span>已拥武器</span></div>
      </div>
      <div id="sCollectionDetail" style={{ marginTop: '10px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', letterSpacing: '.5px' }}>
        角色 ★5 × <b style={{ color: 'var(--gold)' }}>{role5}</b> · ★4 × <b style={{ color: 'var(--purple)' }}>{role4}</b><br />
        武器 ★5 × <b style={{ color: 'var(--gold)' }}>{weapon5}</b> · ★4 × <b style={{ color: 'var(--purple)' }}>{weapon4}</b>
      </div>
    </Fragment>
  );
}
