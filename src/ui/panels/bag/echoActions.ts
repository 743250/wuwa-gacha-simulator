// 背包 echo actions · Phase 5 从 src/ui/bag.js shim 迁入
// registerEchoBagActions 注册副作用,渲染走 no-op(Preact signals 接管)
import { registerEchoBagActions } from '../../../ui/bag/echoBagActions.js';

const { bagEchoDetail, bagEchoLevelUp, bagEchoLevelUpMax, bagEchoToggleLock, bagEchoUnequip, bagEchoOpenPicker } = registerEchoBagActions({ renderBag: () => {} });

export { bagEchoDetail, bagEchoLevelUp, bagEchoLevelUpMax, bagEchoToggleLock, bagEchoUnequip, bagEchoOpenPicker };
