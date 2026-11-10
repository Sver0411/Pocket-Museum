# 现有系统实现审查（Stage 0）

审查时间：2026-11-10。基线：0.1.1。审查范围为 `src/systems/` 全部 TS/TSX/CSS、`src/styles.css`、`docs/design/`、原有 `docs/research/` 和 `public/licenses/` 文本及源码压缩包许可证目录。没有改动运行时代码，也没有运行原机固件。

## 可以保留的现有结构

- `model.ts` 的 `systemReducer`：电源、DS 健康屏、3DS HOME 暂停/Resume、Vita Lock→HOME→LiveArea→App→Index、设置确认和删除确认均是实际状态机；触摸与实体按键共用状态。
- `useNativeSystem.ts`：主工程把各机设置存入 `pocketsp` 数据库的 `system:<device>`；独立 HTML 使用 `pocketsp:system:<device>` localStorage。方向键有 420 ms 延迟和 115 ms 重复，暂停/关机停止重复。
- `camera.ts` 的序号令牌会取消尚未返回的权限请求，失效流返回后立即结束轨道；HOME、暂停、合盖和切机有停止路径。图片实际生成 JPEG，并通过现有 IndexedDB `media` 表持久化。
- `media.ts` / `NativeApps.tsx` 的 `MediaApp`：真实本地文件、Blob URL 生命周期、HTMLMediaElement 播放/暂停/进度和 AVLS 限幅已经存在。不要以界面重构为理由替换这些可用功能。
- `PictoChat.tsx` / `wireless.ts`：确实交换文字和 SVG 笔迹，机制为同源 BroadcastChannel；不是 DS 无线协议。`InkPad`、16 页笔记、Mii 特征、主页图标换位均已有实际保存路径。

## 重点问题与建议

| 证据位置 | 当前实际行为 / 风险 | Stage 2–4 建议 |
| --- | --- | --- |
| `NativeScreen.tsx:NativeScreen` / `.native-pixels` | 排版分辨率正确，但 `scale(size.w/nativeW, size.h/nativeH)` 独立缩放两轴；半展开 DS 的玻璃坐标并非原生比例，内容会被拉伸 | 在原生分辨率容器上用统一缩放、居中留边；透视只由机身玻璃的四角映射负责。平铺的现有正确比例保留 |
| `native.css:.native-pixels`、DS 选择器 | 默认 Arial、DS 为 Courier New；尚无原版或授权匹配字库，不能称字体 1:1 | 优先引入授权复古字体（已有第三方调查候选），固定版本并保留 OFL；DS 像素字形和 PSP/Vita 比例字体分开，禁止从固件提取 |
| `devices.ts` PSP `sound`、`App.tsx` `onMute` | SOUND 每次释放直接静音；`UtilityKey` 没有短按/长按区分 | SOUND 短按 EQ、长按超过 1 秒静音；仅显式耳机输出模式的音乐适用 EQ，游戏不套用 EQ。浏览器不能可靠识别真实插头，不假装自动识别 |
| `model.ts` `Sound Settings` / Vita `Sound & Display` | `keytone`、`music` 等选项保存后没有声音消费者 | AudioManager 统一接入用户手势解锁、静音/渐变、机型声效、确认/返回/导航；mGBA 音频保持核心输出，不能叠加开机游戏音 |
| `App.tsx` `display` 配置 | 一份 `muted/volume/light` 供所有机型使用 | 向现有 settings 表新增每机音量键，首轮从旧 display 值迁移；不改数据库名、不清空配置 |
| `NativeApps.tsx:MediaApp` | `avls` 对 HTML 音频/视频生效，阈值为网页选定 0.6；不是实机 dB 标定 | 统一媒体、录音循环与新 UI 声效的限幅规则；记录网页阈值并不宣称原机声压相同 |
| `devices.ts` Vita 定义 | 只有 Home utility，没有电源 / VOL± 实体命中区 | 根据 PCH-1000 官方前部图，补齐顶部电源和音量位置；不要把右摇杆按压作为 L3/R3（原机不支持） |
| `NativeScreen.tsx:SettingsPanel`、`model.ts:THREE_SETTINGS` | 3DS Touch Screen / Circle Pad / Mic Test 等仅编辑一个“Calibrate/Test”字符串；只有 DS `section === Touch Screen` 有点击流程 | 原生校准工具需要真实点击/轴/麦克风读数，或明确保留未支持；不能把保存 `Calibrate` 当完成 |
| `NativeScreen.tsx:Calibration` | DS 三个十字点击后提示完成，未计算误差，也未改变触摸变换 | 可保留为响应检查，但名称/完成文案应区分“响应测试”与真实硬件校准；网页 Pointer 已由浏览器校准 |
| `NativeApps.tsx:Recorder.start` | 权限令牌、最长 30 秒与退出停止已实现；但 `getUserMedia` 成功后 `new MediaRecorder(media)` 若抛错，catch 不立即停止已取得的轨道 | 初始化失败必须停止本次 stream 并清理 timer / recorder；保持已有失效令牌保护 |
| `useNativeSystem.ts` 媒体删除/清空 effects | 删除操作未 catch，可能产生未处理 Promise 拒绝；只有成功路径清标记 | 失败显示实际错误，避免自动重复副作用；不要静默伪装删除成功 |
| `NativeApps.tsx:CameraApp` | AR Games / Face Raiders 使用相机入口，没有 AR 识别和完整游戏 | 保持功能范围说明；不把拍到照片算作原版游戏完成 |
| `NativeApps.tsx:PlazaApp` | StreetPass Settings 直接弹出“StreetPass is enabled for Mii Plaza.”，没有真实无线能力 | 改为明确说明此环境没有 StreetPass；若仅实现本地开关，需要显示“本地界面设置”而不是成功连接实机无线 |
| `model.ts:SETTINGS/VITA_SETTINGS/DS_SETTINGS/THREE_SETTINGS` | 语言、网络、Wi-Fi/Bluetooth、USB、WMA/Flash、UMD Auto Start、安全锁、家长控制、自动睡眠、闹钟、幻灯片速度等多数仅存值 | 逐项列出 browser-backed / local-only / unsupported。可控项接实际行为；硬件/服务项清楚显示限制，避免无副作用确认页 |
| `settingsBehavior.ts:commitPreference` | 日期有效性与偏移已有；datetime-local 分支只验证日期，未单独验证输入小时/分钟范围 | 对完整时间都验证，避免无效时间被 Date 自动归一化；保留 ROM / 存档身份不变 |
| `model.ts` birthday 与 `inputKind` | DS birthday 原候选为 `MM/DD`，但所有 birthday 统一 date 输入，首次编辑兜底完整日期 | DS 应保存月/日语义并显示当前值；不要将重开后的生日默默显示为默认值 |
| `NativeScreen.tsx:NativeScreen` | invert / contrast / bold 有可见反馈；`large` 无消费者 | “Larger Text”要真正改变允许区域字号与滚动，或标记当前未支持 |
| `NativeScreen.tsx` 顶屏 / `NotebookApp` | 所有屏幕统一可接 Pointer；Game Notes 的 16 页选择按钮放在 3DS 上屏 | 原机 3DS/DS 只有下屏触摸。把可交互页选择置下屏；上屏保留显示，实体按键可操作 |
| `useAppButtons.ts` | 方向键使用几何邻近聚焦，A 点击当前元素；原生 input range / select 不会因此获得原机式增减逻辑 | 针对 slider/select 加值变更处理，保留普通按钮空间导航；不要让硬件 A 在任何表单页面总是点击 Back |
| `useNativeSystem.ts` activity timer | 每 10 秒累计 phase=app 停留，未检查 document.hidden，后台仍可能计时 | 随可见性暂停计时；步数 0 必须继续说明无计步器，不能制造步数 |
| `ServiceApps.tsx` | 商店 / Party / Remote Play / Friends 为离线入口，Send 只报网络需求；不是实际在线服务 | 继续明确能力边界，不构造模拟“登录成功/发送成功” |
| `WelcomePark.tsx` | 数字/拼图/简化滑板有本地玩法；Sound Loop / Hello Face 是媒体入口，前 3 项有本地完成标记 | 与真实 Welcome Park 分开记录；无原始后触板/陀螺仪不能称完整原版玩法；Blob playback Promise 要处理拒绝 |
| `src/styles.css:body`、移动端规则 | min-width=340px，因此 320px 天然溢出；小屏仍堆两块侧栏；多次覆盖的旧规则较多 | Stage 1 收敛为博物馆首页、单机中央主体和紧凑工具条，旧规则按组件有序保留后清理；新增 320/390/768/1024/1440/1920 截图 |

## 官方依据

- [PSP Key Tone](https://manuals.playstation.net/document/en/psp/current/settings/keytone.html)：确认音可由此开关关闭；不是只有把值存到设置表。
- [PSP AVLS](https://manuals.playstation.net/document/en/psp/current/settings/avls.html)：限制耳机最大音量；没有给出网页增益 0.6 这样的标定。
- [Sony PSP-3004 官方快速指南，第 9 页](https://www.playstation.com/content/dam/global_pdc/en/corporate/support/manuals/psp-docs/psp-3004/PSP-3004-QR%24en.pdf)：短按 SOUND 在 HEAVY/POPS/JAZZ/UNIQUE/OFF 间循环，超过 1 秒静音；音色仅耳机适用，游戏期间暂为 OFF。此页属于 3004，不能据此引入视频输出或 3000 系列独有硬件；精确 PSP-1000 手册仍待补齐。
- [Vita PCH-1000 官方部件图](https://manuals.playstation.net/document/en/psvita/basic/partnames.html)：A 为电源，E 为 VOL+/VOL−；双摇杆不能按压；PS 键返回 LiveArea/索引。
- [Vita Mute Automatically](https://manuals.playstation.net/document/en/psvita/settings/automute.html)：是耳机断开后的扬声器静音，音乐会暂停；不能等同网页全局静音。
- [Vita AVLS](https://manuals.playstation.net/document/en/psvita/settings/avls.html)：限幅设置，部分型号关闭累计 20 小时后重新开启；当前实现没有追踪这一行为。

## 许可与源码元数据

已核对项目 NOTICE、React MIT、Lucide ISC、libtonc MIT、Maxmod ISC、EmulatorJS GPL-3.0、mGBA/devkitARM MPL-2.0、2048 CC0 文本。两份 MPL 文本 SHA-256 一致：`fab3dd6bdab226f1c08630b1dd917e11fcb4ec5e1e020e2c16f83a0a13863e85`。

源码压缩包根许可：EmulatorJS v4.2.3 为 `LICENSE`（GPL-3.0，35,111 字节）；2048-GBA `LICENSE`（CC0，7,048 字节）；mGBA commit 57678d6 `LICENSE`（MPL-2.0，16,726 字节），另含第三方独立许可证；devkitarm-crtls 快照的逐文件许可需继续保留。EmulatorJS 本地 patch 已单独记录；精确核心构建源码 commit 缺失的问题原 NOTICE 已披露，当前不能声称字节级可复现。

任何新字体、UI 波纹、音效和核心都应在使用前固定来源、版本和许可，保留作者 NOTICE。现成 UI 的开源许可不自动覆盖其内含的商业固件图标、字体、音效。此报告是工程来源与实现审查，不是对未来发行物法律合规性的完整认定。

## 建议实施顺序

1. 先落地首页与布局，保留所有现有状态机、数据键和媒体接口，建立各阶段回归基线。
2. Stage 2 校准原生比例与实体控制，补齐 Vita 电源/音量、GB 对比度、3DS 深度与音量、PSP 短长按。
3. Stage 3 优先接入有明确授权的 DS 字体和可验证 UI 组件；修正虚假的成功文案、实际表单/设置行为与媒体失败清理。
4. Stage 4 由唯一 AudioManager 控制 UI 声音和每机音量；媒体和核心保留自身音源，只统一音量/静音/生命周期，不能重复播放。
5. 未能实施的原版系统和硬件行为写入支持矩阵，不以空库页或设置保存代替真实完成证明。
