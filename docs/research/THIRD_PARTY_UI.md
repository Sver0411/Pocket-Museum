# Stage 0：系统 UI、机身与声音成品调查

调查日期：2026-11-10。决策依据为作者仓库、实际源码、许可与本地构建；不是按 Star 数量选择。未找到合适成品表示下列检索范围中未发现可直接替换本项目完整交互的实现，不表示互联网上绝无其他项目。没有引入官方固件、系统图标、商业字体、BIOS 或 ROM。

## 结论

- **不整体替换现有四套系统 UI**。已找到的 DS 网页只有时钟日历，3DS 插件只有列表排列，Vita 项目是 LiveArea 编辑器；整体嵌入将移除 Pocket Museum 已实现的设置、Mii、笔记、PictoChat、媒体和真实硬件按键联动。
- **采用现有授权字体**：DS-Menu 中 `fs-doublescreen-eno-c.ttf`，作者 Enzo Bicudo Pepi，SIL OFL 1.1；名称表核验为 FS/DoubleScreen ENO©。保留字体原文件、许可证与作者 README。不使用同仓库非商业字体。
- **采用现有授权音效包**：Kenney UI Audio（CC0），通过 Calinou 的固定提交 WAV 转换版获取。无需自主逐一合成所有反馈声音。它们是授权的替代提示音，不能宣称为原机启动音或原厂声音。
- **PSP 优先部分复用 XMDB 的原创 WebGL wave / SVG 图标**，保留 MIT 作者声明；不引入它的 IMDb watchlist、商业影片图片或远程元数据请求。主工程已有 XMB 状态机，不应为背景替换全部应用。
- **继续使用现有机身图片**。找到的 SP 3D 模型与目标并不匹配：一个 56 万三角形且 NoAI，另一个只有 96 三角形的像素风；不能因为可下载就作为已完成的写实七机型模型。

## 逐机 UI 对照表

| 目标 | 候选与 Demo | 许可证 / 固定版本 | 实际完整程度与维护 | 集成条件 / 决定 |
| --- | --- | --- | --- | --- |
| GB DMG-01、GBA AGB-001、SP AGS-001 无卡启动 | 官方用户说明书与现有启动状态；此类原机没有通用应用桌面 | 现有自主 UI；官方说明书仅研究 | 不虚构卡带选择操作系统 | 保留启动流程。游戏核心由模拟器调查另行决策 |
| DS Lite 固件桌面 | [lueyo/DS-Menu](https://github.com/lueyo/DS-Menu)，[Demo](https://lueyo.github.io/DS-Menu/) | 代码 MIT（lueyo 2024）；提交 `233601c1cf4184ce079efbbdaa3c69f8edb040a2`，2025-06-03 | 无构建步骤，HTML/CSS/JS；唯一 JS 文件只更新时钟与日历，没有菜单 click handlers、设置或 PictoChat 流程。含商业 NSMB 标识与许可不同的字体 | **部分采用 OFL 字体，不整体嵌入**。Demo 地址存在，本次网络请求失败；已下载源码可本地打开。未把未响应 Demo 记为通过 |
| 3DS HOME Menu | [giginet/jquery-3dsmenu](https://github.com/giginet/jquery-3dsmenu)，仓库 `demo/index.html` | 仓库没有可确认的 LICENSE；提交 `de07eada85be0e31f49c82abbf86db6c37f2e2b8`，2011-09-28 | 只有网格收放与拖拽排序；依赖 jQuery 1.3.2+ 与 jQuery UI 1.8.16+，README 明示 Safari 排序可能失败 | **不引入**：许可不明确、旧依赖，既非完整 3DS 系统也不满足当前触摸/原生按键状态需求 |
| 3DS 应用启动器 | [devkitPro/3ds-hbmenu](https://github.com/devkitPro/3ds-hbmenu) | 原生 homebrew 项目，逐文件许可；非 Web 发行 | 在真实 3DS 上运行的 homebrew 列表，不是固件 3.0.0-6E HOME Menu | 不直接用于网页。避免把硬件 launcher 与浏览器固件 UI 混为一谈 |
| PSP 480×272 XMB | [moeezalam/xmdb](https://github.com/moeezalam/xmdb)，[Demo](https://moeezalam.github.io/xmdb/) | MIT（Moeez Alam 2026）；提交 `0cf798b1f5f02404b0c382f4990df10f424a53fd`，2026-07-31 UTC | React19、TypeScript6、Vite8，480×272 逻辑画布，原创 WebGL1 波纹、SVG 类别图标和 WebAudio反馈。实际应用为 IMDb watchlist，不是完整 PSP 固件或游戏模拟器 | **部分复用 wave / SVG**。在 Node22.23.0 下实际 `npm ci --ignore-scripts` 与 `npm run build` 通过。纯 wave.ts 无 React/npm依赖，合适移入现有屏幕层并补齐 GPU 清理 / 暂停 / 降级。不能引入远程影片封面及第三方 API |
| PSP 波纹的另一成品 | [linkev/PlayStation-3-XMB](https://github.com/linkev/PlayStation-3-XMB)，[Demo](https://linkev.github.io/PlayStation-3-XMB/) | MIT（Mart）；提交 `1ec453a9dddec5448d615116ff428349f42d454e`，2026-02-11 | WebGL PS3 背景渲染与调参界面，非 PSP 完整系统；作者说明尚缺真实运行描述数据，不声称完全 1:1 | 不整体嵌入。优先采用更小、更贴合 480×272 PSP 的 XMDB 波纹；不引入开发者调参工作台 |
| PS Vita 960×544 LiveArea | [robin994/LiveAreaDesigner](https://github.com/robin994/LiveAreaDesigner)，[Web editor](https://robin994.github.io/LiveAreaDesigner/) | MIT（Roberto Tortora 2026）；提交 `b54f4e81a735ec3559d3b59c162db72f9b8a1811`，2026-10-22，Web1.32 | 可编辑布局、导出 XML / VPK；本地图片、localStorage/IDB、无上传。**不是**锁屏/气泡主页/应用系统。布局工具源代码说明位置数字来自用户自行提供的 RCO，仓库不需要分发固件 blob | 保留现有运行 UI。可研究 `docs/geometry.mjs` 的 CARD 常量及布局计算，但没有必要把完整编辑器放进 Vita 屏幕。若复用代码需保留 MIT；不复制任何原机图片/字体 |

### 字体文件逐一核验

读取了 TrueType `name` 表中的作者、字体家族和许可证字段。仓库根 MIT 不覆盖第三方字体的独立条款。

| DS-Menu 文件 | 嵌入字体名称 / 作者 | 独立许可 | 决定 |
| --- | --- | --- | --- |
| `src/fs-doublescreen-eno-c.ttf` | FS/DoubleScreen ENO© / Enzo Bicudo Pepi 2020 | Open Font License；`src/license.txt` 为 SIL OFL1.1，`src/readme.txt` 指向作者 Fontstruct1850563 | **采用原文件**，同时附带两个 notice |
| `src/font.ttf` | Nintendo DS BIOS / David Fens 2013 | FontStruct Non-Commercial License | 不引入 |
| `src/pixelate-7.ttf` | Pixelate7 / Plus Channel2022 | FontStruct Non-Commercial License | 不引入 |
| `src/pictochat.ttf` | PICTOCHAT / Guywah2020 | CC BY3.0 | 本轮不引入，优先只用已核验 OFL 字体 |
| `src/cave-story-dsi.ttf` | Cave Story(DSi) / heated2011 | CC BY-SA3.0 | 本轮不引入，避免增加字体来源和衍生许可复杂度 |

OFL 字体 SHA-256：`f173eb81134c120cadcd6e3cce50cae77031db6ea36110dd6060be96c1d2e3c6`。

## 声音成品

| 候选 | 作者 / 许可 / 固定版本 | 获取与实际检查 | 采用决定 |
| --- | --- | --- | --- |
| [Kenney UI Audio](https://kenney.nl/assets/ui-audio) | Kenney Vleugels；CC0；官方页面50文件、v1.0（2012） | 官方 ZIP URL：`https://kenney.nl/media/pages/assets/ui-audio/490d233f68-1677590494/kenney_ui-audio.zip`。本次直接获取返回403，未假称下载了原包 | 使用下行有许可的转换镜像 |
| [Calinou/kenney-ui-audio](https://github.com/Calinou/kenney-ui-audio) | Kenney；CC0；镜像 v1.0.0（2020-12-05），提交 `8c3d81b9159d058c444f89d12d518276b0b09345` | 已完整 clone；50 个 WAV。README 明确为官方 OGG 解码为 WAV 并保留 Kenney CC0 notice。原始内容未重新合成 | **采用短按钮/开关/rollover样本**，无需Godot依赖；用浏览器 AudioContext 播放。选中声音的实际文件哈希应写入 assets-manifest |
| XMDB `src/lib/audio.ts` | MIT；同 XMDB固定提交 | 有 move/lateral/enter/back/error 原创振荡器声音，处理用户手势解锁 | 可复用解锁/声音调度思路，但已有授权样本可优先采用。不是 Sony 固件音效 |

## 机身 / 3D 模型

| 候选 | 许可与实际形态 | 决定 |
| --- | --- | --- |
| [Let’s Do 3D GameBoy DMG-01](https://sketchfab.com/3d-models/gameboy-dmg-01-29849a15fe0a40a6a18e01c9d544a0ed) | 作者页 CC Attribution，18.1k triangles、9.9k vertices（2023-05-29）；按键分件未知 | 可作为后续 WebGL 建模候选；本轮未下载模型/纹理，不能宣称已完成输入和材质适配 |
| [Koycho Nintendo Gameboy Advance](https://sketchfab.com/3d-models/nintendo-gameboy-advance-299c09e4de7d43f3b7ea9afb249de786) | 作者页 CC Attribution，298.9k triangles、149.5k vertices（2021-04-30） | 高面数、内部结构与按钮绑定未知，暂保留现有 AGB 素材 |
| [zombitt Nintendo DS Lite](https://sketchfab.com/3d-models/nintendo-ds-lite-b13d2c9ac9404958b8358f9af871f2dc) | CC Attribution；5256 triangles、2670 vertices、2材质、4K PBR，作者明确 No Rigging / No Animation（2022-03-02） | 适合下一轮模型试装候选；铰链与按键仍需分件工作，非即插即用替换 |
| [Noé Nintendo3DS](https://sketchfab.com/3d-models/nintendo-3ds-adf64efa517449678c369dc8fa3f05dd) | 作者页 CC Attribution，18.9k triangles、9.5k vertices（2025-09-26）；虽然描述说可无署名，仍以页面正式CC BY条款为准 | 目标型号与 rig 未实际检查，不下载 / 不冒称已支持。New3DS、XL等候选不等同CTR-001 |
| [F358 Sony PSP-1000 FREE](https://sketchfab.com/3d-models/sony-psp-1000-free-0446f2b8b57a4dbeae65769eb5d17354) | CC Attribution，96.3k triangles、48.8k vertices（2024-05-31） | 型号匹配但较重，需模型分件/厂商标识/纹理逐项确认，未替换当前控件层 |
| Vita PCH-1000 模型检索 | 检索 `PS Vita PCH-1000`、`Sony PSVITA`、`PS Vita CC Attribution`；找到 [BitBuilt PCH-1000 3G扫描讨论](https://bitbuilt.net/forums/threads/ps-vita-1000-3g.6421/) 与保护壳打印模型，未确认有明确再分发许可且完成按钮分件的写实整机 | 本轮没有可直接采用的已核验模型。不能拿保护壳/支架或未明确许可的扫描当完成整机，保留现有素材 |
| [Smoggybeard Gameboy Advance SP](https://sketchfab.com/3d-models/gameboy-advance-sp-b79bb731b6b844fd8c61bee31e26a323) | 作者页面 CC Attribution，563.4k triangles、285.5k vertices，NoAI 条款 | 不是即插即用的七台掌机。未下载、未输入生成模型。高面数、按键分件/铰链未知，不作为本轮替换素材 |
| [ZappyGru Game Boy Advance SP](https://sketchfab.com/3d-models/game-boy-advance-sp-168ea5b264174be5aeaf9da77ed2bd3d) | CC Attribution，96 triangles、64 vertices，Blockbench 像素风 | 风格和写实需求不符，不引入 |
| 现有七套机身与三套正视图 | 项目原有生成素材，来源与提示词已记录 | 当前 UI 阶段继续使用，避免为引入不完整模型破坏比例、控制和加载性能。不能据此宣称完成CAD或机械尺寸1:1 |

## 已准备的授权资源与运行复查

- OFL 原文件：`public/fonts/fs-doublescreen-eno-c.ttf`；notice 为 `public/licenses/FS-DoubleScreen-OFL.txt` 与 `FS-DoubleScreen-README.txt`。
- 选中 Kenney 原 WAV：`public/audio/kenney-ui/` 内 `rollover1`、`mouseclick1`、`mouserelease1`、`switch1`、`switch2`、`switch6`、`switch7`、`switch10`；`provenance.json` 记录提交、每个文件的 SHA-256、字节数和实际时长。总计约354KB。许可副本为 `public/licenses/Kenney-UI-Audio-CC0.txt`。这里只准备资源，是否已接入声音 / 字体以实际运行代码和验收为准。
- DS-Menu 本地 `file://` 加载返回200，页面零 JS 错误，实际 `button` 元素为0；源代码和浏览器均证明它只是一张有活动时钟日历的展示菜单。研究截图 `.research/DS-Menu-local.png` 与当前系统双屏截图对照，现有项目保留了更多可操作流程。
- XMDB 本地构建后，必须用 `npm run preview -- --base /xmdb/` 匹配构建路径；直接默认 preview 会导致 `/xmdb/assets/*` 404，这是开发配置差异，不是实际源码无法构建。正确路径运行后进行截图和键盘方向导航。研究截图保存在 `.research/`，没有把含影片封面的候选截图当作本项目交付素材。

## 集成时需补齐的生命周期

- XMDB `src/lib/wave.ts` 的 `startWave(canvas,month)` 返回 `stop` / `setIntensity`；原文件的 `stop` 只取消 RAF，没有删除 shader、program、buffer。移植时应补资源释放、visibility/暂停、reduced-motion 以及 CSS 降级；它使用 WebGL1，不需要 WebGPU。
- XMDB `src/components/Icons.tsx` 为原创 SVG 类别轮廓，可在屏幕中复用并保留 MIT；图标是近似绘制，不能叫原厂资源。
- 字体以原名与原文件分发；不修改 reserved font name，不把字体本身改为 GPL。应用与 font face 引用不改变 OFL。
- 所有外部候选只有在真正复制并接入后才进入 NOTICE 的“已采用”清单；本表的“可采用”不等于已经集成。
- 原生PSP/3DS/Vita项目、串流前端、LiveArea编辑器不能被报告为本地Web游戏核心。
