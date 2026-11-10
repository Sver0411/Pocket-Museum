# 浏览器模拟器可行性调查

调查日期：2026-11-10。这是引入前的证据与决定，不表示所有核心已经接入或通过游戏验收。已有运行基线为本地 EmulatorJS 4.2.3 / mGBA；调查没有下载商业 ROM、BIOS、固件或密钥。

## 七机型决定

| 机型 / 目标 | 成熟候选与演示 | 许可证 / 版本 | 实际集成条件与决定 |
| --- | --- | --- | --- |
| DMG-01：GB / GBC | [mGBA](https://github.com/EmulatorJS/mgba)、[mGBA FAQ](https://mgba.io/faq.html)、[EmulatorJS 演示](https://demo.emulatorjs.org/)；备选 [binjgb](https://github.com/binji/binjgb) 的 WebAssembly 浏览器实现 | mGBA MPL-2.0，现有 RetroArch 前端 GPL-3.0；binjgb Apache-2.0 | **优先复用现有 mGBA 包**。解包后的 `core.json` 明确列出 `gb, gbc, gba`；无须新增核心下载。EJS 4.2.3 的 `gb` 别名只列 Gambatte，因此应明确设置 `EJS_core='mgba'`，不要误用别名。需真实 ROM 验证启动、160×144、方向、声音与 SRAM，不能只改扩展名即宣称完成。 |
| AGB-001：GBA | 现有 mGBA + EmulatorJS | 固定 4.2.3；核心构建 2025-06-14，包格式 2.0.2、最低 EJS 4.2.2 | **保留**现有真实核心、SHA 身份、SRAM 和即时存档格式。没有引入新 CPU/GPU 模拟代码的理由。 |
| AGS-001：GBA | 同 AGB-001 | 同上 | **保留**，继续与 GBA 使用同一 ROM / 存档身份，但机型适配配置独立。 |
| USG-001：NDS | [EmulatorJS NDS](https://emulatorjs.org/docs/systems/nintendo-ds/) 的 DeSmuME / melonDS / DeSmuME2015；备选 [44670/desmume-wasm](https://github.com/44670/desmume-wasm)，[在线演示](https://ds.44670.org/) | DeSmuME GPL-2.0-or-later；melonDS GPL-3.0；EJS 固定 4.2.3 | **优先评估同版本 DeSmuME**，可减少另一套存档/输入适配。其包不要求线程，支持鼠标；[libretro 官方资料](https://github.com/libretro/docs/blob/master/docs/library/desmume.md) 将 DS BIOS / firmware 标为可选。melonDS 官方 EJS 文档则要求 BIOS7、BIOS9、firmware，不能擅自打包。双屏需一个实例输出并分屏显示，下屏输入必须到达真实核心。未验证前保留系统 UI。 |
| CTR-001：3DS | [当前 EJS Azahar 文档](https://emulatorjs.org/docs/systems/azahar/)、[EmulatorJS 主分支](https://github.com/EmulatorJS/EmulatorJS)、[Azahar](https://github.com/azahar-emu/azahar) | Azahar GPL-2.0-or-later；当前主分支调查 SHA `5a65bde5d3b47c75f22e90453c3c14c469411589`（2026-10-21） | **已有浏览器上游，不能写成不存在**。但 Azahar 不在本项目固定 4.2.3 中。当前文档要求线程，主分支仍与稳定版存在 API 差异；需单独固定版本、COOP/COEP、WebGL2、合法可运行软件及移动端性能验收。此轮不能把普通 HOME UI 宣称为 3DS 游戏核心。 |
| PSP-1000：PSP | [EmulatorJS PSP](https://emulatorjs.org/docs/systems/psp/)、[PPSSPP](https://github.com/hrydgard/ppsspp)、[EJS PPSSPP 构建源](https://github.com/EmulatorJS/ppsspp) | PPSSPP GPL-2.0-or-later；EJS 4.2.3 已内置 PSP 识别与加载路径 | **同版本可进一步评估**。需要 `EJS_threads=true`、SharedArrayBuffer、同源隔离、WebGL2，且必须提供 PPSSPP 自有开源运行资源；不是下载普通 `ppsspp-wasm.data`。正确包名为 `ppsspp-thread-wasm.data`。未做实际游戏、音频、状态恢复和触控验收前，不列为已支持。 |
| PCH-1000：Vita | [Vita3K](https://github.com/Vita3K/Vita3K)、[官方快速开始](https://vita3k.org/quickstart.html) | GPL-2.0；持续构建面向 Windows/Linux/macOS/Android | **保留自主系统界面，游戏未支持**。本次没有找到官方可直接集成的成熟浏览器 WASM 发行物；检查官方 release 的实际 assets 也没有 Web 包。桌面软件或名为“Web”的游戏兼容条目不能作为浏览器核心证明。不可把桌面远程串流或系统界面当作本地 Vita 模拟。 |

## 固定 4.2.3 包实际检查

从 `https://cdn.emulatorjs.org/4.2.3/data/cores/` 读取，报告和调查副本放在忽略的 `.research/core-survey/`。以下是压缩传输大小，不是 WASM 运行内存。包内 `build.json` 只给最低版本和包格式，**不提供精确核心源码 commit**，不能据此声称字节级可重建。

| 文件 | 压缩字节 | 报告构建开始 UTC | 核心保存后缀 / 条件 | SHA-256（实际下载的包） |
| --- | ---: | --- | --- | --- |
| `mgba-wasm.data` | 1055616 | 2025-06-14 18:10:32 | srm；`gb/gbc/gba`；最低 EJS 4.2.2 | 现有 `public/assets-manifest.json` |
| `gambatte-wasm.data` | 967156 | 2025-06-14 18:09:21 | srm；最低 EJS 4.2.2 | `ad67c7bf57f8f8b62606048e6ea498afac5b5abc76ad8de5f9dfc2a6719374bb` |
| `desmume-wasm.data` | 1172604 | 2025-06-14 18:20:07 | dsv；默认 WebGL2、鼠标；最低 EJS 4.2.2 | `a9fddaa4bd742e558dfe5095fa4eaf074493b591a7bc18c5f7c65d64b9fa7572` |
| `melonds-wasm.data` | 1194723 | 2025-06-14 18:16:01 | sav；默认 WebGL2、鼠标；最低 EJS 4.2.2 | `f3ad9e42bb3ccd5c9bece23445b56e2d10d2cae8cc33a2c0591529d0a83cdfeb` |
| `desmume2015-wasm.data` | 1043573 | 2025-06-14 18:18:32 | 默认 WebGL2、鼠标；只读取报告/HEAD | 未在本次下载包体 |
| `ppsspp-thread-wasm.data` | 4581537 | 2025-06-14 19:28:55 | requireThreads、默认 WebGL2；最低 EJS 4.2.2；`save:false` | `cb46c33a3a8444b707f7a03fe00414d916ab55a41e85fbf0c59611aa643252da` |

源代码检查依据为项目已经保存的 `public/licenses/source/EmulatorJS-v4.2.3.tar.gz`，对应 EJS commit `e150dc0491ae747028919fb82d6598954976ede6`。其中 `data/src/emulator.js`：`getCores()` 含三种 NDS 和 PPSSPP；`requiresThreads()` 明确要求 PPSSPP；`requiresWebGL2()` 明确要求 PPSSPP；加载器按线程条件选择 `-thread-wasm.data`。官方 [v4.2.3 release](https://github.com/EmulatorJS/EmulatorJS/releases/tag/v4.2.3) 明确这次修复未重建核心；GitHub API 在调查时仍把它作为最新稳定发布，`v4.3.0-pre` 是另一个预发布，不能混用“main 文档”和 4.2.3 的功能。

## 适配、输入与存档方案

1. 建立每机型能力描述与独立适配配置：ROM 格式、核心、逻辑分辨率、屏幕数、触摸、线程和状态支持。GBA 与 SP 可共用 mGBA 实现，但配置不是所有机型都硬编码为 mGBA。
2. 保持现有同源 iframe 协议，扩展启动参数时白名单校验系统；GB/GBC 最大 8 MiB、GBA 最大 32 MiB，NDS 需单独校验头部、偏移和长度。不得把 ROM 扩展名作为真实性验证的唯一依据。
3. 保留 `pocketsp` 数据库 v1/v2 与 GBA 的 SHA、save key。新增游戏系统字段可作为可选字段、旧记录缺省 GBA；新增核心的保存元数据需要独立类型，不能把 dsv 保存成标注 mgba 的 srm。导入同一游戏仍按原 SHA 识别。
4. NDS 先固定竖向 256×384 输出、无屏幕间距，再把单实例画面上/下半分别送入两块实际 LCD；下屏 Pointer Events 通过协议传入画面坐标。`simulateInput` 只有手柄索引，不应虚构触摸按钮编号。触摸应经过核心已有的 RetroArch pointer/mouse 驱动；具体事件和选项需要实际端到端证明。
5. PSP / 3DS 在页面启用 SharedArrayBuffer 前先验证 COOP `same-origin` 与 COEP `require-corp` 的影响。第三方 iframe、跨域媒体、浏览器内应用可能受隔离影响；不能为一个候选核心破坏当前可用浏览器/媒体流程。没有用户文件或合法测试软件时不要宣称游戏已验证。
6. PSP 包内 `core.json` 为 `save:false`，不能复用 GBA 的单一 `getSaveFile()` → SRAM 流程；应研究 PPSSPP Memory Stick 的多文件保存与恢复，独立封装文件目录。EJS 4.2.3 的 GameManager 还会请求 `cores/ppsspp-assets.zip`，实际压缩大小 10873836 字节，SHA-256 `046f52792a06e3b6d07c8ff3961f11271102080760be4b2c38b1a3260054bad4`。其中字体、调试器和替代 flash0 资源必须按上游逐项核查许可，不直接等同于核心 GPL 文本。
7. CPU/内存没有统一保证：GB/GBA 为当前最低风险；NDS、PSP、3DS 需在同一场景记录帧速、WASM 内存、音频连续性和手机结果。包大小和浏览器截图都不能代替性能测量。iOS Safari、实体手柄与低内存设备要单独标明未实测。

## 可再分发的 GB 测试游戏候选

[Christian Reinbacher 的 GB Snake 2.0](https://github.com/reini1305/gb_snake/releases/tag/2.0) 提供公开编译 ROM 和源代码，游戏 MIT；`sound/LICENSE.TXT` 单独给出 rv6502 声音驱动的 BSD 三条款。必须同时保留两份许可，不能只保留根目录 MIT。

- 固定 source commit：`7c5145c2fb40dc123085355a523b07a747cbf497`。
- 下载地址：`https://github.com/reini1305/gb_snake/releases/download/2.0/snake.gb`。
- ROM 大小：32768 字节；SHA-256：`94f66ec5063b33bea89ed80ed05334e1655bcc71114d2c9a33a953aa368bb049`。
- 调查副本：`.research/core-survey/snake.gb`、`snake-LICENSE.txt`、`snake-sound-LICENSE.txt`、`snake-README.md`、`gb_snake-7c5145c.tar.gz`。
- 上游使用 GBDK 2020；精确构建版本未锁定。[GBDK 的许可证说明](https://github.com/gbdk-2020/gbdk-2020/blob/develop/LICENSE)明确区分编译出的游戏 ROM 与工具链分发，运行库使用 GPLv2 加链接例外；可附上调查副本 `GBDK-LICENSE.txt`、`GBDK-LIBRARY-LICENSE.txt` 保留来源。当前候选没有使用 ZX0 的迹象，不能由此推断其他游戏都不需要单独声明。
- 原作者操作：Start 开始，方向键移动，Select 改苹果数量。可用于验证真实核心输入与画面；不能用改成 JS 的 Snake 代替。

GB/GBC 的 Web 备选中，[binjgb](https://github.com/binji/binjgb) 是真实 C / WASM 项目，有浏览器目录和演示，但重新引入它会增加另一套音频与存档语义。已有 mGBA 可运行 GB 的前提下不优先替换。PSP 仍需寻找许可完整、可实际运行的最小软件；没有因“homebrew”标签就默认可以打包。

## NDS 的实际可执行性探针

已在 Chrome 内单独运行 **固定 4.2.3 的 DeSmuME + JamClown**，不是用系统 UI 或替代 JavaScript 游戏模拟结果。探针只在 `.research/core-survey/`，不修改应用代码，也没有将测试结果冒充已完成产品集成。

### 软件和许可

- [JamClown v1.0](https://github.com/lorenzolanglois/JamClown/releases/tag/v1.0)，原作者 Lorenzo Langlois。根目录 MIT；[README](https://github.com/lorenzolanglois/JamClown/blob/main/README.md)明确说明模型、纹理和声音均由作者制作。
- 游戏玩法为一分钟内在三个炮台中寻找企鹅，点击相应下屏按钮计分。上屏显示实际 3D 场景，下屏为三个触摸按钮。原作者记录了声音播放瑕疵，因此不作为声音质量的合格基准。
- NDS 文件 409600 字节，SHA-256 `21c020cb71997de4cb487d65f0a301679bfb3d4855baa49c36ee72d17d866ccd`；下载链接 `https://github.com/lorenzolanglois/JamClown/releases/download/v1.0/jamclown.nds`。
- source commit `e35774b344d89ecc1ffce761eb657ac9225e253d`；调查源码 ZIP SHA-256 `156d46b4578133688aa4804b77f2b2b274d30adb508fcd2a5c711c10128b1000`。源 Makefile 采用 BlocksDS，使用 libnds 兼容接口；纳入发布前还需附上所使用工具链/运行库来源说明。
- [BlocksDS 官方 FAQ](https://blocksds.skylyrac.net/docs/guides/faq/)说明 libnds 为 Zlib，且 SDK 使用 picolibc。游戏 MIT 不会替代这些组件自己的许可；来源说明应列出 libnds、picolibc 和 GCC 运行库例外，精确工具链版本未由原作者锁定。
- 调查时淘汰 [mdmrk/2048-nds](https://github.com/mdmrk/2048-nds)：虽然代码标注 MIT，README 明确使用 Professor Layton 游戏素材，不能把根目录代码许可扩展为商业游戏素材的再分发许可。

### 实际执行与触摸路径

`probe-nds.mjs` 把本地 EJS 资源与调查包送入单独页面：`EJS_core='desmume'`、`EJS_threads=false`，没有设置任何 BIOS URL，实际启动得到 256×384 Canvas。固定选项为：

```js
{
  desmume_screens_layout: 'top/bottom',
  desmume_screens_gap: '0',
  desmume_internal_resolution: '256x192',
  desmume_pointer_mouse: 'enabled',
  desmume_pointer_type: 'touch'
}
```

把下屏坐标转为合并 Canvas 的 CSS 坐标：`clientX = rect.left + x * rect.width`，`clientY = rect.top + (0.5 + y * 0.5) * rect.height`，其中 x/y 为下屏 0–1。向实际 Canvas 派发 `mousemove` / `mousedown` / `mouseup`，包含 `button:0`、适当 `buttons` 和 `bubbles:true`。按住必须跨越至少一帧，不能在同一次 JavaScript 执行中立即按下又松开。

探针在右侧按钮 x=.83、下屏 y=.5 按下 150ms 后，实际游戏从 `Score: 0` 变成 `Score: 1`，截图为 `.research/core-survey/nds-touched.png`。实际加载选项也从核心返回值读取确认。该结果证明无 BIOS 的双屏渲染和绝对触摸路线可行，尚不等于所有 DS 游戏兼容性或 Pocket Museum 分屏桥接完成。

源码依据：[RetroArch 的 Web 输入驱动](https://github.com/EmulatorJS/RetroArch/blob/2d3c18e48dd9645d6fe18b063ed321eef8a934ea/input/drivers/rwebinput_input.c)（2025-05-08）。它以 Canvas 事件更新绝对鼠标位置，并在没有触摸指针时将鼠标位置和左键映射到 `RETRO_DEVICE_POINTER`。该 commit 是调查的历史证据，核心包没有公布精确 RetroArch commit，不能断言两者逐字节一致。

DeSmuME 压缩包没有 `license.txt`（`core.json` 的 license 字段为空），所以正式集成必须另行保留上游 GPL-2.0 许可证和源码快照，不能只凭 CDN 有文件就忽略其许可。

## 私有探针的状态、内存与输入实测

独立探针 `probe-save-memory.mjs` 继续使用同样固定包，在当前 macOS Chrome 中测量；不是所有浏览器或机型的性能承诺。`memoryBytes` 读取 `gameManager.Module.HEAPU8.buffer.byteLength`，仅指已分配 WASM 线性内存，不含 JavaScript、GPU 和整个浏览器进程内存。一秒帧数读取核心帧计数差值，受调度影响，仅作短时可执行性检查。

| 内容 | mGBA / GB Snake | DeSmuME / JamClown |
| --- | --- | --- |
| 实际 `EJS_emulator.getCore()` | `mgba`，不是 Gambatte | `desmume` |
| Canvas 原生像素 | 160×144 | 256×384，屏幕各 256×192 |
| `supportsStates()` | true | true |
| `getState()` 实际二进制长度 | 202840 字节 | 12582936 字节（小于现有 16 MiB 协议上限） |
| 基础 WASM 线性内存 | 134217728 字节（128 MiB） | 161087488 字节（约153.6 MiB） |
| 连续保存/恢复后线性内存 | 134217728 字节 | 193331200 字节（约184.4 MiB） |
| 一秒核心帧计数差 | 约60（不同运行60–61） | 约60（不同运行59–61） |
| 原生保存路径 | `/data/saves/mGBA/snake.srm` | `/data/saves/DeSmuME/jamclown.dsv` |
| 此演示游戏实际原生保存 | null；卡带类型0，RAM大小0，没有可保存 SRAM | 返回0字节；此游戏没有把最高分写入持久化卡带存储 |

不能把空保存文件或人工填充的 SRAM 当作原生保存成功。现有 GBA 的非空 SRAM 验收仍独立有效；GB/NDS 的这两个演示只提供即时状态和真实输入的证据。

GB Snake 的代码会先等待串口连接检测，任意键解除等待后才绘制棋盘；第一下 Start 用于唤醒，第二下 Start 开始移动。探针实际记录后端调用 `[0,3,1]`、`[0,3,0]`（两次），随后 `[0,4,1]`、`[0,4,0]`。开始后方向输入确实改变了蛇的位置/朝向。保存静止棋盘状态、运行与转向、再恢复后，目标截图与恢复截图 SHA-256 完全相同：`734d12a59ee5e46900db56bf877643cfac16e7238c3463383b95ad69dbbe03ad`；转向后截图为不同哈希。

NDS 探针保存 Score 0 的状态，实际下屏触摸得分到1，然后加载同一二进制、让主循环继续运行后回到 Score 0。比较上下分界附近的计分区域（Canvas y=160–183）：触摸后有204个 RGBA字节变化，恢复后与目标区域完全一致。证据为 `nds-state-target.png`、`nds-touched.png`、`nds-state-restored.png`。

**加载状态在核心下一次运行时应用。** 暂停时调用 `loadState()` 并紧接着 `getState()` 仍可读到加载前的状态，不能用这种时序判断恢复失败或成功。探针在恢复后推进主循环，再核对实际画面。二进制重新保存的哈希也可能因为帧、计时器和前端数据变化而不同；这里用实际游戏回退作为恢复证据，没有声称快照字节可以永远相同。

另查验了 [CC0 的 gbclock](https://github.com/kresp0/gbclock)：需要 MBC3 / RTC，文件 `gbclock_v0.5.gb` 来自其 v0.4 release，262144字节，SHA-256 `560a745feb57ec02ba1c6bfcaa76c203d4abea4d7600ad548c0546c533824e2e`。核心导出了32768字节但全部为FF，因此**未把它计为实际 SRAM 写入证明**，也未纳入正式演示。它只说明“文件有长度”不足以证明游戏确实保存了有意义的数据。
