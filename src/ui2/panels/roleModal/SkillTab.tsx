import { h } from 'preact';
import { renderSkillsBlock } from '../../../ui/render/skillBlock.js';

interface SkillTabProps {
  roleName: string;
  meta: any;
  stats: any;
  roleOverride: any;
}

/**
 * SkillTab wraps the old renderSkillsBlock (which returns HTML) via
 * dangerouslySetInnerHTML, per playbook recommendation: "可以先用
 * dangerouslySetInnerHTML 兜住,后续再迁".
 */
export function SkillTab({ roleName, meta, stats, roleOverride }: SkillTabProps) {
  const html = renderSkillsBlock(roleName, meta, {
    stats,
    roleOverride,
    burstMode: (window as any).__encoreBurstMode || 'white',
  });

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
