// 漂泊者 · 免费主角三形态发放
// 不进卡池；开局 / 读档 / 面板打开时 ensure 一次
import { S } from '../state.js';
import { addRole } from '../gacha/core.js';

export const ROVER_FORMS = [
  { id: '漂泊者·衍射', element: '衍射', label: '衍射调谐' },
  { id: '漂泊者·湮灭', element: '湮灭', label: '湮灭调谐' },
  { id: '漂泊者·气动', element: '气动', label: '气动调谐' },
];

/** 若缺任一形态则补发（已有不重复叠链） */
export function ensureRover() {
  let added = 0;
  for (const f of ROVER_FORMS) {
    const o = S.roles[f.id];
    if (!o || !o.owned) {
      addRole(f.id, 5);
      // 免费发放不应计入「抽到」计数膨胀
      const r = S.roles[f.id];
      if (r) {
        r.pulled = Math.max(1, r.pulled || 1);
        if ((r.pulled || 0) === 1) {
          // 首次 ensure：视为拥有 1，不叠 spare
          r.owned = 1;
          r.spare = 0;
        }
      }
      added++;
    }
  }
  return added;
}

export function listRoverForms() {
  ensureRover();
  return ROVER_FORMS.map(f => {
    const o = S.roles[f.id];
    return {
      ...f,
      owned: !!(o && o.owned),
      level: o?.level || 1,
      chain: o?.chain || 0,
    };
  });
}
