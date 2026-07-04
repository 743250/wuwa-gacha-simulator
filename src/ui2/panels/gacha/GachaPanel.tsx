// 共鸣唤取主面板 · Stage 6.1b
// 挂载到 #viewGacha，渲染完整唤取视图

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { GachaBanner } from './GachaBanner';
import { PullPanel } from './PullPanel';
import { RoleGrid } from './RoleGrid';
import { SidePanel } from './SidePanel';

export function GachaPanel() {
  useS();
  return (
    <Fragment>
      <div class="section-top">
        <div class="banner-wrap">
          <GachaBanner />
        </div>
        <div class="pull-card">
          <PullPanel />
        </div>
      </div>
      <div class="section-bot">
        <div class="col">
          <div class="col-wrap">
            <h2 class="col-head" style={{ marginTop: 0 }}>角 色 与 共 鸣 链</h2>
            <div class="roles" id="roles">
              <RoleGrid />
            </div>
          </div>
        </div>
        <div class="col">
          <div class="col-wrap">
            <SidePanel />
          </div>
        </div>
      </div>
    </Fragment>
  );
}
