// 先约电台任务表
// 三类：每日（每天重置）/ 每周（周一重置）/ 本期（版本结束重置）
// 完成方式：游戏内各 hook 主动调用 completeTask(id) 或 addCounter(id, n)
//
// 任务 id 命名规范：
//   d_xxx = daily, w_xxx = weekly, p_xxx = period
//
// 字段说明：
//   id        唯一标识
//   name      显示名
//   exp       完成给的电台经验
//   target    需要累积到的次数（1 = 单次完成型）
//   bucket    'daily' | 'weekly' | 'period'

export const PODCAST_TASKS = {
  // ============ 每日（合计 ~330 EXP / 天 = 约 1/3 级）============
  // 42 天 × 330 ≈ 14 级（仅每日）
  daily: [
    { id: 'd_signin',    name: '每日签到',          exp: 50,  target: 1   },
    { id: 'd_commission',name: '完成日常委托',      exp: 20,  target: 4   },  // 4 个小委托 × 20 = 80
    { id: 'd_challenge', name: '完成挑战委托',      exp: 50,  target: 1   },
    { id: 'd_dungeon',   name: '完成 1 次副本',     exp: 50,  target: 1   },
    { id: 'd_stamina',   name: '消耗 60 体力',      exp: 40,  target: 60  },
    { id: 'd_pull',      name: '唤取 1 次',         exp: 20,  target: 1   },
    { id: 'd_upgrade',   name: '升级角色或武器 1 次', exp: 40, target: 1   }
  ],
  // ============ 每周（合计 ~3000 EXP / 周 = 3 级）============
  // 6 周 × 3000 = 18 级
  weekly: [
    { id: 'w_commission',  name: '累计完成 21 个委托', exp: 500, target: 21 },
    { id: 'w_dungeon',     name: '通关 3 次副本',       exp: 500, target: 3  },
    { id: 'w_weeklyboss',  name: '击败 1 次周 BOSS',    exp: 800, target: 1  },
    { id: 'w_abyss',       name: '深塔通关 5 层',       exp: 800, target: 5  },
    { id: 'w_levelup',     name: '角色累计升级 +10',    exp: 400, target: 10 }
  ],
  // ============ 本期（一个版本周期一次性 ≈ 35 级）============
  // 大件本期任务给大头，鼓励玩家把游戏内容做完
  period: [
    { id: 'p_pull50',      name: '累计唤取 50 次',     exp: 3000, target: 50  },
    { id: 'p_pull200',     name: '累计唤取 200 次',    exp: 8000, target: 200 },
    { id: 'p_five',        name: '获得 1 个五星',      exp: 3000, target: 1   },
    { id: 'p_weeklyboss',  name: '击败 10 次周 BOSS',  exp: 6000, target: 10  },
    { id: 'p_abyss',       name: '深塔通关 10 层',     exp: 8000, target: 10  },
    { id: 'p_char90',      name: '把 1 个角色升到 90', exp: 3000, target: 1   },
    { id: 'p_weapon90',    name: '把 1 把武器升到 90', exp: 4000, target: 1   }
  ]
};

// 按 id 查找任务定义
export function findTask(id) {
  for (const bucket of Object.keys(PODCAST_TASKS)) {
    const t = PODCAST_TASKS[bucket].find(x => x.id === id);
    if (t) return { ...t, bucket };
  }
  return null;
}
