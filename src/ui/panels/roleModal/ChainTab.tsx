import { h } from 'preact';
import { activateChain } from '../../../ui/render/roleModal.js';

interface SeqLine {
  name: string;
  desc: string;
}

interface ChainTabProps {
  roleName: string;
  chain: number;
  spare: number;
  bought?: number;
  preview: boolean;
  previewNote: string;
  seqLines: SeqLine[];
}

export function ChainTab({ roleName, chain, spare, bought = 0, preview, previewNote, seqLines }: ChainTabProps) {
  const canUp = !preview && spare > 0 && chain < 6;

  let buttonLabel: string;
  if (preview) {
    buttonLabel = '0 链基础效果';
  } else if (chain >= 6) {
    buttonLabel = '已满 6 链';
  } else if (canUp) {
    buttonLabel = `✦ 激活 ${chain + 1} 链（消耗 1 回音频段）`;
  } else {
    buttonLabel = '无回音频段';
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: previewNote }} />

      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5, textAlign: 'center', margin: '0 0 8px' }}>
        共鸣链 <b style={{ color: 'var(--gold)' }}>{chain}/6</b> · 回音频段 <b style={{ color: 'var(--accent)' }}>{spare}</b>
        {bought > 0 ? ` · 海市兑换 ${bought}/2` : ''}
      </div>

      <div class="chain" style={{ textAlign: 'center' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <i key={i} class={i <= chain ? 'on' : ''} style={{ margin: '0 4px', opacity: i <= chain ? 1 : 0.4 }}>{i}链</i>
        ))}
      </div>

      <div style={{ margin: '10px 0', textAlign: 'center' }}>
        <button class={`mbtn ${canUp ? 'gold' : ''}`}
          onClick={() => activateChain(roleName)}
          disabled={!canUp && !preview && chain < 6}>
          {buttonLabel}
        </button>
      </div>

      {seqLines.length > 0 ? (
        <div class="seq-detail">
          {seqLines.map((L, i) => (
            <div key={i} class={`seq-line ${i < chain ? 'owned' : ''}`}
              style={{ marginBottom: 8, opacity: i < chain ? 1 : 0.5 }}>
              <b class={`seq-name ${i < chain ? 'owned' : ''}`}
                style={{ color: i < chain ? 'var(--gold)' : 'var(--muted)' }}>
                {i + 1}链 · {L.name}
              </b>
              <div class="seq-desc" style={{ fontSize: 12, color: 'var(--dim)', marginTop: 3, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: L.desc }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--dim)', textAlign: 'center', padding: 10 }}>暂无共鸣链文案</div>
      )}
    </div>
  );
}
