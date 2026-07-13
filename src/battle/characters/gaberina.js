// 嘉贝莉娜「猎杀阈值」—— B 级阈值增强解放 + 4 链解放后全队 allDmgUp
//
// 核心循环由 forte enhancedBurst 负责（满 100 → 解放 ×1.6 / 6 链 ×2.1）。
// 本文件只补：4 链「解放后全队全伤害 +20% · 3 回合」状态机（registry 占位防双算）。

const SRC_C4 = '嘉贝莉娜4链';
const C4_ALL_DMG = 0.20;
const C4_TURNS = 3;

export function gaberinaOnBurst(self, ctx) {
  if (self.name !== '嘉贝莉娜') return;
  if ((self.chain || 0) < 4) return;
  const battle = ctx?.battle;
  if (!battle) return;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C4);
    t.buffs.push({
      type: 'allDmgUp',
      value: C4_ALL_DMG,
      duration: C4_TURNS + 1,
      src: SRC_C4,
      installer: self.idx
    });
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `4 链 · 全队全伤害 +${(C4_ALL_DMG * 100).toFixed(0)}%（${C4_TURNS} 回合）`
  });
}

export function collectGaberinaBadges(unit) {
  if (unit.name !== '嘉贝莉娜' || !unit.forte) return [];
  const cur = unit.forte.current || 0;
  const max = unit.forte.max || 100;
  const ready = !!unit.forte.ready;
  return [{
    key: 'threshold',
    cls: ready ? 'burst' : 'field',
    icon: ready ? '✦' : '◈',
    label: ready ? `猎杀阈值满 · 解放×${(unit.forte.effectMult || 1.6).toFixed(1)}` : `猎杀阈值 ${cur}/${max}`,
    tip: `<b>猎杀阈值</b><br>普攻 +8 / 技能 +18 / 重击 +12 / 解放 +25<br>满 100 时下一发共鸣解放伤害 ×${(unit.forte.effectMult || 1.6).toFixed(1)}（6 链 ×2.1），施放后重置`
  }];
}

export default {
  name: '嘉贝莉娜',
  hasHeavy: true,
  onBurst: gaberinaOnBurst,
  collectBadges: collectGaberinaBadges
};
