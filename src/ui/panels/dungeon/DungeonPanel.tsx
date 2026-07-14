// 副本面板 · Preact 主入口 · Stage 3.2
//
// 迁移策略(playbook step 3):
//   · innerHTML → Preact JSX,保留全部 CSS class 和布局
//   · 数据层继续读 src/state.js 的 S,靠 sSignal(stateVersion)驱动重渲染
//   · 按钮 onClick 调 import 来的纯函数
//   · _dungeonTab 状态在 src/ui/dungeon.js shim 中持有,通过 getDungeonTab 读取
//
// @vitest-environment happy-dom

import { h } from 'preact';
import { useS } from '../../signals';
import {
  DUNGEONS, WEEKLY_BOSS_LIMIT, SOL3_LEVELS,
  parseEnemyStr, getDungeonEncounter, getSol3Level, getSol3Config,
  getDungeonEnemyLevel, isDungeonUnlocked, getWeeklyBossUsed, canUseWeeklyBoss,
} from '../../../battle/dungeon.js';
import { getCombatTeamNames } from '../../../battle/combat.js';
import { ENEMIES, formatEnemyMechanic } from '../../../battle/enemies.js';
import { ELEMENT_COLOR } from '../../../battle/elements.js';
import { getSetById, formatSetBonus } from '../../../data/echoes.js';

function escAttr(s: string): string {
  // data-tip 用 innerHTML 解析，保留 <b>/<br> 等 HTML 标签，只转义会破坏属性值的 " 和 &
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
import { getDungeonTab, dungeonSwitchTab, setSol3 } from './actions';
import { usePotion, buyStamina } from '../../../ui/bag/bagMaterialActions.js';
import { startDungeonBattle } from '../../../ui/battle.js';

// WEEKLY_BOSS 合入 DUNGEONS 的副作用由 ./actions.ts 在 import 时触发,这里不再重复

const DROP_LABEL: Record<string, { name: string; color: string }> = {
  exp_super: { name: '特级共鸣促剂', color: 'var(--gold)' },
  exp_high:  { name: '高级共鸣促剂', color: '#fff' },
  exp_mid:   { name: '中级共鸣促剂', color: 'var(--accent)' },
  exp_low:   { name: '初级共鸣促剂', color: 'var(--green)' },
  weapon_book: { name: '武器突破石', color: 'var(--gold)' },
  astrite:   { name: '星声', color: 'var(--gold)' },
  echo_tuner: { name: '声骸调谐器', color: 'var(--accent)' },
};

const DUNGEON_GROUPS = [
  { type: 'exp',       key: 'exp',     label: '模拟战训', sub: '角色经验' },
  { type: 'weapon',    key: 'weapon',  label: '锻造挑战', sub: '武器材料' },
  { type: 'echo',      key: 'echo',    label: '无音区',   sub: '声骸养成' },
  { type: 'worldBoss', key: 'boss',    label: '世界BOSS', sub: '60波片/次' },
  { type: 'weekly',    key: 'weekly',  label: '战歌重奏', sub: '周限3次' },
];

// ===== JSX Helpers =====

function intersperse(items: any[], sep: any): any[] {
  const out: any[] = [];
  items.forEach((item, i) => {
    if (i > 0) out.push(typeof sep === 'string' ? sep : h(sep, { key: `sep${i}` }));
    out.push(item);
  });
  return out;
}

function DropsDisplay({ drops }: { drops: any }) {
  if (!drops) return null;
  const parts: any[] = [];
  for (const [k, v] of Object.entries(drops)) {
    if (k === 'echo_set' || k === 'echo_count') continue;
    const d = DROP_LABEL[k as string];
    if (!d) continue;
    parts.push(<span key={k} style={{ color: d.color }}>{d.name} x{String(v)}</span>);
  }
  if (drops.echo_set) {
    const setIds = Array.isArray(drops.echo_set) ? drops.echo_set : [drops.echo_set];
    const cnt = drops.echo_count || 1;
    const setSpans = setIds.map((sid: string) => {
      const set = getSetById(sid);
      if (!set) return <span key={sid}>{sid}</span>;
      const b2 = formatSetBonus(set.bonus2);
      const b5 = formatSetBonus(set.bonus5);
      const tip = escAttr(`<b style="color:var(--accent)">${set.name}</b>${set.element ? `（${set.element}）` : ''}<br>` +
        `<b>2 件</b>：${b2 || '无'}<br>` +
        `<b>5 件</b>：${b5 || '无'}`);
      return (
        <span key={sid} class="tip" data-tip={tip} style={{ color: 'var(--accent)', cursor: 'help', textDecoration: 'underline dotted' }}>
          {set.name}
        </span>
      );
    });
    if (setSpans.length) {
      parts.push(<span key="eset">声骸 x{cnt}（{setSpans}）</span>);
    }
  }
  if (parts.length === 0) return null;
  return <>{intersperse(parts, ' · ')}</>;
}

function EnemyDisplay({ enemyStrs }: { enemyStrs: string[] }) {
  const parts = enemyStrs.map(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) {
      return <span key={p.name}>{p.name}{p.count > 1 ? `x${p.count}` : ''}</span>;
    }
    const ec = ELEMENT_COLOR[e.element] || '#fff';
    return (
      <span key={p.name}>
        <span style={{ color: ec }}>{p.name}</span>
        {p.count > 1 && <span style={{ color: 'var(--muted)' }}>x{p.count}</span>}
      </span>
    );
  });
  return <>{intersperse(parts, ' · ')}</>;
}

function MechanicDisplay({ enemyStrs }: { enemyStrs: string[] }) {
  const seen = new Set<string>();
  const items: any[] = [];
  enemyStrs.forEach(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    const text = formatEnemyMechanic(e?.mechanic);
    if (!text || seen.has(`${p.name}:${text}`)) return;
    seen.add(`${p.name}:${text}`);
    items.push(<span key={p.name}>{p.name}: {text}</span>);
  });
  if (items.length === 0) return null;
  return <>{intersperse(items, ' · ')}</>;
}

function DungeonCard({ d }: { d: any }) {
  const S = useS();
  const encounter = getDungeonEncounter(d, S.today);
  const isWeekly = !!d.weeklyLimit;
  const isWorldBoss = d.type === 'worldBoss';
  const curLv = getDungeonEnemyLevel(d);
  const teamCount = getCombatTeamNames().length;
  const canAfford = S.stamina >= d.cost && teamCount > 0 && (!isWeekly || canUseWeeklyBoss());
  const minLv = d.minLevel ? <span>{d.minLevel}+</span> : null;
  const costLine = d.cost > 0
    ? <><b>{d.cost}</b> 波片</>
    : '不耗波片';
  const disabledLabel = S.stamina < d.cost
    ? `缺 ${d.cost - S.stamina} 体力`
    : (isWeekly && !canUseWeeklyBoss() ? '本周已满' : '需编队');
  const mechanics = MechanicDisplay({ enemyStrs: encounter.enemies });
  const sol3 = getSol3Config(getSol3Level());
  const rawDrops = d.drops;
  let displayDrops;
  if (rawDrops) {
    displayDrops = {};
    for (const [k, v] of Object.entries(rawDrops)) {
      displayDrops[k] = (k === 'astrite' || k === 'echo_set' || k === 'echo_count')
        ? v : Math.round((v as number) * sol3.dropMult);
    }
  }

  const cardClass = isWeekly ? 'dng-card weekly' : 'dng-card';

  return (
    <article class={cardClass}>
      <div class="dng-card-top">
        <div>
          <div class="dng-card-name">{d.name}</div>
          <div class="dng-card-meta">{costLine}{minLv}</div>
        </div>
        <button class="mbtn gold"
          disabled={!canAfford}
          onClick={() => startDungeonBattle(d.id)}>
          {canAfford ? '挑战' : disabledLabel}
        </button>
      </div>
      <div class="dng-encounter">
        <div class="dng-label">{isWorldBoss ? '讨伐目标' : '守关 BOSS'}</div>
        <div class="dng-enemies"><EnemyDisplay enemyStrs={encounter.enemies} /></div>
        {mechanics && <div class="dng-mechanics">{mechanics}</div>}
        <div class="dng-pool">敌人等级 <b style={{ color: 'var(--gold)' }}>Lv{curLv}</b></div>
      </div>
      <div class="dng-drops">
        <div class="dng-label">奖励</div>
        <div><DropsDisplay drops={displayDrops} /></div>
      </div>
    </article>
  );
}

// ===== Main Panel =====

export function DungeonPanel() {
  const S = useS();
  const teamCount = getCombatTeamNames().length;
  const solvent = S.materials?.crystal_solvent || 0;
  const crystal = S.materials?.waveplate_crystal || 0;
  const POT_CAP = 480;
  const curTab = getDungeonTab();

  const weeklyUsed = getWeeklyBossUsed();
  const weeklyLeft = Math.max(0, WEEKLY_BOSS_LIMIT - weeklyUsed);
  const curSol3 = getSol3Level();
  const curSol3Cfg = getSol3Config(curSol3);

  const paidDungeons = DUNGEONS.filter((d: any) => d.cost > 0);
  const minCost = paidDungeons.length ? Math.min(...paidDungeons.map((d: any) => d.cost)) : 0;

  const group = DUNGEON_GROUPS.find(g => g.key === curTab);
  const filteredList = group
    ? DUNGEONS.filter((d: any) => d.type === group.type && isDungeonUnlocked(d))
    : [];

  const staminaPct = S.staminaMax > 0 ? ((S.stamina / S.staminaMax) * 100).toFixed(1) : '0';

  return (
    <div>
      {/* ===== 体力条 ===== */}
      <div class="dng-top">
        <div class="dng-stamina">
          <div class="dng-stamina-label">结晶波片</div>
          <div class="dng-stamina-value">{S.stamina} / {S.staminaMax}</div>
          <div class="dng-stamina-bar"><i style={{ width: `${staminaPct}%` }}></i></div>
          <div class="dng-stamina-note">跨日自然恢复 · 溢出转单质 · 溶剂可超充至 {POT_CAP}</div>
        </div>
        <div class="dng-actions">
          <button class="mbtn"
            disabled={crystal <= 0 || S.stamina >= S.staminaMax}
            onClick={() => usePotion('waveplate_crystal', Math.min(crystal, Math.max(0, S.staminaMax - S.stamina)))}>
            单质 {crystal}/480
          </button>
          <button class="mbtn gold"
            disabled={solvent <= 0 || S.stamina >= POT_CAP}
            onClick={() => usePotion('crystal_solvent', 1)}>
            溶剂 x{solvent}
          </button>
          <button class="mbtn"
            disabled={S.astrite < 60 || S.stamina >= POT_CAP}
            onClick={() => buyStamina()}>
            60⭐ 补体力
          </button>
        </div>
      </div>

      {/* ===== 体力不足提示 ===== */}
      {minCost > 0 && S.stamina < minCost && (
        <div class="dng-alert">当前结晶波片不足，至少需要 {minCost} 点。可兑换结晶单质 / 使用结晶溶剂，或推进到下一日恢复。</div>
      )}
      {teamCount === 0 && (
        <div class="dng-alert red">编队为空或队员已失效，先去【编队】面板组队</div>
      )}

      {/* ===== SOL3 世界等级选择器 ===== */}
      <div class="dng-sol3" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px' }}>世界等级</span>
        {Object.entries(SOL3_LEVELS).map(([lv, cfg]: any) => {
          const active = Number(lv) === curSol3;
          return (
            <button key={lv}
              class={`mbtn ${active ? 'gold' : ''}`}
              style={{ fontSize: 10, padding: '4px 10px' }}
              disabled={active}
              onClick={() => setSol3(Number(lv))}>
              {cfg.name}
            </button>
          );
        })}
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          Lv{curSol3Cfg.levelMin}-{curSol3Cfg.levelMax} · 掉落 x{curSol3Cfg.dropMult.toFixed(1)}
        </span>
      </div>

      {/* ===== 左右布局 ===== */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* 左侧 Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 80 }}>
          {DUNGEON_GROUPS.map(g => {
            const active = curTab === g.key;
            const color = g.key === 'weekly'
              ? 'var(--gold)'
              : g.key === 'boss'
                ? '#ff8c5e'
                : 'var(--accent)';
            const count = DUNGEONS.filter((d: any) => d.type === g.type && isDungeonUnlocked(d)).length;
            return (
              <div key={g.key}
                onClick={() => dungeonSwitchTab(g.key)}
                style={{
                  cursor: 'pointer',
                  border: `2px solid ${active ? color : 'var(--line)'}`,
                  borderRadius: 10, padding: '9px 6px', textAlign: 'center',
                  background: active ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)',
                  transition: '.15s',
                }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: active ? color : 'var(--text)' }}>
                  {g.label}
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                  {g.key === 'weekly' ? `剩余 ${weeklyLeft}/${WEEKLY_BOSS_LIMIT}` : `${count} 个副本`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧内容 */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', maxHeight: '55vh' }}>
          {filteredList.map((d: any) => <DungeonCard key={d.id} d={d} />)}
          {filteredList.length === 0 && (
            <div style={{ color: 'var(--dim)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              当前分类无可挑战的副本
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
