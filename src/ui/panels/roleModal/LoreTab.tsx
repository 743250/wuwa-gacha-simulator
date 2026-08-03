// 角色故事 + 好感语音 tab · 数据来自 encore.moe API(scripts/build-character-lore.cjs)
// 故事/语音条目默认折叠,点击标题才展开内容——数据量大时避免一次性渲染过多 DOM。
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getCharacterLore } from '../../../data/characterLore.js';
import { playUrl } from '../../assets/audio.ts';

interface LoreEntry {
  bio?: string;
  stories: { title: string; content: string; hint?: string }[];
  words: { title: string; content: string; voiceZh?: string }[];
}

const EMPTY: LoreEntry = { bio: '', stories: [], words: [] };

// 折叠行组件:点标题切换展开
function CollapseRow({ title, extra, children }: { title: string; extra?: any; children: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div class={`lore-row${open ? ' open' : ''}`}>
      <div class="lore-row-head" onClick={() => setOpen(o => !o)}>
        <span class="lore-row-arrow">{open ? '▾' : '▸'}</span>
        <span class="lore-row-title">{title}</span>
        <span class="lore-row-extra">{extra}</span>
      </div>
      {open && <div class="lore-row-body">{children}</div>}
    </div>
  );
}

export function LoreTab({ roleName }: { roleName: string }) {
  const [lore, setLore] = useState<LoreEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    getCharacterLore(roleName).then((d: LoreEntry | null) => {
      if (!alive) return;
      setLore(d || EMPTY);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [roleName]);

  if (!loaded) {
    return <div class="lore-loading">载入角色资料…</div>;
  }

  return (
    <div class="lore-tab">
      {lore.bio && (
        <div class="lore-bio">
          <div class="lore-sec-title">▸ 角色档案</div>
          <p>{lore.bio}</p>
        </div>
      )}

      <div class="lore-sec-title">▸ 角色故事</div>
      {lore.stories.length === 0
        ? <div class="lore-empty">暂无故事。</div>
        : lore.stories.map((s, i) => (
            <CollapseRow key={i} title={s.title} extra={s.hint || undefined}>
              <p class="lore-story-body">{s.content}</p>
            </CollapseRow>
          ))}

      <div class="lore-sec-title">▸ 好感语音</div>
      {lore.words.length === 0
        ? <div class="lore-empty">暂无语音。</div>
        : lore.words.map((w, i) => (
            <CollapseRow
              key={i}
              title={w.title}
              extra={w.voiceZh && (
                <button class="lore-play" type="button" onClick={(e: any) => { e.stopPropagation(); playUrl(w.voiceZh!); }}>▶ 播放</button>
              )}
            >
              <p class="lore-word-body">{w.content}</p>
            </CollapseRow>
          ))}
    </div>
  );
}
