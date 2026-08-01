// 音频管理器 · UI 层
//
// 统一管理抽卡音效 / BGM,天然处理浏览器自动播放策略(需用户手势 unlock)。
// 骨架阶段 SOUNDS 为空,sfx/music/stopMusic/setVolume 全部静默 no-op,不破坏现有行为。
//
// 接入步骤:
//   1. 把音频文件放进 public/assets/audio/,在 SOUNDS 里登记路径(loop 标记 BGM)
//   2. 首次用户手势处已由 main.js 调 unlock()(指针/键盘事件,一次性)
//   3. 需要播的地方调用 sfx('reveal') / music('menu') / stopMusic()
//
// 注意:AudioContext 在 node/happy-dom 测试环境不存在,所有路径都有守卫,不抛错。

export interface SoundRef {
  src: string;
  loop?: boolean;
  volume?: number;
}

export const SOUNDS: Record<string, SoundRef> = {
  // 'reveal': { src: '/assets/audio/reveal.mp3', volume: 0.8 },
  // 'reveal_close': { src: '/assets/audio/reveal_close.mp3', volume: 0.7 },
  // 'banner': { src: '/assets/audio/banner.mp3', loop: true, volume: 0.4 },
};

const _el: Record<string, HTMLAudioElement> = {};
let _ctx: AudioContext | null = null;

function ensureEl(name: string): HTMLAudioElement | null {
  const cached = _el[name];
  if (cached) return cached;
  const cfg = SOUNDS[name];
  if (!cfg || typeof Audio === 'undefined') return null;
  const a = new Audio(cfg.src);
  if (cfg.loop) a.loop = true;
  if (cfg.volume !== undefined) a.volume = cfg.volume;
  _el[name] = a;
  return a;
}

// 必须在用户手势内调用一次(浏览器自动播放策略),main.js 已挂一次性监听。
export function unlock(): void {
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctor) _ctx = new Ctor();
  } catch {
    _ctx = null;
  }
  Object.keys(SOUNDS).forEach(n => ensureEl(n));
}

export function sfx(name: string): void {
  const a = ensureEl(name);
  if (!a) return;
  if (_ctx && _ctx.state === 'suspended') void _ctx.resume();
  a.currentTime = 0;
  void a.play().catch(() => {});
}

// BGM:SOUNDS[name].loop 控制是否循环;切场景时先 stopMusic() 再 music(new)
export function music(name: string): void {
  sfx(name);
}

// 播放一次性外部音频 URL(角色好感语音等)。须在用户手势内调用(浏览器自动播放策略)。
// 互斥:同一时刻只播一条,播新语音前先停旧的,避免多语音叠放。
let _currentVoice: HTMLAudioElement | null = null;

export function playUrl(url: string): void {
  stopUrl();
  if (typeof Audio === 'undefined') return;
  try {
    const a = new Audio(url);
    _currentVoice = a;
    void a.play().catch(() => {
      _currentVoice = null;
    });
  } catch {
    _currentVoice = null;
  }
}

export function stopUrl(): void {
  if (_currentVoice) {
    try {
      _currentVoice.pause();
      _currentVoice.currentTime = 0;
    } catch {
      /* ignore */
    }
    _currentVoice = null;
  }
}

export function stopMusic(): void {
  Object.values(_el).forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

export function setVolume(v: number): void {
  Object.values(_el).forEach(a => { a.volume = v; });
}
