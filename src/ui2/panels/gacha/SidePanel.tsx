// 右侧三 tab 容器 · Stage 6.1b
// 接管 side-tabs（stat/ex/log 切换）+ 三个 pane 显隐
// 挂载到侧栏的 col-wrap

import { h } from 'preact';
import { signal } from '@preact/signals';
import { useS } from '../../signals';
import { StatsTab } from './StatsTab';
import { ExchangeTab } from './ExchangeTab';
import { LogTab } from './LogTab';

export const gachaTabSignal = signal('stat');

export function SidePanel() {
  useS(); // subscribe to state changes
  const tab = gachaTabSignal.value;

  return (
    <div>
      <div class="side-tabs">
        <div class={`s-tab${tab === 'stat' ? ' on' : ''}`} data-s="stat"
          onClick={() => { gachaTabSignal.value = 'stat'; }}>
          统 计
        </div>
        <div class={`s-tab${tab === 'ex' ? ' on' : ''}`} data-s="ex"
          onClick={() => { gachaTabSignal.value = 'ex'; }}>
          海 市
        </div>
        <div class={`s-tab${tab === 'log' ? ' on' : ''}`} data-s="log"
          onClick={() => { gachaTabSignal.value = 'log'; }}>
          记 录
        </div>
      </div>

      {tab === 'stat' && <StatsTab />}
      {tab === 'ex' && <ExchangeTab />}
      {tab === 'log' && <LogTab />}
    </div>
  );
}
