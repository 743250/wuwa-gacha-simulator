// 菲比「衍射形态 / 赦罪-告解」衍射音感仪主C
//
// 创作者思路：菲比是双形态切换型主C
//   技能切换衍射形态 toggle，普攻附带衍射元素伤害 ×1.5
//   赦罪状态：解放伤害 +225%（1 链） / 重击星辉 +91%（3 链）
//   告解状态：光噪效应加深 / FFF 诅咒增伤
//   镜之环：6 链召唤镜之环，附停滞 + 额外星辉

export function phoebeToggleForm(self, battle) {
  if (self.name !== '菲比') return;
  // 切换赦罪 ↔ 告解
  self.phoebeAbsolution = !self.phoebeAbsolution;
  const form = self.phoebeAbsolution ? '赦罪' : '告解';
  battle.log.push({ type: 'mechanic', src: self.name, msg: `衍射形态切换：${form}` });
  // 清除旧 buff
  self.buffs = (self.buffs || []).filter(b => b.src !== '衍射形态');
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
  toggleForm: phoebeToggleForm,
  formBonus: phoebeFormBonus
};
