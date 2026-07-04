// 抽卡记录 tab · Stage 6.1b
// 接管 #paneLog；#clearLog 按钮 onClick 直接写 S 并 bump

import { h, Fragment } from 'preact';
import { useS, bumpStateVersion } from '../../signals';
import { S as S_RAW } from '../../../state.js';

export function LogTab() {
  const S = useS();
  const log = S.log || [];

  return (
    <Fragment>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>最近 200 条</span>
        <button class="mbtn" id="clearLog"
          onClick={() => { S_RAW.log = []; bumpStateVersion(); }}>
          清空
        </button>
      </div>
      <div class="log" id="logList">
        {log.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px', fontSize: '12px', letterSpacing: '1px' }}>
            暂无记录
          </div>
        ) : log.map((x: any, i: number) => (
          <div class={`logrow r${x.r}`} key={i}>
            <b style={{ color: `var(${x.r === 5 ? '--gold' : x.r === 4 ? '--purple' : '--blue'})` }}>{x.r}★</b>
            <span>
              {x.n}
              {x.up ? <span style={{ color: 'var(--gold)', fontSize: '10px', letterSpacing: '1px' }}> 提升</span> : null}
            </span>
            <span class="dt">{x.date}<br />#{x.no}</span>
          </div>
        ))}
      </div>
    </Fragment>
  );
}
