// 菲比「衍射形态 / 赦罪-告解」衍射音感仪主C
//
// 创作者思路：菲比是双形态切换型主C
//   技能切换衍射形态 toggle，普攻附带衍射元素伤害 ×1.5
//   赦罪状态：解放伤害 +225%（1 链） / 重击星辉 +91%（3 链）
//   告解状态：光噪效应加深 / FFF 诅咒增伤
//   镜之环：6 链召唤镜之环，附停滞 + 额外星辉

import { registerForm, enterForm, exitForm, hasForm } from '../forms.js';

// 赦罪形态：默认形态（无 enterName，保持 unit.name 显示）
// 形态切换 toggle：赦罪 ↔ 告解
registerForm('phoebe_absolution', {
  enterName: null, // 赦罪形态默认不改动 displayName（仍是菲比）
  carryOnSwitch: true,
  onEnter(unit, battle) {
    unit.phoebeAbsolution = true;
    unit.buffs = (unit.buffs || []).filter(b => b.src !== '衍射形态');
  },
  onExit(unit, battle) {
    unit.phoebeAbsolution = false;
  }
});

export function phoebeToggleForm(self, battle) {
  if (self.name !== '菲比') return;
  if (hasForm(self, 'phoebe_absolution')) {
    exitForm(self, 'phoebe_absolution', battle);
    battle.log.push({ type: 'mechanic', src: self.name, msg: '衍射形态切换：告解' });
  } else {
    enterForm(self, 'phoebe_absolution', battle);
    battle.log.push({ type: 'mechanic', src: self.name, msg: '衍射形态切换：赦罪' });
  }
}

// 当前形态下的伤害修正
export function phoebeFormBonus(self, dmgType) {
  if (self.name !== '菲比') return 1.0;
  if (self.phoebeAbsolution) {
    // 赦罪：解放/重击强化
    if (dmgType === 'burst') return 1.0 + (self.phoebeBurstBonus || 0);
    if (dmgType === 'heavy') return 1.0 + (self.phoebeHeavyBonus || 0);
  }
  // 告解：对光噪目标伤害加深
  return 1.0;
}

export default {
  name: '菲比',
  hasHeavy: true,
  // 初始进战斗默认就是赦罪形态（在 combat.js 初始化时通过此 hook 触发）
  initForm(self) {
    if (!hasForm(self, 'phoebe_absolution')) {
      const battle = null;
      enterForm(self, 'phoebe_absolution', battle);
    }
  },
  toggleForm: phoebeToggleForm,
  formBonus: phoebeFormBonus
};