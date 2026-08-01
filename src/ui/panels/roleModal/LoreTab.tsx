// 角色故事 + 好感语音 tab · 数据来自 encore.moe API(scripts/build-character-lore.cjs)
// 数据量较大,走 getCharacterLore 动态 import,初次进入有短暂加载态。
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
            <div class="lore-story" key={i}>
              <div class="lore-story-head">
                <span class="lore-story-title">{s.title}</span>
                {s.hint && <span class="lore-story-hint">{s.hint}</span>}
              </div>
              <div class="lore-story-body">{s.content}</div>
            </div>
          ))}

      <div class="lore-sec-title">▸ 好感语音</div>
      {lore.words.length === 0
        ? <div class="lore-empty">暂无语音。</div>
        : lore.words.map((w, i) => (
            <div class="lore-word" key={i}>
              <div class="lore-word-head">
                <span class="lore-word-title">{w.title}</span>
                {w.voiceZh && (
                  <button class="lore-play" type="button" onClick={() => playUrl(w.voiceZh)}>▶ 播放</button>
                )}
              </div>
              <div class="lore-word-body">{w.content}</div>
            </div>
          ))}
    </div>
  );
}
