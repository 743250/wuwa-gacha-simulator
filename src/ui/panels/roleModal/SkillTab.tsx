import { h } from 'preact';
import { renderSkillsBlock } from '../../../ui/render/skillBlock.js';
import { getSkillHintRoleContext } from '../../../ui/render/rolePreview.js';
import { encoreBurstModeSignal } from './signals';

interface SkillTabProps {
  roleName: string;
  meta: any;
  stats: any;
  roleOverride: any;
}

/**
 * SkillTab 直接返回 renderSkillsBlock 的 VNode(Stage 6.2 Preact 化)。
 * encoreBurstModeSignal 驱动黑白咩切换。
 * roleOverride 优先用 getSkillHintRoleContext（含链 typeBonus），存档角色无 skillBonus 会让工厂公式失真。
 */
export function SkillTab({ roleName, meta, stats, roleOverride }: SkillTabProps) {
  const hintRole = getSkillHintRoleContext(roleName) || roleOverride || {};
  return renderSkillsBlock(roleName, meta, {
    stats,
    roleOverride: hintRole,
    burstMode: encoreBurstModeSignal.value,
  });
}
