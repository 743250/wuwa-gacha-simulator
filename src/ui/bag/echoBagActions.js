// 声骸仓库交互 handler 组（详情/升级/分解/喂料/调谐等）
// Stage 6.2: modal body 改为 Preact VNode，闭包 onClick 代替 window.__ 桥
import { S, msg } from '../../state.js';
import { rerenderAll } from '../../rerender.js';
import { openModal, closeModal } from '../../modal.js';
import { h } from 'preact';
import { levelUpEcho, levelUpEchoMax, recycleEcho, previewRecycleEcho, toggleEchoLock, unequipEcho, unequipSlot, equipEcho, getEquippableEchoes, echoToNext, retuneEchoSubStat, levelUpEchoWithFeed, previewEchoFeed } from '../../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus, getSubStatRange } from '../../data/echoes.js';
import { totalExp } from '../../equip/actions.js';

export function registerEchoBagActions({ renderBag }) {
  // 标记详情 modal 是否从角色面板进入（关闭时回到角色声骸面板）
  let _echoDetailFromRole = false;

  const bagEchoDetail = (id, fromRole = false) => {
    _echoDetailFromRole = !!fromRole;
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const box = document.getElementById('modalBox');
    const wasSameEcho = box && box.dataset.echoId === String(id);
    const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);

    const subRows = (e.subStats && e.subStats.length
      ? e.subStats.map((s, idx) => {
          if (s.unlocked === false) {
            return h('div', { style: 'display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dashed var(--line);opacity:.5' },
              h('span', { style: 'color:var(--dim)' }, `??? · 未解锁（升至 LV ${(idx+1)*5} 解锁）`),
              h('span', { style: 'color:var(--dim)' }, '—')
            );
          }
          const tuner = S.materials.echo_tuner || 0;
          const rng = getSubStatRange(s.key, s.value);
          const rangeLine = rng
            ? h('div', { style: 'font-size:9px;color:var(--dim);text-align:right;line-height:1.3' },
                `区间 ${rng.minStr}~${rng.maxStr}`,
                rng.pct != null ? h('span', { style: `color:${rng.pct >= 66 ? 'var(--green)' : rng.pct >= 33 ? 'var(--gold)' : 'var(--muted)'}` }, ` · ${rng.pct}%`) : ''
              )
            : null;
          return h('div', { style: 'border-bottom:1px dashed var(--line);padding:3px 0' },
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;font-size:11px' },
              h('span', { style: 'color:var(--muted)' }, s.label),
              h('span', { style: 'display:flex;align-items:center;gap:6px' },
                h('span', { style: 'color:var(--gold)' }, formatEchoStatValue(s.key, s.value)),
                h('button', {
                  class: 'mbtn',
                  style: 'font-size:9px;padding:1px 5px',
                  disabled: tuner < 1 || undefined,
                  onClick: () => bagEchoRetune(e.id, idx)
                }, '调谐')
              )
            ),
            rangeLine
          );
        })
      : h('div', { style: 'color:var(--dim);font-size:11px' }, '无副词条'));

    const canLevel = e.level < 25;
    const nextCost = canLevel ? echoToNext(e) : 0;
    openModal({
      title: `${e.name} · LV ${e.level} · COST ${e.cost}`,
      keepScroll: wasSameEcho,
      body: h('div', null,
        h('div', { style: 'font-size:11px;color:var(--muted);margin-bottom:8px' }, `COST ${e.cost} · ${e.element} · ${set?.name || '无套装'}`),
        h('div', { style: 'font-size:11px;color:var(--muted);margin-bottom:4px' }, '主词条'),
        h('div', { style: 'display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--line);margin-bottom:8px' },
          h('span', null, e.mainStat?.label || ''),
          h('span', { style: 'color:var(--gold)' }, e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : '')
        ),
        h('div', { style: 'font-size:11px;color:var(--muted);margin-bottom:4px' }, `副词条（${(e.subStats||[]).filter(s=>s.unlocked!==false).length}/${(e.subStats||[]).length}）`),
        subRows,
        set ? h('div', { style: 'margin-top:8px;padding-top:6px;border-top:1px dashed var(--line)' },
          h('div', { style: 'color:var(--gold);font-size:11px;margin-bottom:3px' }, `套装效果 · ${set.name}`),
          h('div', { style: 'margin-left:10px;font-size:11px' },
            h('div', null, h('b', null, '2 件'), `：${formatSetBonus(set.bonus2) || '—'}`),
            h('div', null, h('b', null, '5 件'), `：${formatSetBonus(set.bonus5) || '—'}`)
          )
        ) : null,
        h('div', { style: 'font-size:10px;color:var(--dim);margin-top:8px' }, `累计经验 ${totalExp(e)} · ${e.equippedBy ? `装备于 ${e.equippedBy}` : '未装备'}`)
      ),
      actions: [
        ...(canLevel ? [
          { label: `升级 (${nextCost.toLocaleString()} exp)`, cls: 'gold', fn: () => { bagEchoLevelUp(id); } },
          { label: '一键升满', cls: '', fn: () => { bagEchoLevelUpMax(id); } }
        ] : []),
        { label: e.lock ? '解锁' : '锁定', cls: '', fn: () => { bagEchoToggleLock(id); } },
        ...(e.equippedBy ? [{ label: '卸下', cls: '', fn: () => { bagEchoUnequip(id); } }] : []),
        ...(canLevel ? [{ label: '喂料升级', cls: '', fn: () => { bagEchoFeedPick(id); } }] : []),
        ...(!e.lock && !e.equippedBy ? [{ label: '分解', cls: '', fn: () => {
          bagEchoConfirmRecycle(id);
        } }] : []),
        { label: '关闭', cls: '', fn: () => { } }
      ]
    });
    if (box) box.dataset.echoId = String(id);
  };

  const bagEchoLevelUp = (id, reopenDetail = true) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const before = totalExp();
    const ok = levelUpEcho(id);
    if (ok) {
      const used = before - totalExp();
      const unlocked = (e.level % 5 === 0) ? ' · 新副词条槽位已解锁' : '';
      msg(`${e.name} 升至 LV ${e.level}（消耗 ${used.toLocaleString()} 经验${unlocked}）`, false);
      if (reopenDetail) bagEchoDetail(id, _echoDetailFromRole);
    }
    renderBag();
    rerenderAll();
  };

  const bagEchoLevelUpMax = (id) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const before = totalExp();
    const count = levelUpEchoMax(id);
    const used = before - totalExp();
    if (count > 0) {
      msg(`${e.name} 一键升至 LV ${e.level}（升 ${count} 级 · 消耗 ${used.toLocaleString()} 经验）`, false);
      bagEchoDetail(id, _echoDetailFromRole);
    } else if (e.level >= 25) {
      msg('声骸已满级');
    } else {
      msg('经验不足，无法升级');
    }
    renderBag();
    rerenderAll();
  };

  const bagEchoRecycle = (id) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const res = recycleEcho(id);
    if (!res.ok) { if (res.err) msg(res.err); else msg('分解失败（已装备/已锁定？）'); }
    else {
      renderBag();
      rerenderAll();
    }
  };

  const bagEchoConfirmRecycle = (id) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const preview = previewRecycleEcho(id);
    if (!preview.ok) { if (preview.err) msg(preview.err); return; }
    const lines = preview.returns.map(r => `<div style="margin:2px 0">· ${r.label} ×${r.n}</div>`).join('');
    openModal({
      title: `分解 ${e.name}`,
      body: `<div style="font-size:11px;color:var(--dim)">LV ${e.level} · COST ${e.cost} · 累计经验 ${totalExp(e)}</div>
        <div style="margin-top:8px;font-size:12px">将返还：</div>
        <div style="font-size:12px;color:var(--gold)">${lines}</div>`,
      actions: [
        { label: '确认分解', cls: 'gold', fn: () => { bagEchoRecycle(id); } },
        { label: '取消', cls: '', fn: () => {} }
      ]
    });
  };

  // 声骸喂料选料 modal
  const bagEchoFeedPick = (id) => {
    const target = S.echos.find(x => x.id === id);
    if (!target) return;
    if (target.level >= 25) { msg('目标声骸已满级'); return; }
    const candidates = S.echos.filter(e => {
      if (e.id === target.id) return false;
      if (e.equippedBy) return false;
      if (e.lock) return false;
      return true;
    });
    if (candidates.length === 0) {
      openModal({
        title: '喂料升级',
        body: `<div style="font-size:12px;color:var(--dim)">没有可作为材料的备用声骸。
          <br>要求：未装备 / 未锁定 / 非目标声骸本身。
          <br>注：未投入经验的声骸喂料无收益。</div>`,
        actions: [{ label: '关闭', cls: '', fn: () => {} }]
      });
      return;
    }
    const rows = candidates.map(e => {
      const preview = previewEchoFeed(target.id, e.id);
      const tip = preview.ok
        ? `返还特级促剂 ×${preview.exp_super_count}（约升 ${preview.est_levels} 级）`
        : (preview.err || '不可用');
      const usable = preview.ok;
      return h('div', { style: `display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px${usable?'':';opacity:0.5'}` },
        h('div', { style: 'flex:1' },
          h('div', { style: 'font-weight:600;font-size:12px' }, e.name, h('span', { style: 'color:var(--muted);font-weight:400' }, ` C${e.cost}·Lv${e.level}`)),
          h('div', { style: 'font-size:10px;color:var(--dim)' }, tip)
        ),
        h('button', {
          class: 'mbtn gold',
          style: 'font-size:11px;padding:5px 10px',
          disabled: !usable || undefined,
          onClick: () => bagEchoFeedDo(target.id, e.id)
        }, '喂料')
      );
    });
    openModal({
      title: `喂料升级 · ${target.name}`,
      body: h('div', null,
        h('div', { style: 'font-size:11px;color:var(--dim);margin-bottom:8px' }, '选一个备用声骸作材料。被喂声骸累计经验的 80% 折成特级共鸣促剂入账，目标声骸随后逐级消耗升级。'),
        h('div', { style: 'max-height:50vh;overflow:auto' }, rows)
      ),
      className: 'role-modal',
      actions: [{ label: '取消', cls: '', fn: () => {} }]
    });
  };

  const bagEchoFeedDo = (targetId, feedId) => {
    const res = levelUpEchoWithFeed(targetId, feedId);
    if (!res.ok) { msg(res.err); return; }
    msg(`${res.target} 喂料 ${res.feed}：返还 ${res.exp_super_count} 特级促剂，连升 ${res.levels_gained} 级至 LV${res.final_level}`, false);
    renderBag();
    rerenderAll();
    // 升级完成后再打开一次目标详情
    bagEchoDetail(targetId, _echoDetailFromRole);
  };

  const bagEchoToggleLock = (id) => {
    toggleEchoLock(id);
    bagEchoDetail(id, _echoDetailFromRole);
    renderBag();
  };

  const bagEchoUnequip = (id) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const ok = unequipEcho(id);
    if (ok) msg(`已卸下 ${e.name}`, false);
    renderBag();
    rerenderAll();
  };

  // 角色声骸面板：选要装备到 roleName 第 slot 槽位的声骸
  const bagEchoOpenPicker = (roleName, slot) => {
    const list = getEquippableEchoes(roleName);
    if (list.length === 0) {
      openModal({
        title: `装备声骸 · ${roleName} 槽位 ${slot + 1}`,
        body: h('div', { style: 'font-size:12px;color:var(--dim)' },
          '没有可装备的声骸。',
          h('br', null),
          '要求：未装备 / 已装备给本角色',
        ),
        actions: [{ label: '关闭', cls: '', fn: () => {} }]
      });
      return;
    }
    const rows = list.map(e => {
      const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
      const mainStat = e.mainStat ? `${e.mainStat.label || ''} ${formatEchoStatValue(e.mainStat.key, e.mainStat.value)}` : '';
      return h('div', {
        style: 'display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px;cursor:pointer',
        onClick: () => {
          const r = equipEcho(roleName, slot, e.id);
          if (r.ok) {
            msg(`已装备 ${e.name} 到 ${roleName} 槽位 ${slot + 1}`, false);
            closeModal();
            renderBag();
            rerenderAll();
          } else if (r.err) {
            msg(r.err);
          }
        }
      },
        h('div', { style: 'flex:1' },
          h('div', { style: 'font-weight:600;font-size:12px' }, e.name, h('span', { style: 'color:var(--muted);font-weight:400' }, ` C${e.cost}·LV${e.level}`)),
          h('div', { style: 'font-size:10px;color:var(--dim)' }, `${mainStat}${set ? ' · ' + set.name : ''}`)
        ),
        h('div', { style: 'font-size:10px;color:var(--gold)' }, '点击装备')
      );
    });
    openModal({
      title: `装备声骸 · ${roleName} 槽位 ${slot + 1}`,
      body: h('div', null,
        h('div', { style: 'font-size:11px;color:var(--dim);margin-bottom:8px' }, '选择要装备的声骸。'),
        h('div', { style: 'max-height:50vh;overflow:auto' }, rows)
      ),
      className: 'role-modal',
      actions: [{ label: '取消', cls: '', fn: () => {} }]
    });
  };

  const bagEchoRetune = (id, idx) => {
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const r = retuneEchoSubStat(id, idx);
    if (!r.ok) { msg(r.err); return; }
    const key = e.subStats[idx].key;
    const rng = getSubStatRange(key, r.newVal);
    const pctTxt = rng && rng.pct != null ? `（区间 ${rng.minStr}~${rng.maxStr} · ${rng.pct}%）` : '';
    msg(`${e.name} · ${r.label} 调谐：${formatEchoStatValue(key, r.oldVal)} → ${formatEchoStatValue(key, r.newVal)}${pctTxt}`, false);
    bagEchoDetail(id, _echoDetailFromRole);
    renderBag();
    rerenderAll();
  };

  // 暴露给外部模块（如 role 面板从外部打开声骸详情/升级/卸下/装备 picker）
  return { bagEchoDetail, bagEchoLevelUp, bagEchoLevelUpMax, bagEchoToggleLock, bagEchoUnequip, bagEchoOpenPicker };
}
