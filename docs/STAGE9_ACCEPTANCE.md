# Stage 9：实际使用体验与还原度优化

2026-11-10。基于 `df6afd4`；沿用 Stage 7 的存档修复与 Stage 8 的七套展示层。

## 实际实现

- 七机型继续共用一个运行状态、输入控制器与存储层。进入展馆与系统时先显示卡带目录，启动时才读取并校验所选演示 ROM；系统开机不再等待所有游戏下载。
- 卡带库保留插卡操作，增加直接「游玩」。正在运行的同一卡带再次点游玩会返回当前进度。手机底部提供快捷暂停/继续，反馈提示移至顶部，避免覆盖电源和卡带入口。
- 按用户最后确定的范围，**只有 Game Boy 与 GBA SP** 提供专注模式。屏幕按 160:144 / 240:160 放大；触控方向键、动作键、肩键、Start、Select 连接原有输入仲裁。模式切换保留同一个 iframe、核心与游戏进度；Esc 返回外观。合盖或切换展开姿态时回到机身视图。
- 专注模式有竖屏与横屏布局。320×568、390×844、844×390、1440×1000 的两款设备均实测屏幕比例、控件边界与无文档滚动。390px 手机上，GB 屏幕宽度由约 191px 增至 362px，SP 由约 227px 增至 362px。
- Game Boy 使用 mGBA 原生 `Game Boy` 模型与 `DMG Green` 四色调色板，移除把白色变成黄白色的重复 CSS 着色。
- DS 设置根页调整为 Options / Clock / User / Touch Screen 四个面板；上屏继续显示时钟、日历与设置说明。已有字段编辑、确认、取消及退出关机流程保留。
- 3DS HOME 图标滑动取消点击，避免在拖动已选图标时意外启动应用；长按重排时不会同时横向滚动。
- PSP XMB 补齐 Photo、Game、Network 分类轮廓，避免回退成文件夹图形。现有类别/条目位置、参考波形、设置与音效继续使用。
- Vita 记录已启动应用；首次显示 Start，返回 LiveArea 后显示 Continue，关闭时清理状态。User's Guide 链接打开官方指南。
- 原生存档导入可在关机状态完成；运行中导入会先停止旧核心，再写入 IndexedDB 并重新启动。自动保存避开正在执行的卡带/存档操作。

## 游戏与本地卡带

新增作者发行的 **Tobu Tobu Girl Deluxe**（262144 bytes，原始 ROM）。代码 MIT，图像、文字、音乐与音效 CC BY 4.0；作者说明、MIT 文本、固定源码快照、出处与 SHA-256 一并保留。图像与声音署名见 [third-party notices](../public/licenses/NOTICE.md)。

筛选中也检查了 Anguna 与其他 GBA 项目；本轮未将缺少可核对的完整素材再分发许可或发行二进制来源的候选加入内置卡带。

用户自备的宝可梦 `.gb` / `.gbc` / `.gba` / `.nds` 可以走现有本地导入流程。增加基于 ROM 头的版本名称识别，覆盖 GB 红/蓝/绿/皮卡丘/金/银/水晶、GBA 红宝石/蓝宝石/绿宝石/火红/叶绿、DS 钻石/珍珠/白金/心金/魂银/黑白与黑白2。保留 SHA-256 存档身份和 `pocketsp` v2 数据库。识别测试使用合成文件头；本轮没有取得用户的宝可梦 ROM，未声称已验证这些商业游戏的通关或存档兼容性。

## 实际验证

| 检查 | 本地结果 |
| --- | --- |
| `npm run verify` | 88 个固定资源 SHA-256 + TypeScript 通过 |
| `npm test` | 31 项通过 |
| `npm run build` | Vite 生产构建 + 八个独立 HTML 通过 |
| Stage 9 专项 | 7 项浏览器用例通过（覆盖以下体验、真实游戏与手势检查） |
| 八个独立 HTML | 离线打开、切换与本地资源检查通过 |
| Stage 9 桌面/手机七机型旅程 | 2 项通过；选机、开机、系统、实体方向键、暂停、继续、关机、返回展馆 |
| 专注模式与快速返回 | 同一真实 mGBA 实例、按键释放、即时保存/读取、同一卡带返回及退出清理通过 |
| 手机双指输入 | Chromium 触摸仿真，同时按住 A + Up，touchcancel 释放两键，真实核心输入记录匹配 |
| Tobu Tobu Girl Deluxe | 实际经过作者片头、进入游玩、即时存档与恢复通过 |
| 本地 ROM + 原生存档导入 | 真实 GBA 核心，冷启动前后完整字节相等 |
| 3DS 图标手势 | 滑动已选应用保持 HOME、没有意外启动，通过 |
| Stage 7 SRAM 用例 | 内存、文件系统、IndexedDB、刷新/开机后完整 SRAM 比较通过 |
| GB / DS 原有多核心用例 | 2 项通过；真实帧、DS 双屏/触摸、即时状态与刷新恢复 |
| 系统音效用例 | 2 项通过；解码音频、音量、Key Tone、Vita 音乐启停 |
| `npm run test:production` | GB/GBA/NDS 核心、视频、即时存档、DS 平铺与手机布局通过，零页面错误/外部请求 |
| 截图与布局测量 | 前后各 23 张运行截图；另有专注、横屏、系统设置与 Tobu 游戏截图；8 个专注视口测量通过 |

手机检查使用 Chromium 手机视口与触摸仿真；未使用实体 iPhone / Android 或实体手柄验收。系统音频通过 Web Audio 解码与播放证据检查，未将自动化检查描述为人工听音。

## 前后截图

打开 [前后对比页](screenshots/stage9/compare.html)，可切换七款设备、桌面/手机与 GB/SP 专注模式。

- [优化前截图清单](screenshots/stage9/before/index.json)
- [优化后截图清单](screenshots/stage9/after/index.json)
- [屏幕实测尺寸](screenshots/stage9/focus-measurements.json)
- [GB 实际游戏 + 手机专注](screenshots/stage9/after/gb-tobudx-focus-mobile.png)
- [SP 横屏专注](screenshots/stage9/after/sp-focus-game-landscape.png)
- [DS 设置界面](screenshots/stage9/after/ds-desktop.png)
- [PSP 手机界面](screenshots/stage9/after/psp-mobile.png)

## 参考与边界

DS 设置依据 [DS Lite 官方手册印刷页 22–26](https://assets.nintendo.eu/image/upload/v1635390384/NAL/Support/DSLiteInstructionBooklet.pdf)；3DS 沿用 [原机视觉规格及官方手册记录](research/THREEDS_VISUAL_SPEC.md)；PSP 沿用 [官方及模拟器运行参考](research/PSP_VISUAL_SPEC.md)，[官方背景设置说明](https://manuals.playstation.net/document/en/psp/current/settings/background.html)；Vita 使用 [官方屏幕操作指南](https://manuals.playstation.net/document/en/psvita/basic/screens.html) 及 [原机视觉规格](research/VITA_VISUAL_SPEC.md)。四色值来自已固定 mGBA 源码 `src/gb/overrides.c` 中的 DMG Green 预设。

本轮保留已有七套机身与独立平铺素材，没有重新生成整机图片。原有生成素材、矢量系统图标和字体仍有实机差异；网页系统是可交互重建，尚不等同于运行完整原厂固件。3DS、PSP、Vita 本页截图展示网页系统；PSP 外接 PPSSPP 功能保留，本轮未以真实外接模拟器验收。
