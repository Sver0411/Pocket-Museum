# 实机系统界面研究与实现范围

更新：2026-11-10。目标是逐台对齐实机，目前是可操作的第一轮系统界面，**还没有完成所有机器从外壳到内置应用的 1:1 复刻**。没有捆绑官方 BIOS、系统固件、字体或原版应用。系统界面由 React/CSS/SVG 实现；GB / GBC / GBA 插卡游戏由真实 mGBA 执行，NDS 由单实例 DeSmuME 执行；PSP 可选连接用户本地 PPSSPP。

## 固定参照

| 机器 | 系统参照 | 已实现的流程 | 尚未对齐 |
| --- | --- | --- | --- |
| Game Boy DMG-01 | DMG 无卡启动 | 绿色 LCD、无卡标志块下落；按钮不会进入虚构菜单 | BIOS 原始像素、时序、音效；GB Snake 已通过真实核心输入/状态回退，GBC 彩色卡带仍待独立验收 |
| GBA AGB-001 / SP AGS-001 | GBA BIOS 无卡开机 | GAME BOY 启动标识，无卡留在启动页；AGB/AGS 插入卡带后运行真实 mGBA | 原版 Logo 像素/色彩/声效与 Multiboot 行为 |
| DS Lite USG-001 | 英文 DS Lite 固件说明书 | 健康提示、双屏主页、时钟日历、无卡状态、PictoChat 房间与本地文字/绘图输入、Download Play 搜索页、Options/Clock/User/Touch Screen 设置入口、退出设置关机 | 原版位图字体、完整屏幕键盘、无线联机、发送绘图消息、所有设置的硬件效果、完整健康信息 |
| 原版 3DS CTR-001 | 英文欧洲版 3.0.0-6E HOME Menu；2012 年原版 3DS 手册 | 无卡主页、图标选择和 1–3 行布局、亮度、HOME 暂停/Resume/关闭（System Settings 使用自己的 Close）、设置分类与选项、部分内置应用空库页 | 完整系统应用（Mii Maker/Plaza/AR/Face Raiders/eShop 等）、原版图标/字体/动画、完整系统设置与多语言、图标重排 |
| PSP-1000 | 英文 XMB 6.61 视觉目标；Sony current guide 的对应型号条目 | 横向分类/纵向条目导航、设置列表与编辑/确认/取消、主题颜色、空 UMD/Memory Stick、HOME 返回；可选外接 PPSSPP 真实控制及窗口共享 | 原版 XMB 字体/图标/波纹/过渡、全部设置条目、媒体与网络、USB/UMD 硬件行为 |
| PS Vita PCH-1000 | 3.74 目标；Sony 3.73+ 用户指南 | 锁屏滑动/揭角、气泡分页、LiveArea 的 Start、应用/PS/索引导航、最多六个 LiveArea、第七个淘汰最早项、关闭、设置与选项保存 | 原版气泡图标/LiveArea 素材/字体、全部内置应用及系统设置、多语言、动态页编辑、网络/奖杯/相机服务 |

设置目前保存用户选择；亮度、PSP 主题颜色、DS 用户名等已有对应可见反馈。语言选项没有全系统翻译，日期/时区已驱动时钟，安全/格式化/网络选项未模拟硬件副作用。只显示设置值不能视作该功能已经完整实现。内置应用未实现的页面明确显示未实现状态，不伪装成已成功联网或运行原版应用。

## 官方资料与技术依据

- [GBA 官方手册（英/德/法）](https://www.nintendo.com/eu/media/downloads/support_1/game_boy_advance_4/GBA_Manual_UK_DE_FR.pdf)：插入 Game Pak 后开机，不存在主机内置卡带库。
- [GBA SP 官方手册入口](https://en-americas-support.nintendo.com/app/answers/detail/a_id/16961/)：AGS 的电源、前光与卡带使用顺序。
- [GBATEK，mGBA 项目维护的技术文档镜像](https://mgba-emu.github.io/gbatek/)：分辨率、GBA 无卡下载/Multiboot 机制与 BIOS 接口；启动动画当前是 UI 重建，未运行原 BIOS。
- [DS Lite 官方说明书，第 12–13、18、22–26 页](https://assets.nintendo.eu/image/upload/v1635390384/NAL/Support/DSLiteInstructionBooklet.pdf)：菜单、时钟日历、PictoChat、设置分组与退出设置关机。
- [DS 官方菜单图](https://en-americas-support.nintendo.com/app/answers/detail/a_id/7255/)：上下屏职责、两个插槽、亮度/设置/闹钟。
- [原版 3DS 官方说明书，第 36–41、68–89 页](https://assets.nintendo.eu/image/upload/v1626222882/NAL/Support/3DSOperationsManual_AU.pdf)：HOME Menu、图标行数、内置应用与设置。
- [3DS 官方更新历史](https://www.nintendo.com/en-gb/Support/Legacy-system/Latest-system-update-information-241709.html)：选用 3.0.0-6E 作为早期 HOME 目标，避免混入 4.0 的文件夹、7.0 的 Miiverse 和 9.0 的主题菜单。
- [PSP 官方设置目录](https://manuals.playstation.net/document/en/psp/current/settings/index.html)、[系统设置](https://manuals.playstation.net/document/en/psp/current/settings/index_system.html)、[默认设置型号差异](https://manuals.playstation.net/document/en/psp/current/settings/index_default.html)：不把 Go 的蓝牙、PSP-2000/3000 的视频输出等混入 PSP-1000。
- [Vita 官方屏幕说明](https://manuals.playstation.net/document/en/psvita/basic/screens.html)、[基本操作](https://manuals.playstation.net/document/en/psvita/basic/basicoperation.html)：主页 → LiveArea → Start → 应用；PS 键的分层返回与六个 LiveArea 限额。
- [Vita 无卡行为](https://manuals.playstation.net/document/en/psvita/game/game_card.html)：插卡增加应用图标，而不是进入统一卡带选择屏。
- [Vita 官方 3.74 更新页面](https://www.playstation.com/en-us/support/hardware/psvita/system-software/)：目标系统版本。

## 与严格原机复刻的既定差异

用户要求保留 Game Boy 等型号文字，但不显示 Nintendo 厂商 Logo。该排除在外壳与系统画面中继续执行。生成的机身图像是参考照片的视觉重建，尚不是尺寸标定的 CAD 或实机摄影扫描。故外壳透视、按键比例、接口、背面和翻盖背壳仍有差异。

## 状态与输入

- `src/systems/model.ts` 定义原生界面的状态机、菜单和设置选项；实体按钮与触屏共用状态。
- `src/systems/useNativeSystem.ts` 管理开机阶段、方向长按重复、设置持久化。网页使用 IndexedDB，离线单文件使用带异常保护的 localStorage。
- `src/systems/NativeScreen.tsx` 按 GB 160×144、GBA 240×160、DS 256×192、3DS 上 400×240/下 320×240、PSP 480×272、Vita 960×544 排版，再映射到照片中的屏幕。
- 插卡选择器属于网页外部控制；没有它的原机不显示虚构菜单。第一次使用默认不插卡；GBA 或 GBA SP 卡带库中选择 2048 Advance，再开电源进入真实游戏。
- 主页面、整合 HTML 和每台独立 HTML 共用同一份代码。HTML 包含系统 UI，不包含模拟器固件或游戏核心。

## 后续验收标准

以本表的固定机型和版本逐页采集实机/官方参考，在相同分辨率对齐布局、字形、图标、动效和输入步骤。只把已有对照证据的页面标记为 1:1；不要把通用空库页或设置值持久化算成完整应用复刻。当前表格未对齐项均为剩余工作。

## 2026-11-10 第二轮功能进展

下面是实际的本地网页实现，不能等同于已经运行原机固件或逐像素完成全部应用。

| 新增 | 当前可执行行为 | 与原机仍有差异 |
| --- | --- | --- |
| 三种翻盖姿态 | 半展开/完全展开/合盖；点击/拖动；底座与盖板逐机标定；保留运行实例 | 图片与 SVG 混合外壳，非实机 CAD；见 [翻盖记录](CLAMSHELL.md) |
| GBA 游戏 | GBA 与 SP 共用本地 mGBA、卡带导入与原生/即时存档；切换外壳先保存关机 | GB、DS 已接入并分别用 GB Snake / JamClown 验证；3DS/Vita 网页核心未接入；PSP 提供可选原生连接 |
| Mii Maker | 从零创建，肤色、发型/颜色、眼睛、嘴、眼镜、身高/体型、昵称/衣服颜色；保存与重开 | 自绘矢量人物与有限特征集；尚无完整原版脸型/部件/QR 格式、照片自动生成 |
| StreetPass Mii Plaza | 当前人物展示、人口、入口与设置页 | 无真正 StreetPass 无线协议和原版广场游戏 |
| Game Notes | 16 页文字与手写笔记、翻页、清空、持久化 | 非原版笔迹引擎，尚未复刻全部工具 |
| 相机 | 用户点击启动浏览器相机、前后镜头切换、JPEG 拍照入库；退出/暂停停止视频轨道 | 单个浏览器摄像头不能生成原机双目 3D；AR/Face Raiders 暂限相机入口，不包含完整内置游戏 |
| 媒体 | 3DS Sound、PSP/Vita 的图片/音频/视频读取真实本地库；播放/暂停/拖动进度、删除确认 | 浏览器编解码支持代替原硬件编解码，控件/字体不是逐像素复制 |
| 录音 | 浏览器 MediaRecorder 录音、本地入库、播放，最长 30 秒；退出/暂停结束录音 | 不包含原机所有声音特效/音源 |
| PictoChat | 本地绘图、橡皮/撤销、屏幕字母数字键盘；同源标签页以 BroadcastChannel 交换文字和实际 SVG 笔迹 | 是同源页面间通信，不是 DS 无线协议或互联网聊天室 |
| HOME / 主页排布 | 3DS 横向滚动、行数、肩键相机；3DS/Vita 长按图标交换位置，重开保留 | 拖动动画/所有布局细节仍需逐页对照 |
| 时钟与设置效果 | 手动日期/时间实际修改显示，时区/夏令时/12 小时制；亮度、主题色、反色、对比度；恢复默认及格式化本地媒体前确认 | 并非全部语言与每个设置都具备完整原机副作用 |
| Browser | 输入 HTTP(S) URL、真实 iframe 浏览、书签存储 | 受网页自身的 iframe 限制；不是原机浏览器内核，部分站点需单独打开 |
| Activity Log | 实际在本机内置应用中停留的时间按日累计、查看记录 | 无真实计步器，不伪造步数 |
| Friends | 3DS 暂存待注册的 12 位好友码 | 无 Nintendo 网络账号或真实好友通信 |
| Vita Content Manager | 从 PC 本地文件导入媒体、导出内容索引 | 不执行 Sony CMA 协议或官方备份格式 |
| Vita Welcome Park | Digit Chase、可解滑块拼图、简化滑板玩法、录音循环和相机入口、本地完成标记 | 自建玩法，非完整原版游戏/场景/奖杯条件；没有真实后触板与实体陀螺仪标定 |
| 在线应用 | eShop/PS Store、Party、Messages、near、Remote Play 的入口与无连接流程；消息草稿可保留 | 不接入已关闭/专有服务，不把离线状态伪装成功 |

数据库从 v1 升级到 v2，保留旧卡带、存档、配置，新增 `media` 对象仓库。网页仍不上传本地游戏、照片或录音；Browser 只有在用户输入网址后访问该站点。

追加官方依据：[Mii 创建步骤](https://en-americas-support.nintendo.com/app/answers/detail/a_id/1952/p/172/c/950)、[Mii Maker 功能](https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/Instant-Software/Mii-Maker/Mii-Maker-115540.html)、[Vita 设置目录](https://manuals.playstation.net/document/en/psvita/settings/index.html)、[PSP 系统设置目录](https://manuals.playstation.net/document/en/psp/current/settings/index_system.html)、[Sony 对 near/地图功能移除的说明](https://blog.ja.playstation.com/2015/01/28/20150128-psvita/)。Welcome Park 玩法属于本地重建，尚无足够官方逐帧对照资料，不标记为 1:1。

## 2026-11-10 原机画面校正与外接入口

最新逐像素坐标证据与当前差异分别在 [3DS](THREEDS_VISUAL_SPEC.md)、[PSP](PSP_VISUAL_SPEC.md)、[Vita](VITA_VISUAL_SPEC.md)。已校正 3DS 原生 HOME 工具栏/图标行数/亮度浮层/2×2 根设置/数据管理入口，PSP 类别与纵向条目的非均匀间距，Vita 3-4-3 布局和 LiveArea 门板位置。当前仍有重绘图标、替代字体、简化 banner/应用页面，未标为完整 1:1。

[本地资源包](../SYSTEM_RESOURCES.md) 可替换用户自己有权使用的图标、背景、上屏 banner 与字体；[连接 PPSSPP](../EXTERNAL_EMULATORS.md) 保留网页默认体验。已实际验证官方 macOS SDL 1.20.4 的按钮/模拟轴/暂停恢复，原生图形后端截图失败明确记录，原生窗口共享选择待手动验收。
