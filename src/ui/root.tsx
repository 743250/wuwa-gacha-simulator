// Preact 根挂载 · 每迁一个面板在这里加一段 mount 逻辑
//
// 策略:直接 render 到老 index.html 已有的 #paneXxx 节点,不用统一根。
// 同时保留 #preact-root 挂点作全局层(tooltip / toast 等,后续用)。

import { h, render as preactRender } from 'preact';
import { BagPanel } from './panels/bag/BagPanel';
import { DailyPanel } from './panels/daily/DailyPanel';
import { DungeonPanel } from './panels/dungeon/DungeonPanel';
import { WastesPanel } from './panels/wastes/WastesPanel';
import { PodcastPanel } from './panels/podcast/PodcastPanel';
import { AbyssPanel } from './panels/abyss/AbyssPanel';
import { TeamBuilderPanel } from './panels/team/TeamBuilderPanel';
import { BattleView } from './panels/battle/BattleView';
import { installModalCloseHandler } from './panels/roleModal/RoleModal';
import { GachaPanel } from './panels/gacha/GachaPanel';
import { TopOverview } from './panels/gacha/TopOverview';
import { DateInfo } from './panels/gacha/DateInfo';
import { ShopPanel } from './panels/gacha/ShopPanel';
import { GlobalLayer } from './GlobalLayer';
import { ViewTabs } from './panels/ViewTabs';
import { MailEntry } from './panels/mail/MailPanel';

const mounted: Record<string, boolean> = {};

function mountPanel(id: string, component: any) {
	if (mounted[id]) return;
	const el = document.getElementById(id);
	if (!el) return;
	while (el.firstChild) el.removeChild(el.firstChild);
	preactRender(h(component, null), el);
	mounted[id] = true;
}

export function mountPreactRoot(): void {
	// 全局层挂点保留但不渲染
	const globalRoot = document.getElementById('preact-root');
	if (globalRoot && !globalRoot.hasChildNodes()) {
		preactRender(null, globalRoot);
	}

	mountPanel('paneBag', BagPanel);       // Stage 2
	mountPanel('paneDaily', DailyPanel);   // Stage 3.1
	mountPanel('paneDungeon', DungeonPanel); // Stage 3.2
	mountPanel('paneWastes', WastesPanel);   // Stage 3.4
	mountPanel('panePodcast', PodcastPanel); // Stage 3.5
	mountPanel('paneTeam', TeamBuilderPanel); // Stage 6.1a
	mountPanel('paneAbyss', AbyssPanel);     // Stage 3.3

	// Stage 5.2: 战斗全屏 UI 迁入 #battleOverlay
	mountPanel('battleOverlay', BattleView);

	// Stage 5.1 + Phase 2 修正:RoleModalManager + AppShell 合并到 GlobalLayer 单根,
	// 避免对 #preact-root 重复 preactRender(后者覆盖前者,靠副作用已执行的隐式假设)。
	if (!mounted['globalLayer']) {
		if (globalRoot) {
			preactRender(h(GlobalLayer, null), globalRoot);
			mounted['globalLayer'] = true;
		}
		installModalCloseHandler();
	}

	// Stage 6.1b: 共鸣唤取主面板 + 顶部资源栏 + 商店
	mountPanel('viewGacha', GachaPanel);
	mountPanel('paneShop', ShopPanel);
	mountPanel('gres', TopOverview);
	// 运营邮箱 · 左上角入口
	mountPanel('mailEntry', MailEntry);
	// AppShell 第二小步:顶层视图 tab 改为真 Preact 组件(替代 AppShell 的 .vtab 命令式接管)
	mountPanel('viewTabs', ViewTabs);
	// dateNow/dateMeta in .timeline .ti
	const tiEl = document.querySelector('.ti');
	if (tiEl && !mounted['dateInfo']) {
		preactRender(h(DateInfo, null), tiEl);
		mounted['dateInfo'] = true;
	}
}
