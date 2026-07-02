// 武器详情/选择/升级/精炼/喂料弹窗
import { S, msg } from '../../state.js';
import { WEAPON_DATA } from '../../equip/weapons.js';
import { weaponToNext } from '../../battle/stats.js';
import { levelUpWeapon, levelUpWeaponMax, refineWeapon, equipWeapon, getEquippableWeapons, levelUpWeaponWithFeed, previewWeaponFeed } from '../../equip/actions.js';
import { openModal } from '../../modal.js';
import { renderWeaponDetail } from './weaponDetail.js';

export function registerWeaponModal({ renderRoleModal, setRoleTab, setRoleName, getCurrentRoleTab }) {
  window.__openWeaponInfo = (weaponName) => {
    const data = WEAPON_DATA[weaponName];
    if (!data) {
      openModal({
        title: weaponName,
        body: '<div style="color:var(--muted);font-size:12px">暂无详细面板。</div>',
        actions: [{ label: '关闭', cls: '', fn: () => {} }]
      });
      return;
    }
    const previewObj = { n: weaponName, r: data.r || 5, level: 90, refine: 1, spareRefine: 0, equippedBy: null };
    openModal({
      title: `武器预览 · ${weaponName}`,
      body: `<div style="font-size:12px;color:var(--muted);margin-bottom:8px">${'★'.repeat(data.r || 5)} · ${data.type || '武器'} · 90 级 · 精炼 1</div>${renderWeaponDetail(weaponName, previewObj)}`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };

  // 武器选择器
  window.openWeaponPicker = (roleName) => {
    const list = getEquippableWeapons(roleName);
    if (!list.length) {
      openModal({
        title: '没有可装备的武器',
        body: '当前没有适配的武器。',
        actions: [{ label: '关闭', cls: 'primary', fn: () => {} }]
      });
      return;
    }
    // 按星级排序
    list.sort((a, b) => {
      const ra = WEAPON_DATA[a.n]?.r || 0;
      const rb = WEAPON_DATA[b.n]?.r || 0;
      return rb - ra;
    });
    const html = list.map(w => {
      const data = WEAPON_DATA[w.n];
      const r = data?.r || 3;
      const color = r === 5 ? 'var(--gold)' : r === 4 ? 'var(--purple)' : 'var(--blue)';
      const eqBy = w.equippedBy && w.equippedBy !== roleName ? `<span style="color:var(--muted);font-size:10px">（${w.equippedBy}）</span>` : '';
      return `<div style="border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:5px;background:rgba(255,255,255,.02);cursor:pointer" onclick="window.__pickWeapon('${roleName.replace(/'/g, "\\'")}','${w.n.replace(/'/g, "\\'")}')">
        <div style="font-size:12px;font-weight:600;color:${color}">${'★'.repeat(r)} ${w.n} <span style="font-size:10px;color:var(--muted)">LV${w.level} · 精${w.refine}</span> ${eqBy}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${data?.desc || ''}</div>
      </div>`;
    }).join('');
    openModal({
      title: `为 ${roleName} 选武器`,
      body: `<div style="max-height:340px;overflow-y:auto">${html}</div>`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };

  window.__pickWeapon = (roleName, weaponName) => {
    equipWeapon(roleName, weaponName);
    msg(`装备 ${weaponName}`, false);
    // 重弹角色 modal 但保留之前的 tab（武器选择是在武器 tab 内点的）
    setRoleName(roleName);
    if (getCurrentRoleTab() !== 'weapon') setRoleTab('weapon');
    renderRoleModal();
    window.__render();
  };

  // 武器详情弹窗（背包点击武器卡片时打开）
  window.__openWeaponModal = (weaponName) => {
    const w = S.weapons[weaponName];
    if (!w) return;
    const data = WEAPON_DATA[weaponName];
    if (!data) return;
    const r = w.r || data.r || 5;
    const stars = '★'.repeat(r);
    const starColor = r === 5 ? 'var(--gold)' : r === 4 ? 'var(--purple)' : 'var(--accent)';
    const canLevel = (w.level || 1) < 90;
    const canRefine = (w.spareRefine || 0) > 0 && (w.refine || 1) < 5;
    const eqTag = w.equippedBy ? `<span style="color:var(--green)">装备于 ${w.equippedBy}</span>` : '<span style="color:var(--dim)">未装备</span>';

    function buildBody() {
      const body = `
        <div style="text-align:center;margin-bottom:12px">
          <div style="font-size:28px;font-weight:700;letter-spacing:1px;color:${starColor}">${weaponName}</div>
          <div style="font-size:13px;color:${starColor};margin-top:2px">${stars}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${data.type || '武器'} · Lv ${w.level || 1} / 90 · R${w.refine || 1}/5 · ${eqTag}</div>
        </div>
        ${renderWeaponDetail(weaponName, w)}
        <div style="display:flex;gap:5px;margin-top:12px;flex-wrap:wrap">
          <button class="mbtn" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponLevelUp('${weaponName.replace(/'/g, "\\'")}')" ${!canLevel ? 'disabled' : ''}>升级（${weaponToNext({level:w.level||1})} 石）</button>
          <button class="mbtn" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponLevelMax('${weaponName.replace(/'/g, "\\'")}')" ${!canLevel ? 'disabled' : ''}>升满</button>
          <button class="mbtn gold" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponRefine('${weaponName.replace(/'/g, "\\'")}')" ${!canRefine ? 'disabled' : ''}>精炼</button>
        </div>
        <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
          <button class="mbtn" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponFeedPick('${weaponName.replace(/'/g, "\\'")}')" ${!canLevel ? 'disabled' : ''}>喂料升级</button>
        </div>
        <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:8px">武器突破石库存 <b style="color:var(--gold)">${S.materials.weapon_book}</b></div>`;
      return body;
    }

    openModal({
      title: `武器详情`,
      body: buildBody(),
      className: 'role-modal',
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };

  // 武器弹窗内升级/升满/精炼（刷新弹窗内容而非关闭）
  window.__weaponLevelUp = (name) => {
    if (levelUpWeapon(name)) msg(`${name} 升级成功`, false);
    else return;
    window.__openWeaponModal(name);
    window.__render();
  };

  window.__weaponLevelMax = (name) => {
    const c = levelUpWeaponMax(name);
    if (c > 0) msg(`${name} +${c} 级`, false);
    else { msg('武器突破石不足或已满级'); return; }
    window.__openWeaponModal(name);
    window.__render();
  };

  window.__weaponRefine = (name) => {
    const r = refineWeapon(name, 1);
    if (!r.ok) { msg(r.err); return; }
    msg(`${name} 精炼 +${r.used}（现 R${r.refine}）`, false);
    window.__openWeaponModal(name);
    window.__render();
  };

  // 武器喂料选料 modal：列出可作为材料的备用武器
  window.__weaponFeedPick = (targetName) => {
    const target = S.weapons[targetName];
    if (!target) return;
    if (target.level >= 90) { msg('目标武器已满级'); return; }
    const candidates = Object.values(S.weapons).filter(w => {
      if (w === target) return false;
      if (w.equippedBy) return false;
      if ((w.spareRefine || 0) > 0) return false;
      return true;
    });
    if (candidates.length === 0) {
      openModal({
        title: '喂料升级',
        body: `<div style="font-size:12px;color:var(--dim)">没有可作为材料的备用武器。
          <br>要求：未装备 / 无精炼次数 / 非目标武器本身。</div>`,
        actions: [{ label: '关闭', cls: '', fn: () => {} }]
      });
      return;
    }
    const rows = candidates.map(w => {
      const r = w.r || 5;
      const star = r === 5 ? 'var(--gold)' : r === 4 ? 'var(--purple)' : 'var(--accent)';
      const preview = previewWeaponFeed(targetName, w.n);
      const tip = preview.ok
        ? `返还武器石 ×${preview.books_gained}（约升 ${preview.est_levels} 级）`
        : (preview.err || '不可用');
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px">
        <div style="flex:1">
          <div style="color:${star};font-weight:600;font-size:12px">${w.n} <span style="color:var(--muted);font-weight:400">Lv${w.level}</span></div>
          <div style="font-size:10px;color:var(--dim)">${tip}</div>
        </div>
        <button class="mbtn gold" style="font-size:11px;padding:5px 10px" onclick="window.__weaponFeedDo('${targetName.replace(/'/g, "\\'")}', '${w.n.replace(/'/g, "\\'")}')">喂料</button>
      </div>`;
    }).join('');
    openModal({
      title: `喂料升级 · ${targetName}`,
      body: `<div style="font-size:11px;color:var(--dim);margin-bottom:8px">选一把备用武器作为材料。被喂武器按累积突破石的 60% 折回武器石。</div>
      <div style="max-height:50vh;overflow:auto">${rows}</div>`,
      className: 'role-modal',
      actions: [{ label: '取消', cls: '', fn: () => {} }]
    });
  };

  window.__weaponFeedDo = (targetName, feedName) => {
    const res = levelUpWeaponWithFeed(targetName, feedName);
    if (!res.ok) { msg(res.err); return; }
    msg(`${res.target} 喂料 ${res.feed}：返还 ${res.books_gained} 武器石，连升 ${res.levels_gained} 级至 Lv${res.final_level}`, false);
    window.__openWeaponModal(targetName);
    window.__render();
  };
}