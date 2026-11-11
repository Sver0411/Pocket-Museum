# Pocket Museum

一个可以在浏览器里把玩的掌机博物馆。

从展台上挑选一台掌机，按下电源，打开熟悉的界面。Pocket Museum 将经典机身、实体按键、翻盖动作与游戏体验放进同一个网页，用奶油色展馆和各具特色的主题背景串起七款掌机。

[在线试玩](https://sver0411.github.io/Pocket-Museum/) · [下载离线掌机体验](https://github.com/Sver0411/Pocket-Museum/releases/latest/download/pocket-museum-html.zip) · [界面预览](docs/screenshots/current)

网页版可以从首页试玩《2048 Advance》、继续上次的卡带，也支持 GB、GBA 和 NDS 卡带导入。离线 HTML 包含机身、按键、翻盖和本地系统界面，游戏运行使用网页版或本地启动的完整项目。

![Pocket Museum 掌机展馆](docs/screenshots/current/museum-desktop.png)

## 展馆里的掌机

| 掌机 | 型号 | 体验特色 |
| --- | --- | --- |
| Game Boy | DMG-01 | 米白机身、绿色 LCD、十字键与对比度调节 |
| Game Boy Advance | AGB-001 | 紫色透明机身、横向握持布局与肩键 |
| Game Boy Advance SP | AGS-001 | 银色折叠机身、屏幕前光与三种翻盖姿态 |
| DS Lite | USG-001 | 白色双屏、下屏触摸、时钟日历与 PictoChat |
| 3DS | CTR-001 | 青绿机身、Circle Pad、HOME 菜单与本地应用 |
| PlayStation Portable | PSP-1000 | 黑色宽屏机身、XMB 导航、媒体播放与 PPSSPP 连接 |
| PlayStation Vita | PCH-1000 | 双摇杆、气泡主页、LiveArea 与 Welcome Park |

## 统一的设计，各自的性格

首页以展台和铭牌陈列掌机，进入游玩页后，机身成为画面中心。每台掌机拥有独立的外层布局，浅色弹窗、柔和光影和带缩略图的机型切换菜单延续整座展馆的设计。

Game Boy 使用橄榄绿像素边框，GBA 搭配透明紫色与 Y2K 玻璃控件，SP 以浅银留白突出翻盖。DS 采用冰蓝双屏布局，3DS 呼应青绿 HOME 磁贴，PSP 延伸 XMB 的导航轴，Vita 则配以蓝紫气泡和 LiveArea 式控件。桌面、平板和手机都拥有对应的页面布局。

## 操作掌机

方向键、面键、肩键、Start、Select 和摇杆都可以操作。键盘、鼠标、触摸与标准手柄共享同一套输入，支持持续按住和组合按键。

翻盖掌机提供半展开、完全展开与合盖三种姿态，上盖也可以拖动。十字键以整体倾斜回应按压，摇杆具有移动、倾斜与回中反馈。音量、亮度、对比度和声音设置按机型保存。

## 游戏与进度

EmulatorJS 配合 mGBA、DeSmuME，提供 GB、GBA 和 NDS 游戏体验。项目内置 Tobu Tobu Girl Deluxe、GB Snake、2048 Advance 与 JamClown，也支持从本地文件选择卡带。卡带库提供插卡与直接游玩两种操作，ROM 在启动时读取。

Game Boy 与 GBA SP 提供专注模式，将屏幕按原生比例放大，并提供触控方向键、动作键和快捷暂停。可随时返回完整机身视图，游戏持续运行。

本地宝可梦卡带会根据文件头显示对应版本名称。选择卡带并开启电源，就能使用机身按键游玩。原生存档、即时存档以及存档导入导出连接起每次游戏；游戏、媒体和设置通过浏览器本地存储保存。

网页版展馆的「存档备份」可以导出游戏存档、系统设置和笔记。恢复时保留更新时间较新的游戏存档。自行导入的卡带和照片、录音等媒体需要单独保留。3DS 笔记写入失败时，可以重试或下载当前草稿。

PSP 页面提供 PPSSPP 连接入口，网页上的按键和摇杆可以控制本地模拟器。选择共享窗口后，模拟器画面会显示在掌机屏幕中。

## 掌机里的日常

除了游戏，还可以浏览照片、播放音乐和视频，使用相机与录音，写下笔记或编辑 Mii。DS 的 PictoChat 支持同源页面之间交换文字和绘图；3DS 提供 HOME 图标排布与笔记；Vita 可以在气泡主页、LiveArea 和应用之间切换。

图标、壁纸、上屏图案和字体也可以通过[本地系统素材包](docs/SYSTEM_RESOURCES.md)定制。

## 本地运行

开发环境使用 Node.js 22 与 npm。

```sh
npm install
npm run dev
```

打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/) 进入展馆。

构建生产版本：

```sh
npm run build
npm run preview
```

## 单文件版

Pocket Museum 同时提供七机整合页面与每款掌机的独立 HTML。下载后直接打开，即可体验机身、系统界面、按键、声音与翻盖交互。完整项目提供游戏运行与进度管理。

[七机整合版](public/standalone/pocket-museum-all.html) · [Game Boy](public/standalone/gb.html) · [GBA](public/standalone/gba.html) · [GBA SP](public/standalone/sp.html) · [DS](public/standalone/ds.html) · [3DS](public/standalone/3ds.html) · [PSP](public/standalone/psp.html) · [PS Vita](public/standalone/vita.html)

[正式下载与 SHA-256 校验文件](https://github.com/Sver0411/Pocket-Museum/releases/latest)随版本一起发布。

## 技术组成

项目使用 React、TypeScript 与 Vite 构建，结合 CSS、SVG 和 3D Transform 呈现机身与翻盖。EmulatorAdapter 与 EmulatorBridge 连接同源 iframe 中的游戏核心，IndexedDB 保存游戏和用户内容，Web Audio 管理提示音与媒体声音，Vitest 和 Playwright 负责自动化测试。

## 开源协议

项目代码采用 [GPL-3.0-or-later](LICENSE)。第三方组件、字体、音效及演示游戏的来源和协议收录于 [NOTICE](public/licenses/NOTICE.md)。


[Stage 9 使用体验与截图对比](docs/STAGE9_ACCEPTANCE.md)记录了桌面、手机、专注游玩与真实核心的验收结果。
