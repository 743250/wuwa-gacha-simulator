# Memory Index

## 总纲
- [工作环境总纲](project_work_environment.md) — termux+proot 双环境,跨环境符号链接共享 .claude/工作区/ccs,shell 入口决定 cwd,符号链接断裂是"改不掉"根因
- [ccs 反代与渠道管理总纲](project_ccs_channels.md) — 9 渠道 + thinking-proxy(43543)/xunfei_oai-proxy(43545) + 鉴权契约 + 503 重试 + 讯飞 thinking 协议偏差 + effort 透传映射
- [ccs proxy daemon 固定 authToken](project_ccs_proxy_fixed_token.md) — proxy-daemon.js generateProxyAuthToken() 改成固定返回 '193734760',所有 proxy 渠道共用,npm 重装会覆盖
- [通用工作方式总纲](project_work_style.md) — 搜索用短词、抓住用户线索直接验、承诺立刻落盘、对齐环境、批准后持续推进

## 项目索引
- [项目索引](project_index.md) — 4 个项目(buriedtown_mod/dol_mod/wuwa-gacha-simulator/流浪日记mod)的位置、性质、熟悉入口;跨项目共用 APK 存放与破解手记

## 工作方式反馈
- [子代理使用方式](feedback_subagent_usage.md) — 子代理用于并行分工,主代理同步做另一部分;不能干等子代理返回
- [根因要查全整条链路](feedback_root_cause_full_chain.md) — 调用链+读档恢复链+触发链三条都要画清,不准用单点防重入兜底替代根因,跨存档防重入必须写存档(含拾荒者双倍+金医生三次上门三次教训)
- [思维链预算](feedback_thinking_budget.md) — 思维链不超过 1200 tokens,简单问题快速动手,不过度分析;但触发链/存档/状态机 bug 必须画时序图(见上一条)
- [不重复全局思考+不虚构指令](feedback_no_repeated_global_thinking.md) — 规划定下后执行只看局部;thinking 中绝不放大用户指令次数
- [不手动备份 settings/conf/keys](feedback_no_manual_backup.md) — 改 ccs 文件不留 .bak/.backup,用户厌烦积压备份;极少数需回滚保险才临时备份到 /tmp 改完即删
