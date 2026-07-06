import { h } from 'preact';
import { renderSkillsBlock } from '../../../ui/render/skillBlock.js';
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
 */
export function SkillTab({ roleName, meta, stats, roleOverride }: SkillTabProps) {
  return renderSkillsBlock(roleName, meta, {
    stats,
    roleOverride,
    burstMode: encoreBurstModeSignal.value,
  });
}
