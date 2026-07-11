// 抽卡动作入口（含十连补抽确认弹窗）
import { S, msg, animating } from '../state.js';
import { rerenderAll } from '../rerender.js';
import { cur, getPool, tideKey, tideName, canAffordPulls, payBeginnerTen, pull } from './core.js';
import { openModal } from '../modal.js';
import { showResult } from './animation.js';
import { progressTask } from '../podcast/core.js';
import { commit } from '../state/commit.ts';

function recordPullResults(out) {
  if (!out.length) return;
  S.log = out.slice().reverse().concat(S.log);
  const fiveCount = out.filter(x => x.r === 5).length;
  progressTask('d_pull', out.length);
  progressTask('p_pull50', out.length);
  progressTask('p_pull200', out.length);
  if (fiveCount > 0) progressTask('p_five', fiveCount);
}

export function doPullN(n, free = false) {
  if (animating) return;
  if (!cur()) return msg('当前日期无可用卡池');
  if (getPool() === 'beginner' && n !== 10 && !free) return msg('万象新声仅支持十连唤取');
  const pool = getPool();
  let freePull = free;
  if (pool === 'beginner' && n === 10 && !free) {
    if (!payBeginnerTen()) return msg('资源不足，万象新声十连需要 8 个唤声涡纹或等值星声');
    freePull = true;
  }
  const arr = commit(() => {
    const out = [];
    for (let i = 0; i < n; i++) { const x = pull(pool, freePull); if (!x) break; out.push(x); }
    recordPullResults(out);
    return out;
  });
  if (arr.length) showResult(arr);
  rerenderAll();
}

export function tryPull(n) {
  if (animating) return;
  if (!cur()) return msg('当前日期无可用卡池');
  if (getPool() === 'beginner' && n !== 10) return msg('万象新声仅支持十连唤取');
  const c = canAffordPulls(n);
  const k = getPool(), tide = S[tideKey(k)];
  const priced = n === 10 && k === 'beginner' ? 8 : n;
  if (c.ok) {
    if (n === 10 && c.astrite > 0) {
      openModal({
        title: '使用星声补足十连',
        body: `完成 <b>10</b> 连需要 <b>${priced}</b> 个${tideName(k)}。<br>
当前持有 <b class="a">${tide}</b> 个 ${tideName(k)}，还需消耗 <b class="g">${c.astrite.toLocaleString()}</b> 星声补足。`,
        actions: [
          { label: '取消', cls: '', fn: () => {} },
          { label: '确认十连', cls: 'primary', fn: () => doPullN(10) }
        ]
      });
      return;
    }
    doPullN(n); return;
  }
  if (c.okWithLunite) {
    openModal({
      title: n === 10 ? '月相补足十连' : '月相转星声',
      body: `完成 <b>${n}</b> 连需要 <b>${priced}</b> 个${tideName(k)}。<br>
当前持有 <b class="a">${tide}</b> 个 ${tideName(k)}、<b class="g">${S.astrite.toLocaleString()}</b> 星声、<b>${S.lunite}</b> 月相。<br><br>
是否将 <b class="g">${c.missing.toLocaleString()}</b> 月相转为星声，用来补足本次唤取？`,
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '转换并唤取', cls: 'primary', fn: () => {
            commit(() => { S.lunite -= c.missing; S.astrite += c.missing; });
            doPullN(n);
          }
        }
      ]
    });
    return;
  }
  if (n === 10) return msg(`资源不足，无法完成十连。当前最多可抽 ${c.possible} 次`);
  msg('星声、月相与波纹均不足');
}

export function toFive() {
  if (animating) return;
  if (!cur()) return msg('当前日期无可用卡池');
  const k = getPool(), tide = S[tideKey(k)];
  const maxN = tide + Math.floor((S.astrite + S.lunite) / 160);
  const hard = k === 'beginner' ? 50 : 80;
  const need = hard - S.pity[k];
  if (maxN <= 0) return msg('资源不足以再抽一次');
  openModal({
    title: '抽到下个五星',
    body: `当前垫数 <b>${S.pity[k]}/${hard}</b>，最多还需 <b>${need}</b> 抽必出。<br>
本次将连抽至五星出现或资源耗尽。<br><br>
预计最多消耗 <b class="a">${Math.min(maxN, need)}</b> 次（你最多可抽 <b>${maxN}</b> 次）`,
    actions: [
      { label: '取消', cls: '', fn: () => {} },
      { label: '开始', cls: 'primary', fn: () => {
          const arr = commit(() => {
            const out = [];
            const planned = Math.min(maxN, need);
            for (let i = 0; i < planned; i++) {
              const pool = getPool();
              const key = tideKey(pool);
              if (S[key] <= 0 && S.astrite < 160) {
                const missing = 160 - S.astrite;
                if (S.lunite < missing) break;
                S.lunite -= missing;
                S.astrite += missing;
              }
              const x = pull(pool, false);
              if (!x) break;
              out.push(x);
              if (x.r === 5) break;
            }
            recordPullResults(out);
            return out;
          });
          if (arr.length) showResult(arr);
          rerenderAll();
        }
      }
    ]
  });
}

// 清空抽卡日志(LogTab"清空"按钮)
export function clearLog() {
  commit(() => { S.log = []; });
}
