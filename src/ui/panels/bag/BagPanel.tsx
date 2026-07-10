// bag 面板 · Preact 主入口 · Stage 2
//
// 迁移策略(playbook step 3):
//   · UI 层完全用 Preact JSX 重写,不再拼 innerHTML 字符串
//   · 数据层继续读 src/state.js 的 S 单例,靠 sSignal(stateVersion)驱动重渲染
//   · 按钮 onClick 直接 import 调用 bagMaterialActions 纯函数
//   · Stage 6 清理阶段 window.__ 桥保留给 HTML 内联 onclick

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useS, bumpStateVersion } from '../../signals';
import { POTIONS } from '../../../daily/stamina.js';
import { ECHO_COST_CAP } from '../../../equip/echoActions.js';
import { getSetById, formatEchoStatValue } from '../../../data/echoes.js';
import { usePotion, useAllPotions, bagOpenWeaponBox, bagUseRefineStone } from '../../../ui/bag/bagMaterialActions.js';
import { bagEchoDetail, bagEchoLevelUp, bagEchoLevelUpMax, bagEchoToggleLock } from './echoActions';
import { S, msg } from '../../../state.js';
import { openModal } from '../../../modal.js';
import { renderWeaponDetail } from '../../render/weaponDetail.js';
import { levelUpWeapon, levelUpWeaponMax, unequipWeapon, refineWeapon } from '../../../equip/actions.js';

function openWeaponModal(name: string) {
  const weapon = S.weapons[name];
  if (!weapon) return;
  const canLevel = (weapon.level || 1) < 90;
  const canRefine = (weapon.spareRefine || 0) > 0 && (weapon.refine || 1) < 5;
  const actions: any[] = [];
  if (weapon.equippedBy) {
    actions.push({ label: `卸下（${weapon.equippedBy}）`, cls: '', fn: () => {
      unequipWeapon(weapon.equippedBy);
      msg(`已卸下 ${name}`, false);
      bumpStateVersion();
      openWeaponModal(name);
    }});
  }
  if (canLevel) {
    actions.push({ label: '升级', cls: 'gold', fn: () => {
      const before = weapon.level || 1;
      if (levelUpWeapon(name)) {
        msg(`${name} 升至 Lv ${weapon.level}（+${weapon.level - before} 级）`, false);
        bumpStateVersion();
        openWeaponModal(name);
      }
    }});
    actions.push({ label: '一键升满', cls: '', fn: () => {
      const n = levelUpWeaponMax(name);
      if (n > 0) {
        msg(`${name} 一键升至 Lv ${weapon.level}（升 ${n} 级）`, false);
        bumpStateVersion();
        openWeaponModal(name);
      }
    }});
  }
  if (canRefine) {
    actions.push({ label: `精炼 +1（R${weapon.refine || 1} 到 R${(weapon.refine || 1) + 1}）`, cls: 'gold', fn: () => {
      const r = refineWeapon(name);
      if (r.ok) {
        msg(`${name} 精炼 +1（现 R${r.refine}）`, false);
        bumpStateVersion();
        openWeaponModal(name);
      } else {
        msg(r.err);
      }
    }});
  }
  actions.push({ label: '关闭', cls: '', fn: () => {} });
  openModal({
    title: `${name} · Lv ${weapon.level || 1} · R${weapon.refine || 1}`,
    body: renderWeaponDetail(name, weapon),
    actions
  });
}

const ELEMENT_COLORS: Record<string, string> = {
  '热熔': '#ff8c5e', '冷凝': '#7bd6ff', '导电': '#b58cff',
  '气动': '#8de6a6', '衍射': '#fff0b0', '湮灭': '#c39bff',
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ResourceCard({ name, value, desc, color = '#fff', bgTint }: any) {
  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px',
      background: bgTint || 'rgba(255,255,255,.02)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 3, letterSpacing: '.3px' }}>{desc}</div>
    </div>
  );
}

function ResourceGroup({ title, items }: any) {
  return (
    <>
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '2px', margin: '14px 0 6px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {items.map((it: any) => <ResourceCard key={it.name} {...it} />)}
      </div>
    </>
  );
}

function PotionCard({ potion, have, canUse }: any) {
  const capTag = potion.hardCap
    ? <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 4 }}>上限 {potion.hardCap}</span>
    : null;
  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px',
      background: 'rgba(141,230,166,.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{potion.name}{capTag}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
          {potion.hardCap ? `${have}/${potion.hardCap}` : `×${have}`}
        </span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--dim)', margin: '3px 0 6px', letterSpacing: '.3px' }}>{potion.desc}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button class="mbtn" style={{ flex: 1, fontSize: 10, padding: 5 }} disabled={!canUse}
          onClick={() => usePotion(potion.id, 1)}>用 1 个</button>
        <button class="mbtn gold" style={{ flex: 1, fontSize: 10, padding: 5 }} disabled={!canUse}
          onClick={() => usePotion(potion.id, have)}>用全部</button>
      </div>
    </div>
  );
}

function WeaponCard({ name, weapon }: any) {
  const r = weapon.r || 0;
  const stars = '★'.repeat(r);
  const is5 = r === 5, is4 = r === 4;
  const spare = weapon.spareRefine || 0;
  const cardStyle = is5
    ? { borderColor: 'rgba(245,207,107,.55)', background: 'radial-gradient(circle at 50% 30%,rgba(245,207,107,.18),transparent 70%),rgba(74,54,20,.15)', boxShadow: '0 0 18px rgba(245,207,107,.18) inset,0 4px 14px rgba(245,207,107,.18)' }
    : is4
    ? { borderColor: 'rgba(195,155,255,.5)', background: 'radial-gradient(circle at 50% 30%,rgba(195,155,255,.16),transparent 70%),rgba(51,35,90,.18)', boxShadow: '0 0 16px rgba(195,155,255,.16) inset,0 4px 12px rgba(195,155,255,.18)' }
    : {};
  const starColor = is5 ? 'var(--gold)' : is4 ? 'var(--purple)' : 'var(--accent)';
  const nameColor = is5 ? 'var(--gold)' : is4 ? '#dbc6ff' : 'var(--text)';
  const starShadow = is5 ? '0 0 6px rgba(245,207,107,.6)' : is4 ? '0 0 6px rgba(195,155,255,.55)' : undefined;
  return (
    <div class={`role r${r}`}
      onClick={() => openWeaponModal(name)}
      style={{
        cursor: 'pointer', position: 'relative', aspectRatio: '1',
        border: '1px solid var(--line)', borderRadius: 10, padding: '8px 5px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        ...cardStyle,
      }}>
      {weapon.equippedBy && (
        <div style={{ position: 'absolute', top: 4, left: 5, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: 'rgba(100,220,140,.18)', color: 'var(--green)', letterSpacing: '.3px' }}>装</div>
      )}
      {(weapon.refine || 1) > 1 && (
        <div style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 5, background: 'rgba(255,255,255,.08)', color: 'var(--gold)', border: '1px solid rgba(245,207,107,.3)' }}>R{weapon.refine}</div>
      )}
      {spare > 0 && (
        <div style={{ position: 'absolute', bottom: 4, left: 5, fontSize: 7, color: 'var(--accent)', fontWeight: 600 }}>+{spare}</div>
      )}
      <div style={{ fontSize: 10, letterSpacing: '1px', textAlign: 'center', lineHeight: 1, color: starColor, textShadow: starShadow }}>{stars}</div>
      <div style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', letterSpacing: '.3px', lineHeight: 1.2, wordBreak: 'break-all', color: nameColor }}>{name}</div>
      <div style={{ fontSize: 8, color: 'var(--muted)', textAlign: 'center', letterSpacing: '.3px' }}>Lv {weapon.level || 1}</div>
    </div>
  );
}

function EchoCard({ echo }: any) {
  const set = getSetById(Array.isArray(echo.set) ? echo.set[0] : echo.set);
  const color = set?.element ? (ELEMENT_COLORS[set.element] || '#fff') : '#999';
  // 把元素色 hex 转成 rgba tint(用于背景着色)
  const tint = hexToRgba(color, 0.08);
  const glow = hexToRgba(color, 0.18);
  return (
    <div class="echo-card"
      onClick={() => bagEchoDetail(echo.id)}
      style={{
        cursor: 'pointer', position: 'relative',
        border: `1px solid ${color}`, borderRadius: 8, padding: '6px 5px',
        background: `radial-gradient(circle at 50% 30%, ${glow}, transparent 70%), ${tint}`,
        boxShadow: `0 0 12px ${glow} inset, 0 2px 8px ${hexToRgba(color, 0.12)}`,
      }}>
      {echo.equippedBy && (
        <div style={{ position: 'absolute', top: 3, left: 4, fontSize: 8, color: 'var(--green)', fontWeight: 700 }}>装:{echo.equippedBy}</div>
      )}
      <div style={{ position: 'absolute', top: 3, right: 4, fontSize: 9, color: 'var(--gold)' }}>
        {echo.lock ? '🔒' : ''}C{echo.cost}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textAlign: 'center', marginTop: 10, wordBreak: 'break-all', lineHeight: 1.1, textShadow: `0 0 6px ${glow}` }}>{echo.name}</div>
      <div style={{ fontSize: 8, color: 'var(--muted)', textAlign: 'center', marginTop: 2 }}>LV {echo.level} · {echo.element || ''}</div>
      <div style={{ fontSize: 8, color: 'var(--gold)', textAlign: 'center', marginTop: 2 }}>{echo.mainStat?.label || ''}</div>
      <div style={{ fontSize: 8, color: 'var(--gold)', textAlign: 'center' }}>
        {echo.mainStat ? formatEchoStatValue(echo.mainStat.key, echo.mainStat.value) : ''}
      </div>
      <div style={{ fontSize: 8, color, textAlign: 'center', marginTop: 1, letterSpacing: '.3px' }}>{set?.name || ''}</div>
      <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}>
        <button class="mbtn" style={{ fontSize: 9, padding: '2px 6px' }}
          onClick={() => bagEchoLevelUp(echo.id)}>升级</button>
        <button class="mbtn gold" style={{ fontSize: 9, padding: '2px 6px' }}
          onClick={() => bagEchoLevelUpMax(echo.id)}>升满</button>
        <button class="mbtn" style={{ fontSize: 9, padding: '2px 6px' }}
          onClick={() => bagEchoToggleLock(echo.id)}>{echo.lock ? '解锁' : '锁定'}</button>
      </div>
    </div>
  );
}

export function BagPanel() {
  const S = useS();

  const groups = [
    {
      title: '货 币',
      items: [
        { name: '星声',   value: S.astrite.toLocaleString(),  desc: '抽卡 / 商店主货币',   color: '#fff' },
        { name: '月相',   value: S.lunite,                    desc: '充值货币 · 可换星声', color: 'var(--gold)' },
        { name: '月卡剩余', value: S.days + ' 天',           desc: '月相观测卡天数',      color: 'var(--green)' },
      ],
    },
    {
      title: '抽 卡 资 源',
      items: [
        { name: '浮金波纹', value: S.radiant,     desc: '角色活动卡池抽卡券',   color: 'var(--r-radiant)' },
        { name: '铸潮波纹', value: S.forging,     desc: '武器活动卡池抽卡券',   color: 'var(--r-forging)' },
        { name: '唤声涡纹', value: S.lustrous,    desc: '常驻卡池抽卡券',       color: 'var(--r-lustrous)' },
        { name: '捕梦波纹', value: S.dream || 0,  desc: '联动角色卡池抽卡券',   color: 'var(--purple)' },
        { name: '铭影波纹', value: S.mirage || 0, desc: '联动武器卡池抽卡券',   color: 'var(--accent)' },
      ],
    },
    {
      title: '海 市 珊 瑚',
      items: [
        { name: '余波珊瑚', value: S.afterglow,  desc: '抽到角色武器获得 · 换波纹/回音频段', color: 'var(--accent)' },
        { name: '残振珊瑚', value: S.oscillated, desc: '抽到三星获得 · 换波纹',          color: 'var(--purple)' },
      ],
    },
    {
      title: '养 成 材 料',
      items: [
        { name: '特级共鸣促剂', value: S.materials.exp_super  || 0, desc: '20000 共鸣者经验', color: 'var(--gold)' },
        { name: '高级共鸣促剂', value: S.materials.exp_high   || 0, desc: '8000 共鸣者经验',  color: '#fff' },
        { name: '中级共鸣促剂', value: S.materials.exp_mid    || 0, desc: '3000 共鸣者经验',  color: 'var(--accent)' },
        { name: '初级共鸣促剂', value: S.materials.exp_low    || 0, desc: '1000 共鸣者经验',  color: 'var(--green)' },
        { name: '武器突破石',   value: S.materials.weapon_book|| 0, desc: '武器升级材料',     color: 'var(--gold)' },
      ],
    },
    {
      title: '体 力',
      items: [
        { name: '结晶波片', value: `${S.stamina} / ${S.staminaMax}`, desc: '副本消耗 · 跨日补满', color: 'var(--green)' },
      ],
    },
  ];

  const potionEntries = Object.values(POTIONS);
  const totalPotions = Object.keys(POTIONS).reduce((a, k) => a + (S.materials[k] || 0), 0);
  const showUseAll = totalPotions > 0 && S.stamina < 480;

  const pendingBox = S.podcast?.pendingWeaponBox || 0;
  const pendingRefine = S.podcast?.pendingRefine || 0;

  const weapons = Object.entries(S.weapons || {}).sort((a: any, b: any) => {
    const ra = b[1].r || 0, rb = a[1].r || 0;
    if (ra !== rb) return ra - rb;
    const la = b[1].level || 0, lb = a[1].level || 0;
    if (la !== lb) return la - lb;
    return (b[1].refine || 1) - (a[1].refine || 1);
  });

  const echos = S.echos || [];
  const cap = ECHO_COST_CAP;
  const [echoSearch, setEchoSearch] = useState('');
  const [echoSort, setEchoSort] = useState<'level'|'cost'|'set'>('level');
  const [echoCostFilter, setEchoCostFilter] = useState<number | null>(null);
  const filteredEchoes = echos.filter(e => {
    if (echoCostFilter && e.cost !== echoCostFilter) return false;
    if (echoSearch) {
      const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
      const hay = (e.name || '') + (set?.name || '') + (e.element || '');
      if (!hay.includes(echoSearch)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (echoSort === 'level') return (b.level || 1) - (a.level || 1);
    if (echoSort === 'cost') return (b.cost || 0) - (a.cost || 0);
    const setA = getSetById(Array.isArray(a.set) ? a.set[0] : a.set)?.name || '';
    const setB = getSetById(Array.isArray(b.set) ? b.set[0] : b.set)?.name || '';
    return setA.localeCompare(setB);
  });

  return (
    <div>
      <h2 class="col-head" style={{ marginTop: 0 }}>背 包</h2>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, letterSpacing: '.5px' }}>
        所有当前持有的资源和材料
      </div>

      {groups.map(g => <ResourceGroup key={g.title} {...g} />)}

      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '2px', margin: '14px 0 6px' }}>体 力 药 剂</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {potionEntries.map((p: any) => {
          const have = S.materials[p.id] || 0;
          const canUse = have > 0 && S.stamina < 480;
          return <PotionCard key={p.id} potion={p} have={have} canUse={canUse} />;
        })}
      </div>

      {showUseAll && (
        <button class="mbtn gold" style={{ width: '100%', marginTop: 8 }}
          onClick={() => useAllPotions()}>
          🧪 一键嗑光所有药剂（{totalPotions} 个）
        </button>
      )}

      {(pendingBox > 0 || pendingRefine > 0) && (
        <>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '2px', margin: '14px 0 6px' }}>特 殊 道 具</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {pendingBox > 0 && (
              <div style={{
                border: '1px solid rgba(245,207,107,.45)', borderRadius: 8, padding: '9px 11px',
                background: 'rgba(245,207,107,.07)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>4★ 武器自选箱</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>×{pendingBox}</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--dim)', margin: '3px 0 6px', letterSpacing: '.3px' }}>来自先约电台 · 5 选 1</div>
                <button class="mbtn gold" style={{ width: '100%', fontSize: 10, padding: 5 }}
                  onClick={() => bagOpenWeaponBox()}>开启</button>
              </div>
            )}
            {pendingRefine > 0 && (
              <div style={{
                border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px',
                background: 'rgba(195,155,255,.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)' }}>烙金银杏（精炼石）</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--purple)' }}>×{pendingRefine}</span>
                </div>
                <div style={{ fontSize: 9, color: 'var(--dim)', margin: '3px 0 6px', letterSpacing: '.3px' }}>用于精炼 4★ 自选武器（从背包选择）</div>
                <button class="mbtn" style={{ width: '100%', fontSize: 10, padding: 5 }}
                  onClick={() => bagUseRefineStone()}>选择武器</button>
              </div>
            )}
          </div>
        </>
      )}

      {weapons.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '2px', margin: '14px 0 6px' }}>
            已 拥 有 武 器 ({weapons.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(85px,1fr))', gap: 6 }}>
            {weapons.map(([name, w]: any) => <WeaponCard key={name} name={name} weapon={w} />)}
          </div>
        </>
      )}

      <div style={{
        fontSize: 10, color: 'var(--muted)', letterSpacing: '2px', margin: '14px 0 6px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span>声 骸 仓 库 ({filteredEchoes.length}{filteredEchoes.length !== echos.length ? `/${echos.length}` : ''})</span>
        <span style={{ fontSize: 9, color: 'var(--gold)' }}>COST 上限 {cap}</span>
      </div>
      {echos.length === 0 ? (
        <div style={{
          border: '1px dashed var(--line2)', borderRadius: 8, padding: 14,
          textAlign: 'center', color: 'var(--dim)', fontSize: 11,
        }}>
          暂无声骸。前往「冒险 · 副本 · 无音区」战斗掉落获取。
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="搜名字/套装..." value={echoSearch}
              onInput={(e: any) => setEchoSearch(e.target.value)}
              style={{ flex: 1, minWidth: 100, padding: '4px 8px', fontSize: 11, background: 'rgba(255,255,255,.04)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)' }} />
            <select value={echoSort} onChange={(e: any) => setEchoSort(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(255,255,255,.04)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--text)' }}>
              <option value="level">按等级</option>
              <option value="cost">按 COST</option>
              <option value="set">按套装</option>
            </select>
            {[4, 3, 1].map(c => (
              <button class={`mbtn ${echoCostFilter === c ? 'gold' : ''}`} style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => setEchoCostFilter(echoCostFilter === c ? null : c)}>C{c}</button>
            ))}
            {echoCostFilter !== null && (
              <button class="mbtn" style={{ fontSize: 10, padding: '3px 8px' }}
                onClick={() => setEchoCostFilter(null)}>✕</button>
            )}
          </div>
          {filteredEchoes.length === 0 ? (
            <div style={{
              border: '1px dashed var(--line2)', borderRadius: 8, padding: 14,
              textAlign: 'center', color: 'var(--dim)', fontSize: 11,
            }}>
              没有匹配的声骸
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 6 }}>
              {filteredEchoes.map((e: any) => <EchoCard key={e.id} echo={e} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
