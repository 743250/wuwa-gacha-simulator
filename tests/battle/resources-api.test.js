// ResourceDef 查询 API · Phase 5
//
// 测试 4 个新 API:getRoleResources / getVisibleResources / formatResourceValue / getResourceTooltip
// 不测注册逻辑(那是 initBattleResources 的事),只测查询行为。
// 使用真实 FORTE/STACK_DEFS/FORM_DEFS,跑 initBattleResources() 后验证。

import { describe, it, expect, beforeAll } from 'vitest';
import { initBattleResources, getRoleResources, getVisibleResources, formatResourceValue, getResourceTooltip } from '../../src/battle/resources/index';
import { RESOURCE_REGISTRY } from '../../src/battle/resources/types';

beforeAll(() => { initBattleResources(); });

describe('Phase 5 · resource query API', () => {
  it('getRoleResources 返回该角色的所有资源定义', () => {
    const jiyan = getRoleResources('忌炎');
    // 忌炎有 forte(破阵值) + layer(锐意之势)
    expect(jiyan.length).toBeGreaterThanOrEqual(1);
    expect(jiyan.some(r => r.id === 'forte_忌炎')).toBe(true);
  });

  it('getRoleResources 未注册角色返回空数组', () => {
    expect(getRoleResources('不存在的角色')).toEqual([]);
  });

  it('getVisibleResources 过滤掉未激活的资源', () => {
    // 无 forte 的 unit → forte 资源不可见
    const unit = { name: '忌炎' };
    const visible = getVisibleResources(unit);
    expect(visible.find(r => r.id === 'forte_忌炎')).toBeUndefined();
  });

  it('getVisibleResources 返回已激活的 forte 资源', () => {
    const unit = { name: '忌炎', forte: { current: 50, max: 100, ready: false } };
    const visible = getVisibleResources(unit);
    const f = visible.find(r => r.id === 'forte_忌炎');
    expect(f).toBeDefined();
  });

  it('formatResourceValue forte 返回 current/max', () => {
    const unit = { name: '忌炎', forte: { current: 50, max: 100, ready: false } };
    expect(formatResourceValue(unit, 'forte_忌炎')).toBe('50/100');
  });

  it('formatResourceValue forte ready 时附加"强化就绪"', () => {
    const unit = { name: '忌炎', forte: { current: 100, max: 100, ready: true } };
    expect(formatResourceValue(unit, 'forte_忌炎')).toContain('强化就绪');
  });

  it('formatResourceValue 未知 id 返回空串', () => {
    expect(formatResourceValue({ name: 'x' }, 'no_such_id')).toBe('');
  });

  it('getResourceTooltip 返回结构化数据(含名称,无 HTML)', () => {
    const tip = getResourceTooltip('forte_忌炎');
    expect(tip).not.toBeNull();
    expect(tip.name).toBeTruthy();
    expect(typeof tip.name).toBe('string');
    expect(tip.name).not.toContain('<');
  });

  it('getResourceTooltip 未知 id 返回 null', () => {
    expect(getResourceTooltip('no_such_id')).toBeNull();
  });
});
