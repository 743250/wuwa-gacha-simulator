// 声骸选择器弹窗
import { S } from '../../state.js';
import { getEquippableEchoes, calcTotalCost, ECHO_COST_CAP } from '../../equip/echoActions.js';
import { getSetById, formatEchoStatValue } from '../../data/echoes.js';
import { openModal } from '../../modal.js';

const ECHO_PICKER_STATE = { sort: 'set', q: '' };

export function registerEchoPicker({ getCurrentRoleName, reopenRoleModal, getEchoSelectedSlot }) {
  window.__openEchoPicker = (roleName, slot) => {
    const equippable = getEquippableEchoes(roleName);
    const cap = ECHO_COST_CAP;
    const used = calcTotalCost(roleName);
    const cur = (Array.isArray(S.roles[roleName]?.equipEchoes) ? S.roles[roleName].equipEchoes : [])[slot];
    const curCost = cur != null ? (S.echos.find(e => e.id === cur)?.cost || 0) : 0;

    // 排序 + 搜索
    const q = (ECHO_PICKER_STATE.q || '').trim().toLowerCase();
    let list = equippable.slice();
    if (q) {
      list = list.filter(e => {
        const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
        return (e.name || '').toLowerCase().includes(q)
          || (set?.name || '').toLowerCase().includes(q)
          || (e.mainStat?.label || '').toLowerCase().includes(q)
          || (e.element || '').toLowerCase().includes(q);
      });
    }
    const sortKey = ECHO_PICKER_STATE.sort;
    list.sort((a, b) => {
      if (sortKey === 'cost') return b.cost - a.cost || b.level - a.level;
      if (sortKey === 'level') return b.level - a.level || b.cost - a.cost;
      if (sortKey === 'main') return (a.mainStat?.label || '').localeCompare(b.mainStat?.label || '') || b.cost - a.cost;
      // 默认按套装
      const sa = getSetById(Array.isArray(a.set) ? a.set[0] : a.set)?.name || '';
      const sb = getSetById(Array.isArray(b.set) ? b.set[0] : b.set)?.name || '';
      return sa.localeCompare(sb) || b.cost - a.cost || b.level - a.level;
    });

    const items = list.map(e => {
      const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
      const color = set?.element ? ({'热熔':'#ff8c5e','冷凝':'#7bd6ff','导电':'#b58cff','气动':'#8de6a6','衍射':'#fff0b0','湮灭':'#c39bff'}[set.element] || '#fff') : '#999';
      const wouldTotal = used - curCost + e.cost;
      const overCost = wouldTotal > cap;
      const isEquippedHere = e.id === cur;
      const equippedElsewhere = e.equippedBy && e.equippedBy !== roleName ? e.equippedBy : null;
      return `<div style="border:1px solid ${isEquippedHere ? 'var(--gold)' : color};border-radius:8px;padding:8px 10px;background:rgba(255,255,255,.02);${overCost && !isEquippedHere ? 'opacity:.5' : ''};position:relative">
        ${equippedElsewhere ? `<div style="position:absolute;top:6px;right:8px;font-size:9px;color:var(--accent);background:rgba(0,0,0,.3);padding:1px 5px;border-radius:3px">已被 ${equippedElsewhere} 装备</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-right:${equippedElsewhere ? '90px' : '0'}">
          <span style="font-size:12px;font-weight:700;color:${color}">${e.name}${isEquippedHere ? ' ✓' : ''}</span>
          <span style="font-size:10px;color:var(--gold)">COST ${e.cost} · LV ${e.level}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px">${e.mainStat?.label || ''} ${e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : ''} · ${set?.name || ''}</div>
        <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap">
          ${isEquippedHere ? '' : `<button class="mbtn gold" style="font-size:10px;padding:2px 10px" ${overCost ? 'disabled' : ''} onclick="window.__doEquipEcho('${roleName.replace(/'/g,"\\'")}',${slot},${e.id})">装备</button>`}
          <button class="mbtn" style="font-size:10px;padding:2px 10px" onclick="window.__echoDetail(${e.id})">详情</button>
        </div>
      </div>`;
    }).join('');
    const sortOptions = [['set','按套装'],['cost','按 COST'],['level','按等级'],['main','按主词条']].map(([v,l]) => `<option value="${v}"${ECHO_PICKER_STATE.sort===v?' selected':''}>${l}</option>`).join('');
    openModal({
      title: `选择声骸 · 槽位 ${slot+1} · 总 COST ${used}/${cap}`,
      body: `<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
          <input id="echoPickerQ" type="text" placeholder="搜索名字/套装/主词条/元素" value="${ECHO_PICKER_STATE.q.replace(/"/g,'&quot;')}" oninput="window.__echoPickerSetQuery(this.value)" style="flex:1;min-width:140px;background:rgba(0,0,0,.3);border:1px solid var(--line);color:var(--fg);border-radius:5px;padding:5px 8px;font-size:11px">
          <select onchange="window.__echoPickerSetSort(this.value)" style="background:rgba(0,0,0,.3);border:1px solid var(--line);color:var(--fg);border-radius:5px;padding:5px 8px;font-size:11px">${sortOptions}</select>
        </div>
        <div style="max-height:55vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
        ${items || '<div style="color:var(--dim);font-size:12px;text-align:center;padding:20px">无可装备的声骸。前往「冒险 · 副本 · 无音区」战斗掉落获取。</div>'}
      </div>`,
      actions: [{ label: '关闭', cls: '', fn: () => { if (getCurrentRoleName()) reopenRoleModal(); } }]
    });
  };
  window.__echoPickerSetSort = (v) => { ECHO_PICKER_STATE.sort = v; };
  window.__echoPickerSetQuery = (v) => {
    ECHO_PICKER_STATE.q = v;
    // 重开 picker（保留选中槽位上下文需要从最近一次调用拿，简化为重渲染）
    // 通过当前 modal 标题里的角色名/槽位反推不现实，改为直接重渲染触发
    // 找到当前选中的 role 和 slot：从 _echoSelectedSlot 取最近选中的 role
    const slots = getEchoSelectedSlot();
    const role = Object.keys(slots || {}).pop();
    if (!role) return;
    const slot = slots[role];
    window.__openEchoPicker(role, slot);
  };
}