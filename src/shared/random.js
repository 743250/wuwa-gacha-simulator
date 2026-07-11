// 随机工具(纯函数,无 DOM/状态依赖)
export const pick = a => a[Math.floor(Math.random() * a.length)];

// Phase 3 步骤 C:可注入随机源的 pick —— 让 pullOne 等领域函数可单测。
// rng 是返回 [0, 1) 的函数,默认 Math.random,行为与 pick() 完全一致。
export const pickRng = (a, rng = Math.random) => a[Math.floor(rng() * a.length)];
