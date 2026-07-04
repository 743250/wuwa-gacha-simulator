import { h } from 'preact';
import { ELEMENT_COLORS, TABS } from './signals';

interface ShellProps {
  roleName: string;
  rarity: number;
  element: string;
  type: string;
  level: number;
  chain: number;
  currentTab: string;
  preview: boolean;
  children: any;
}

export function Shell({ roleName, rarity, element, type, level, chain, currentTab, preview, children }: ShellProps) {
  const stars = '★'.repeat(rarity);
  const elemColor = ELEMENT_COLORS[element] || '#fff';
  const visibleTabs = preview ? TABS.filter(t => t.id !== 'levelup') : TABS;

  return (
    <div class="role-modal-wrap">
      <div class="role-sidebar">
        <div class="role-portrait">
          <div style={{ fontSize: '28px', fontWeight: 700, color: rarity === 5 ? 'var(--gold)' : '#dbc6ff', letterSpacing: '1px' }}>
            {roleName}
          </div>
          <div style={{ fontSize: '16px', color: rarity === 5 ? 'var(--gold)' : 'var(--purple)', letterSpacing: '2px', marginTop: '7px' }}>
            {stars}
          </div>
          <div style={{ display: 'flex', gap: '7px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', padding: '3px 10px', border: `1px solid ${elemColor}`, color: elemColor, borderRadius: '999px' }}>
              {element}
            </span>
            <span style={{ fontSize: '14px', padding: '3px 10px', border: '1px solid var(--line2)', color: 'var(--muted)', borderRadius: '999px' }}>
              {type}
            </span>
          </div>
          <div style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '10px' }}>
            LV {level} · 链 {chain}/6
          </div>
        </div>
        {visibleTabs.map(t => (
          <div key={t.id}
            class={`role-tab ${currentTab === t.id ? 'on' : ''}`}
            onClick={() => (window as any).__switchRoleTab?.(t.id)}>
            <span class="rt-icon">{t.icon}</span>
            <span class="rt-lbl">{t.label}</span>
          </div>
        ))}
      </div>
      <div class="role-content">
        {children}
      </div>
    </div>
  );
}
