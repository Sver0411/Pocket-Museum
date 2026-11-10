# CTR-001 / 3.0.0-6E 系统画面校准规格

研究时间：2026-11-10。这里只记录原机证据、候选代码核验与原生像素测量；没有修改生产代码，也没有将官方截图、固件字体或商业系统资源加入 `public/`。**这些测量不是已经达到 1:1 的完成声明。**

## 1. 目标版本与证据等级

目标是原版 Nintendo 3DS CTR-001、英文欧洲固件 3.0.0-6E。上屏每眼为 400×240，下屏 320×240；两个独立原生画布，不能套同一套宽度，也不能把 CSS 上屏控件当作第二触屏。

最高质量参考不是网络上放大的照片，而是任天堂原版手册中的原生分辨率屏幕图：

- [原版 Nintendo 3DS AU Operations Manual](https://assets.nintendo.eu/image/upload/v1626222882/NAL/Support/3DSOperationsManual_AU.pdf)。本地研究文件 `.research/3ds-manual.pdf`；封面/页脚标识 `CTR_Manual_AUS_C3_20111205`，版面输出 2012-03-15。PDF 第 19–21 页对应印刷 36–41，包含原生 400×240 / 320×240 JPEG；第 34 页对应印刷 66–67，包含 System Settings 根页。版本时期与 3.0 相符，但图片本身没有系统版本水印，因此不把它断言为某台 3.0.0-6E 机器直接导出的帧。
- [Nintendo 欧洲更新历史](https://www.nintendo.com/en-gb/Support/Legacy-system/Latest-system-update-information-241709.html)：3.0.0-6E 是稳定性更新；3.0.0-5E 已有 3D 视频、Mii Plaza 新内容、Sleep Mode 下载及双 3DS 系统传输。**4.0 才加入文件夹，7.0 才加入 Miiverse/NNID，9.0 才加入主题。** 因此不能用 9.x 以后白色主题截图直接代替此版本，也不能把 New 3DS 的 C-stick / ZL/ZR / NFC / amiibo 项放入。
- [2011 官方 Quick Start Guide](https://www.nintendo.com/eu/media/downloads/support_1/nintendo_3ds_14/Nintendo3DS_QuickStartGuide_EN.pdf)：补充首开 3D/语言/日期/用户流程，不作为默认 HOME 逐帧计时依据。
- [Fontworks / Monotype 的 3DS 官方采用案例](https://fontworks.co.jp/case/4320/)：确认系统字体是以 Rodin NTLG 为基础定制。**不是 Arial、Noto Sans、DS 像素字体或未经授权下载的“3DS.ttf”。** 这里的官方网页不授权再分发字体；[LETS Rodin NTLG 页面](https://lets.fontworks.co.jp/fonts/237) 是字体产品信息，不等于游戏嵌入许可。

截图图像仅位于忽略目录 `.research/3ds-spec/`，供布局研究。生产资源应使用可再分发代码/素材、自行重绘的几何，或者用户自行提供的合法字体/资源，不把版权截图当静态背景冒充可交互系统。

## 2. 超出旧 jQuery 插件的成品调查

搜索覆盖 GitHub 仓库的 `3ds home menu`、`3ds menu web/html`、`3ds ui`、`3ds portfolio`、原生 HOME 替代项目、布局预览与官方主题工具。核验了源码而不是按 Star 数判断。

| 候选与固定源码 | 许可 / 实际内容 | Demo / 构建证据 | 采用判断 |
| --- | --- | --- | --- |
| [giginet/jquery-3dsmenu](https://github.com/giginet/jquery-3dsmenu)（既有调查） | 旧 jQuery/jQuery UI 列表拖动和行数变化算法，不包含原机 HOME 背景、系统 applet、图标、状态栏、设置、应用 | 仓库 `demo/index.html`；README 仍写 Demo Coming Soon，并列 Safari 排序问题；依赖 jQuery 1.3.2+ / jQuery UI 1.8.16+ | 不是完整成品，不引入旧依赖替换可用 React 状态机；只能作为列优先布局与交换交互参考 |
| [Universal-Team/HomeMen3D](https://github.com/Universal-Team/HomeMen3D) commit `7347baeda92242cf112eaa5c83f4fac2b7756acd` | GPL-3.0-or-later，源码有额外保留署名/标示修改要求；C++ / libctru / citro2d 原生 3DS Homebrew | 已归档；最近源码提交 2019-12-15。`source/screens/mainMenu.cpp` 是灰色矩形、4 个 48px 图标与 2 个底部按钮，自称 WIP；没有浏览器 Demo | **不接入**。它比目标简化，且不是浏览器组件，更不是 3.0 HOME 的完整开源重建 |
| [ron-popov/3ds-Pomelo](https://github.com/ron-popov/3ds-Pomelo) / [作者说明](https://ronpopov.me/introducing-pomelo/) | Apache-2.0；C 原生替代 HOME，Luma Game Patching；作者说明为早期研发、游戏启动仍有崩溃，设计正在向 NDS 风格变化 | 作者提供 New 3DS US / Mikage 截图；无浏览器构建或完整原生 3.0 系统 | **不接入**。它是有价值的 HOME 服务研究，不能把替代桌面说成 1:1 原版 UI |
| [SalustLab/3DSort](https://github.com/SalustLab/3DSort) commit `a4aef85b14f9380594c5766eca004599a95c4646` | GPL-3.0；Python + WebView/浏览器的实际卡带布局编辑器。JS 可以绘制图标布局，但图标来自用户自己的 console cache | `python app.py --serve --mock --mock-badges` 有本地合成数据 Demo；检视 `ui/app.js`、`ui/layout.js`、`docs/SPATIAL_LAYOUT.md`。支持当代 1–6 行、文件夹与 badge；README 列真机验证与测试 | **部分参考**其列优先槽位/空位/交换算法；不用其工作台 UI，不拿用户 console cache 资源打包。它针对较新 HOME 保存格式；不保证 3.0 支持 |
| [AnticCosine/antic-3ds-portfolio](https://github.com/AnticCosine/antic-3ds-portfolio) commit `b59a037a4333246498c5febaf3166cf97d9f1abd` / [在线作品](https://anticcosine.com/) | 仓库没有 LICENSE；React Three Fiber / GLB 个人作品集、About/Projects 自定义图标；素材指向 **New 3DS XL** Sketchfab | `package.json` 有 npm build；检视 `src/components/3DS.tsx`，交互为 GLB 动画和个人作品弹窗，不是原版系统 UI；未执行依赖安装构建 | **不复用代码或模型**：许可不明、机型不符、页面功能也不符 |
| [AromaKitsune Home Menu UI](https://aromakitsune.github.io/3DS-Custom-Home-Menu-UI) | 真机 LayeredFS 定制，目标 11.17；改时钟位置、颜色、Miiverse，使用自己的固件进行 patch | 页面明确列出被修改项与固件版本；不是独立浏览器组件 | 仅研究布局文件和版本差异。不能下载 patch 后假称原版 3.0 HOME；不导入原固件内容 |

本次没有找到同时满足「浏览器可直接嵌入、许可明确、完整原版 3.0.0-6E HOME + 设置 + applet」的成熟成品。这个结论限定于已审查候选，**不是声称互联网上绝对不存在**。现有 React 状态机应该保留；渲染按下面的原生证据重做。不能靠把通用 lucide 图标做大来继续宣称原机。

## 3. 原生参考文件定位（仅研究）

从 PDF 的 XObject 中无损提取嵌入的 JPEG，不经过拍照矫正，不放大后再猜坐标：

| 研究文件 | 尺寸 | 所见状态 |
| --- | --- | --- |
| `p19-29-Im8.jpg` | 400×240 | 无卡 HOME 顶屏；状态栏和中部 5 个系统 applet 图案 |
| `p19-20-Im295.jpg` | 320×240 | 一行布局，无卡槽被选中；卡槽左边 Health & Safety，右边 Camera |
| `p19-1-Im276.jpg` | 320×240 | 一行布局，Camera 被选中；标题含应用名、发行者；底部 Manual/Open |
| `p19-6-Im281.jpg` | 320×240 | 二行布局，无卡槽被选中 |
| `p19-3-Im278.jpg` / `p19-9-Im284.jpg` | 320×240 | 三行布局，AR 或无卡槽被选中；有普通空槽 |
| `p20-19-Im322.jpg` / `p20-20-Im323.jpg` | 320×240 / 400×240 | 悬挂软件，顶屏出现 Suspend 弹层，下屏底部 Close / Resume |
| `p21-6-Im329.jpg` | 320×240 | Screen Brightness / Power-Saving Mode 浮层 |
| `p34-20-Im727.jpg` | 320×240 | System Settings 根页，黄色背景，2×2 大按钮，底部 Close |
| `p41-31-Im923.jpg` | 320×240 | Data Management，3DS/DSiWare 两入口、StreetPass Management、Reset blocked-user settings |

PDF 内的图像是早期系统的任天堂参考截图；文字边缘带压缩和彩色采样误差。以下边界坐标由原生图直接观测，通常 ±1–2 px；色值是 JPEG 区域中位数，不能当作固件纹理的原始精确 RGB。动画关键帧/时间和各应用 3D banner 还没有足够原机帧证据。

## 4. HOME 顶屏（400×240）

原点左上，单位原生 px。顶栏不是占满 21px 的灰色横条。

| 元素 | 边界或中心 | 形态 |
| --- | --- | --- |
| 网络信号 | x≈1–23, y≈2–18 | 4 档竖条，随网络模式着色 |
| 模式胶囊 | x≈27–134, y≈2–18，宽108高16 | Internet 蓝色、StreetPass 绿色、Local 橙色；Disabled 灰色。不是通用 Wi-Fi 图标 + 文本 |
| Play Coins / 今日步数 | x≈143–206, y≈2–18 | 脚印/硬币原机图形与数值交替；没有真实计步器就不能制造步数 |
| 日期和时间 | x≈220–363, y≈2–17 | `10/10 (Sun) 10:00`，中性深灰字，亮边；英文布局含星期 |
| 电池 | x≈373–398, y≈2–17 | 矩形分段电量，蓝色充足、红色低电、闪烁/充电有单独帧；不是 lucide BatteryFull |
| 软方块背景 | y≈25–239，约64 px节距 | 淡蓝紫底，大方块散列；参考底色中位数 `#e0e8f5`，块内部 `#f5f8fb`。不是圆形泡泡图案 |
| 无卡 HOME 中心图案 | 图案中心 x≈94/140/200/249/309，y≈131；HOME中间约48×48 | Browser（蓝球）、Notifications（绿对话）、HOME（灰房）、Friends（橙笑脸）、Game Notes（黄绿纸笔）；有轻微3D旋转/透视，不是任意应用的通用大方块 |
| L / R 相机提示 | x≈0–35 / 364–399, y≈220–238 | 肩键胶囊 + 相机小图形，置于屏幕两端；不是 “L ◀ ▶ R” 文字 |

选中已安装软件时顶屏必须用该软件的 banner/标识场景。没有合法对应 banner 时，不能以一个通用图标的旋转称为 1:1；可以明确记录当前缺失。上屏不接触摸事件。

## 5. HOME 下屏（320×240）

### 固定 chrome

- 工具栏 y=0–33；主体圆角包围框 x≈7,y≈34,w≈313,h≈176；底部操作区 y≈212–239，高≈28。
- 从左到右 7 个操作：亮度 sun 中心(15,15)，缩小/放大布局中两个小图块中心(47,15)/(71,15)，Game Notes(117,15)，Friend List(175,15)，Notifications(233,15)，Internet Browser(291,15)。第一组亮度+布局位于 x0–91，后四个 applet 各约57px宽，中间有分隔竖线。不是 7 个均分 45.7px 的按钮。
- 工具栏底是金属白灰细横纹；按钮图形是立体彩色小图标。Notes 为斜纸笔，Friends 为橙色方框笑脸，Notifications 为绿色对话框，Browser 为青色经纬球。对应图案可自行矢量重绘，但现有简笔 lucide 不能标记为图标 1:1。
- 一行模式显示标题圆角框 x≈30,y≈47,w≈260,h≈65；两行以上隐藏该标题框，让图标占满主面板。标题最多两行：应用标题和发行者。无卡说明是两行无发行者。
- 左右滚动耳朵按钮中心 y≈121，左右贴边；白色弧面，青灰箭头。可见性按是否有可滚内容决定；不是高83px的竖向矩形工具条。
- 底部：有软件手册时左 Manual 区宽≈105，Open 占余下215；无手册的系统项 Open 占满320。无卡槽没有可启动应用，参考 `Im295` 底部不出现 Manual/Open。悬挂软件为左约105px Close、右约215px Resume（带实机 X/HOME 键图形）。

### 图标、选择框和布局

| 布局 | 原生图标面框 | 槽位步长 / 行中心 | 标题框 |
| --- | --- | --- | --- |
| 1行 | 约72×72；内部系统图案约48×48 | 横向≈82 px；示例中心x≈78,160,242；中心y≈158 | 显示，见上 |
| 2行 | 约72×72 | 横向≈82；行中心y≈80,162 | 隐藏 |
| 3行 | 约50×50；内部图案约32×32 | 横向≈56；示例中心x≈47,103,159,215；行中心y≈65,120,175 | 隐藏 |

图标按列优先：同列先上下，再向右。主网格必须保留空位，不能用“应用数组排序后紧密排列”冒充所有真实布局。单行选中槽在可见内容中间，滚动靠近边界后再移动视窗；不要把 index*69 硬算成所有场景的滚动宽度。

普通外框为多层圆角塑料/白灰金属边，中间按钮面有略内凹的阴影；不是简单白矩形+应用纯色背景。空槽为凹下的淡灰框，卡槽是更大的立体空卡轮廓。Health 是黄色警告三角，Camera 橙底白相机，Sound 蓝底白音符，Mii 是绿色描边 Mii 字形，AR 为黑底金色问号块，Download Play 为橙底无线双机，Settings 为米色底墨绿扳手。

选框在面框之外，荧光绿多层圆角环约宽7–9 px，外有浅绿色散光；单行选中边界约 x120–200,y118–199，含上方小圆点/连接凸起（不是仅一个向下三角箭头）。JPEG 选框区域中位数约 `#5afe64`。静态 outline 4px 不能代替原机的跳动/呼吸和图标提起过程；其时序要由实机视频或逐帧样本补充。

### 亮度浮层

`p21-6-Im329.jpg`：背景全屏变暗；窗口 x≈20,y≈20,w≈280,h≈200，圆角≈12。顶标题区约y25–53，五级按钮约x60–260,y59–93，各40×35，左右有亮度图形。Power-Saving Mode 标题y≈105–124，下方 Off/On 双按钮 x≈59/160,y129–168，总宽200。底部 y≈181–217 为完整 A OK 按钮条。当前只显示5数字和Close的浮层缺少原机电源节能项与按钮结构。

## 6. System Settings 与 Data Management

**不能继续使用所有掌机共用的通用长列表作为 3DS 根设置页。**

System Settings 根页（`p34-20-Im727.jpg`）为 320×240 的黄绿色背景：

| 控件 | 近似边界 | 图形/布局 |
| --- | --- | --- |
| Internet Settings | x≈16,y≈5,w≈140,h≈105 | 青色地球+扳手，双行文字 |
| Parental Controls | x≈164,y≈5,w≈140,h≈105 | 粉色家长与儿童，双行文字 |
| Data Management | x≈16,y≈116,w≈140,h≈88 | 绿多页图形，双行文字 |
| Other Settings | x≈164,y≈116,w≈140,h≈88 | 橙色人物+扳手，双行文字 |
| Close | x≈0,y≈211,w≈320,h≈29 | 深蓝灰弧面，X Close，整条可触摸 |

主按钮为米白圆角凸面，细橄榄边和底部阴影。JPEG 背景中位数 `#ebf58f`、按钮内部 `#e5ecda`、底栏 `#5c717a`；应重建分层渐变，不把采样中位数当统一填色。

Other Settings 是分页入口，印刷页81明确提示触摸左右箭头翻页；Profile 是用户名称/生日/区域/Nintendo DS Profile 子页，不是一个 nickname 文本框。应按手册的 Profile、Date & Time、Touch Screen、3D Calibration、Sound、Mic Test、Outer Cameras、Circle Pad、System Transfer、Language、System Update、Format System Memory 分组分页。当前把 brightness 加在 Other Settings 长列表也不符合该根页结构（亮度在 HOME 浮层）。

Data Management 根页（`p41-31-Im923.jpg`）：上方 x≈17,y≈19,w≈149,h≈77 与 x≈176,y≈19,w≈126,h≈77 两个 3DS / DSiWare 面板；中间宽按钮 x≈28,y≈111,w≈265,h≈37 为 StreetPass Management；第二宽按钮 x≈28,y≈171,w≈265,h≈27 为 Reset blocked-user settings；左下弧形 B Back，约x0–120,y211–239。当前以 Software/Extra/DSiWare 一列空值作为根页不匹配。

顶屏 System Settings 的准确完整场景、各子页排版及语言字形仍需更多原生截图。手册给出下屏结构，但不能从页内装饰插图捏造顶屏的逐像素动画。

## 7. 本项目当前差异与实际实施优先级

1. **先改结构**：顶屏无卡 HOME 中心图案、状态胶囊/星期、下屏工具栏分组、单行标题与多行隐藏标题、底部按应用决定 Manual/Open。原有 `ThreeScreen` 中的 `.three-hero-icon` 巨大通用卡片、圆形背景、统一底栏是最明显差异。
2. **再改组件**：按原生数值重建按钮/空槽/绿色环，绘制对应图标，保留用户可交换图标和已有本地应用逻辑。不要更改数据库名称或把应用状态跟着视角重置。
3. **设置独立布局**：3DS根页 2×2、Other Settings 分页、各子页独立动作；停用通用 `SettingsPanel` 对这几页的直接视觉复用，保留其确认/存储逻辑。
4. **字体是硬差异**：Rodin NTLG 定制版未获得可分发许可，不能宣称换一个 OFL 字体即 1:1。可提供用户自备合法字体的入口，或继续明确“授权替代字体”。
5. **逐状态截图验收**：400×240 / 320×240 原生截图单独截，检查锚点、圆角、图标大小和文字基线；至少无卡、选Camera、1/2/3行、悬挂软件、亮度浮层、根设置、DataManagement。任何版权图对照仅留本地研究目录。
6. 通过上述静态锚点仍不等于完成所有系统。软件 3D banner、原字体、动画时序、Mii/AR/FaceRaiders内部画面和原服务功能应单独登记，不用“风格相近”替代。
