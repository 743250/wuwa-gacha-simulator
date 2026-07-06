// 顶部资源栏 · Stage 6.1b
// 挂载到 #gres，渲染星声/月相/波纹/体力标签
// 注意:mount 到 #gres,组件本身不能再返回 id="gres"(否则套娃),用 Fragment

import { h, Fragment } from 'preact';
import { useS } from '../../signals';

export function TopOverview() {
  const S = useS();

  const gres: any[] = [
    { c: 'ast', l: '星声', v: S.astrite.toLocaleString(), k: 'astrite' },
    { c: 'lun', l: '月相', v: S.lunite, k: 'lunite' },
    { c: 'r', l: '浮金', v: S.radiant, k: 'radiant' },
    { c: 'f', l: '铸潮', v: S.forging, k: 'forging' },
    { c: 'l', l: '唤声', v: S.lustrous, k: 'lustrous' },
  ];
  if (S.days > 0) gres.push({ c: 'day', l: '月卡', v: S.days + '天' });
  gres.push({ c: 'day', l: '体力', v: `${S.stamina}/${S.staminaMax}`, k: 'stamina' });

  return (
    <Fragment>
      {gres.map((x: any) => (
        <span class={`gtag ${x.c}`} key={x.l}>
          <span class="dot"></span>
          {x.l} <b>{x.v}</b>
          {x.k ? (
            <button class="plus"
              onClick={() => {
                if (x.k === 'stamina') (window as any).openStaminaModal();
                else (window as any).openTopup(x.k);
              }}
              title={x.k === 'stamina' ? '嗑药剂回复体力' : '兑换/补充'}>
              +
            </button>
          ) : null}
        </span>
      ))}
    </Fragment>
  );
}
