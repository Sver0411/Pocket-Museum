# 成品优化执行记录

2026-11-10。每阶段先核对现成实现，再保留已有功能进行适配；未通过实际游戏验收的核心不会标成支持。

| 阶段 | 状态 | 证据与决定 |
| --- | --- | --- |
| 0 成品调查与全项目审查 | 已完成 | THIRD_PARTY_UI、EMULATOR_FEASIBILITY、EXISTING_SYSTEMS_AUDIT 三份报告；已阅读现有状态、输入、存储、模拟器、系统、样式和许可 |
| 1 首页与游玩界面 | 已按新参考重做 | 奶油色展馆、展台铭牌、七机主题背景、统一圆角面板与弹窗；沿用 React 状态与 History API；六宽度×七机与前进/后退回归通过 |
| 2 机身与控制 | 本轮控制修正完成 | 比例、原生屏幕、PSP SOUND、Vita 电源/音量、GB 对比度 |
| 3 系统 UI | 继续按原机逐页校正 | 已核对官方手册、PSP 原机视频和 Vita3K 固定版本；修正 3DS HOME/根设置/数据管理、PSP XMB 位置/波纹、Vita 3-4-3 布局/LiveArea。原厂字体、美术、应用内页和动画尚未全部匹配，不能标为 1:1 完成 |
| 4 声音 | 已接入并测试 | AudioManager、Kenney CC0 提示音、Vita CC0 系统替代音乐；每机设置、按键音开关、真实 Web Audio 播放及轨道停止回归通过；不是原厂声音 |
| 5 模拟器扩展 | GB/GBA/DS 已接入 | GB Snake / 2048 Advance / JamClown 在真实 mGBA / DeSmuME 上通过输入、触摸和状态回退；PSP 可选外接 PPSSPP，3DS/Vita 网页核心未接入；GBC 独立彩色 ROM 仍待验收 |
| 6 完整验收 | 本轮功能验收通过 | 构建、30 项单元、76 项资源校验、37 个自动浏览器用例逐项通过（分组和修复后重跑）；1 个可选原生连接默认跳过，已另行实测 PPSSPP。生产构建的 GB/GBA/NDS、存档、移动布局检查通过，零页面错误与外部请求 |

详细成品调查见 [UI / 字体 / 音效 / 模型](research/THIRD_PARTY_UI.md)、[模拟器](research/EMULATOR_FEASIBILITY.md)、[现有系统审查](research/EXISTING_SYSTEMS_AUDIT.md)。未采用完整第三方壳层的原因是实际功能、许可和兼容性，非自主实现偏好。
