# PSP-1000 XMB 6.61：可核对视觉规格与成品再调查

2026-11-10。目标是原机画面而非“XMB 风格”。本记录没有改生产代码，没有把研究用截图、字体或固件放进 public。所有坐标均以 **480×272、左上角(0,0)、向右/下为正**；VitaXMB 源文件为960×544，以下已除2。如果引用该项目代码而非单纯查数值，须保留 GPLv3。

## 1. 可执行决策

1. **XMDB 不能作为 1:1 成品。** 它是 IMDb 片库，图标与波纹自绘近似。此前 Stage0 的“部分复用”适用于授权替代视觉，不足以满足用户现在明确的 1:1。
2. **VitaXMB 的数值/运动规律比 XMDB 更接近可验证依据**，但图标/字体/声音/波纹资产不是 GPL。可用的是 `src/theme/paf.h` 中有地址依据的6.61 UI引擎数值、布局源文件和动效实现；不能因为根 LICENSE=GPL 就打包 `assets`。
3. **精确原版系统的优先路线：PPSSPP 开发版实际运行用户本地固件。** [PPSSPP 官方指南](https://www.ppsspp.org/docs/getting-started/how-to-run-the-xmb/)明确支持XMB，并写明该功能将进入尚未发布的1.21，现有开发版已能运行。可以研究本地伴随进程桥接；不能将原生PPSSPP画面串流说成浏览器WASM，更不能打包商业固件。
4. 无用户本地固件/原版字体时，应把代码实现称为“按下列标定重建”，不能宣称逐像素原版。**不要用 generic Lucide 图标 + 人文无衬线字体 + 任意波浪宣称1:1。**

## 2. 深入成品筛选

| 候选 | 代码、许可、真实能力 | 1:1判断 / 采用意见 |
| --- | --- | --- |
| [VitaXMB](https://github.com/dekiller82/VitaXMB) | 固定提交 `b2512e46a8562ed4f2203b63647e89bd2b96b9ef`（2026-11-08）。GPLv3 C/VitaSDK/vita2d原生Vita应用；[README](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/README.md)记载按PSP6.61 paf.prx读取列表数值与动画。功能含Vita专属项，不是完整原版PSP系统 | **复用/翻译布局与数学时保留GPL；不复制第三方资产。** README“Third-party assets”明确图标/SFX/仿FOT字体是作者提供的个人非商业使用，波纹/月背景/boot/movie/播放器资源源自Sony固件、不是GPL。所谓“redrawn”并未抹去原资产限制 |
| [VitaXMB 2x icon tool](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/tools/make_hires_icons.py) | 明确使用 `tools/icons64` 原图，重切alpha轮廓、上采样原色/原渐变，目标回缩后平均差<2/255 | **不是独立原创SVG库**。不能把这些图当GPL自由图标；可研究材质特征，另行实现合法轮廓或让用户提供主题 |
| [PTF-Studio](https://github.com/S1implyBlue/PTF-Studio) / [Demo](https://s1implyblue.github.io/PTF-Studio/) | 提交 `3b2c6407201bf02a22412725c9009a52bbdf1517`（2026-07-17），GPLv3，依赖零的浏览器主题编辑器。`app.js` XMB_LAYOUT注释来自直接480×272截图标定；支持用户导入PTF和字体。README明确未捆绑PSP字体/示例图标，预览不是模拟器 | **可采用GPL解析/布局/用户主题导入代码**，不是完整系统。状态与媒体目前使用示例值，不能当实际MemoryStick余量。本次不复制电池PNG等未独立核验素材 |
| [phenom64/OpenXMB](https://github.com/phenom64/OpenXMB) | GPLv3，C++23/Vulkan/SDL2/FFmpeg，作者称 reimagining；[README](https://github.com/phenom64/OpenXMB/blob/main/README.md)明确是PS3式现代重做、不是direct port | 不嵌入网页，不是PSP480系统；不能解决1:1 |
| [nalsnaarak/OpenXMB](https://github.com/nalsnaarak/OpenXMB) | GitHub API显示无许可证、无语言，最后push2020-02-16 | 不引入 |
| [TheGammaSqueeze/xmb-web](https://github.com/TheGammaSqueeze/xmb-web) / [Demo](https://thegammasqueeze.github.io/xmb-web/) | PS3式Web界面，不是PSP；GitHub没有明确许可。即使运行也不证明Sony字体/原资源再分发权 | 不引入作为PSP成品；不复制版权字体/解密资源 |
| [fchavonet/creative_coding-xmb_wave_background](https://github.com/fchavonet/creative_coding-xmb_wave_background) | 仅背景波纹；无明确许可 | 不引入；背景不等于系统 |
| [koyama-kagami/virtual-PSP](https://github.com/koyama-kagami/virtual-PSP) | 无明确LICENSE。ThreeJS外壳 + Python WebRTC + 本地PPSSPP原生进程回传原版6.61，Windows/uv/PowerShell；不捆绑固件/核心/游戏。README承认gameflow/UMD/WLAN/mic未完成 | **架构证据可用，代码不复制。** 与其再手绘假1:1，可自行适配官方PPSSPP接口做可选本地核心桥接；该路线需要本地服务，不能伪装成纯静态网页 |
| [moeezalam/xmdb](https://github.com/moeezalam/xmdb) | MIT；之前已实际构建运行。480逻辑画布，但IMDb数据、原创近似图标/波纹 | 严格1:1目标下不采用其视觉作为完成证明 |

## 3. 官方视觉参考（研究目录，不进入发布资源）

Sony [当前手册首页](https://manuals.playstation.net/document/en/psp/current/index.html)原文基线为 **6.60**，不是6.61。手册用于6.60/6.61共有菜单与型号条件；6.61时序数值来自下节独立有地址的源码记录。以下官方截图实际只有 **240×136**，是半原生尺寸，不可以标为“原生480抓屏”。

| 页面 | 官方截图URL | 实际核查 |
| --- | --- | --- |
| [Photo](https://manuals.playstation.net/document/en/psp/current/photo/photo.html) | [photo001.jpg](https://manuals.playstation.net/document/en/psp/current/img/photo001.jpg) | 240×136；蓝色背景、选中Photo、Camera列表、下一MemoryStick缩略 |
| [Music](https://manuals.playstation.net/document/en/psp/current/music/music.html) | [music001.jpg](https://manuals.playstation.net/document/en/psp/current/img/music001.jpg) | 240×136；选中Music、UMD行；可量主横条/选中行位置 |
| [Game](https://manuals.playstation.net/document/en/psp/current/game/game.html) | [game001.jpg](https://manuals.playstation.net/document/en/psp/current/img/game001.jpg) | 240×136；选中Game、UMD，其他类别已在可见裁切内移动 |
| [System Settings](https://manuals.playstation.net/document/en/psp/current/settings/index_system.html) / [Nickname](https://manuals.playstation.net/document/en/psp/current/settings/nickname.html) | 页面无系统截图：Nickname只使用space.gif留白 | 不假称测得编辑框原生边界。需真实6.61运行截图补齐 |
| [Theme](https://manuals.playstation.net/document/en/psp/current/settings/theme.html) | [theme_002.jpg](https://manuals.playstation.net/document/en/psp/current/img/theme_002.jpg)、[theme_003.jpg](https://manuals.playstation.net/document/en/psp/current/img/theme_003.jpg) | 240×136；为TastyTreat与ClassyPink自定义主题，**不能当默认原机背景/图标** |
| [PPSSPP XMB官方演示](https://www.ppsspp.org/docs/getting-started/how-to-run-the-xmb/) | [vshdemo.mp4](https://www.ppsspp.org/video/vshdemo.mp4) | 实际文件1568×944@120fps、22.61s，含原生窗口菜单/DevMenu/FPS叠层；不是裸480帧。12秒可见Video→MemoryStick、原版图标/字体/分割线。只做视觉研究，不当项目截图或运行能力证据 |

研究私有路径：`.research/psp-official/{photo001,music001,game001,theme_002,theme_003}.jpg` 与 `vshdemo.mp4` / `vshdemo-3s.png` / `vshdemo-12s.png`。未把它们复制到`docs/screenshots`或`public`。

## 4. 可实施的主菜单坐标

主要依据：[VitaXMB layout.h](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/src/ui/layout.h)、[main.c](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/src/main.c)、[music.h draw_column](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/src/media/music.h)。PTF交叉核对：[app.js XMB_LAYOUT](https://github.com/S1implyBlue/PTF-Studio/blob/3b2c6407201bf02a22412725c9009a52bbdf1517/app.js#L190)。两者不同并不自动等于真实误差为零，必须最终与原生截图叠合。

| 元素 | 主规格(原生px) | 核对/解释 |
| --- | --- | --- |
| 活动类别中心 | (109,70) | PTF截图测值(110,72)，差1×2px；优先与真正原版样本对齐，不能混用两套锚点 |
| 类别横向位移 | `80*d + clamp(d,-1,1)*5` | 最近左右邻距85；第二邻居距165。PTF用均匀82为近似，不能两者都称精确 |
| 类别正常/选中绘制大小 | 49→60(最大边) | 此为透明图像画布/最长边，不能把可见轮廓强制49/60方块；PTF原生主题类别canvas64×48 |
| 非活动类别透明度 | 165/255≈0.647；选中1 | PTF0.62近似，须保留原玻璃图标本身alpha再乘层alpha |
| 类别标题 | 中心x同类别、垂直中心y99，11px | main.c用CAT_Y+58(2x)；PTFbaseline103，须区分中心与alphabetic基线 |
| 一级列表活动图标中心 | Settings (103.5,135)；其他类别(109,135) | Settings扳手徽章会向左挂，其他类别小画面放中心109 |
| 一级标题x | Settings150；其他141.5 | 选中MemoryStick示例中标题右侧有长细分割线，不是卡片/矩形tile |
| 一级列表向下邻距 | 65 | k=+1时y200，+2为265；不把所有行压成30px |
| 一级向上首邻距 | 125 | k=-1为y10，跳过类别栏；这正是当前平铺按钮列容易错位的地方 |
| 一级图标大小 | 普通56→选中60(最大边) | 选中发光与大小分离，不能只放大Lucide线图标 |
| 一级标题字号 | 14 | 无副标题时垂直中心y135；2行时标题center125、副标题center146 |
| 副标题字号 | 11；透明度依上下文0.7–0.8 | 不是外部网页说明字样 |
| 一级分割线 | x149.5→475，y135，1px主线+1px淡影 | 左端#D0CBC0到右#FDF7EE；最终采样应扣除背景与alpha |
| 时钟文本锚点 | 原机代码模式right≈443，centerY13 | PTFright444、baseline18；适合先用固定原生文本测量，不可依字体猜全局偏移 |
| 电池中心/框 | center(463,12)；PTF框(452,6,24,12) | 状态图标轮廓要独立核对，不能用通用圆角电池替代 |

## 5. 进入System Settings后二级列表

依据：[sublist.h](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/src/ui/sublist.h)、[paf.h](https://github.com/dekiller82/VitaXMB/blob/b2512e46a8562ed4f2203b63647e89bd2b96b9ef/src/theme/paf.h)。

- 类别栏向左移动59px（`118*sub_t/2`），其他类别逐渐透明；父列表收成图标柱。不是弹出居中的白色设置卡片。
- 子项活动图标中心(131,135)，标题可见墨迹左缘151.5；值在x380、centerY138.5，最大90px宽。
- 子项图标画布最大边32px；wrench徽章和原图alpha另算。
- Settings列表style4：pitch45，选中上下额外gap10，因此第一个邻行距55、再下一个距100。原生中心序列：y35、80、135、190、235。
- 单行标题14px、centerY136.5；值12px、centerY138.5；选中分割线y146，从x151到474。双行项标题centerY125、副标题146，分割线135。
- 未选中fade由距离决定；VitaXMB实现上方`1+d*.28`、下方`1-d*.12`再乘未选择强调0.42；这是该重建实现值，需真实画面对照，不可标为从固件直接读取。
- 设置值编辑/OSK **尚无本次可验证的原生矩形尺寸**。VitaXMB使用Vita原生IME，其`ime.h`不是PSP OSK。不得直接采用其IME作为PSP编辑框。

## 6. 真正有来源的列表动画

VitaXMB `paf.h`注释标明读取6.61 `paf.prx`：style setter `0x10a57c`，easing `0xeb0f0`，mode4表/公式 `0xeaf38 / 0xeb094`，列表上下duration `0x10a23c / 0x10a27c`。本项目未下载/逆向固件，来源是该GPL作者公开的数值记录。

| 场景 | pitch | gapAbove / gapBelow | 备注 |
| --- | --- | --- | --- |
| 栏目一级style1 |65|60/0|活动行原点，上一行跳过类别条 |
| Settings style4 |45|10/10|首邻行距55 |
| Music style6 |43|17/17|首邻行距60 |
| Video style8 |54|13.1/13.1|首邻行距67.1 |
| Game list style11 |45|30.5/30.5|首邻行距75.5，选中横向封面 |

上下/左右主移动均200ms。mode4每1/60秒覆盖剩余距离固定比例：200ms=12帧，`k=0.31948879`，中途进度`1-(1-k)^(elapsedSeconds*60)`，到duration端点钳制1。15帧及以上公式为`1/(N*.216796875+3.765625)`，不是CSS默认ease。选择强调(glow)应随选择事件开始，位置仍可滑动；它们是两条状态。普通cubic-bezier可近似但不能报告相同引擎。

## 7. 颜色与字形

- 原机Latin字体是`flash0:/font/ltn0.pgf`。VitaXMB回退仿FOT-NewRodin Pro DB的OTF并不具备可自由分发的OFL声明。`docs/fonts/rodin-db.woff2`只是从同一字体转的子集，不会因为改woff2变为授权字体。
- 原机体感：选中标题约14px、中等无衬线、细软黑阴影，非白色描边发光文字；字符宽度/kerning对列表有直接影响。授权替代字体只能标为替代，不能作为1:1字形验收。
- `text.h`原实现为FreeType light/autohint + HarfBuzz、4个subpixel phase；CSS不同平台抗锯齿仍有差异。必须在480逻辑像素上测字串宽度，按完整屏幕等比缩放。
- 官方photo/music蓝色主题JPEG像素取样（有压缩误差，只作为参考）：左上#00064E，中上#0A217F，右上#0047B2；左下#3E9DD5，中下#28ABD7，右下#08B0DF。原背景是二维色场和波面，**不是一条竖向CSS蓝色渐变**。Game图下半还有更亮青色波面，因此同样位置颜色不同。
- 默认背景随月份/时间/用户颜色变化；VitaXMB承认原表只有October经过真实截图测量，其他月份旧表近似；现版又包含固件sky图片。不能把它的12色数字直接称为合法可重分发的精确月背景。

## 8. 1000型号条件与交互差异

官方[System Settings](https://manuals.playstation.net/document/en/psp/current/settings/index_system.html)HTML中的`in_1000.gif`等型号标记可核验：

- Your Birth Date、Display Panel Close Options、Format System Storage为PSP Go/N1000条件，不应显示在PSP1000的系统设置。
- UMD Cache仅2000/3000/E1000，不是1000；ColorSpace为3000/N1000；USBCharge为2000/3000/N1000/E1000。1000不具USB充电选项。
- UMD AutoStart、BatteryInformation、WMA、Flash出现在1000支持条件中（Flash特别1000标记）。
- [Game category](https://manuals.playstation.net/document/en/psp/current/game/game.html)说明项目按介质条件显示；没有UMD不能常驻一个可运行假UMD。MemoryStick状态必须反映本地导入集合或明确未插入，不能固定写486MB/1459MB。
- [Key Tone](https://manuals.playstation.net/document/en/psp/current/settings/keytone.html)明确控制按钮确认提示音。SOUND硬键/耳机音效模式与KeyTone不是同一项。
- 6.61准确菜单还应保持地区差异（Extras/数字漫画、PSN服务等）。VitaXMB只有六类，官方手册包含PSN与Extras，不能简单照搬该Vita项目类别当PSP全部菜单。

## 9. 1:1验收应怎样做

1. 首先固定机型1000、固件6.61、地区、语言、主题颜色、时间、MemoryStick/UMD状态。每一项都写入截图夹metadata；否则蓝色/选项差异没有判断意义。
2. 保留原生480×272独立帧，再在机壳内等比显示。半展开机身透视只作用在整个屏幕矩形，不改系统内部布局。
3. 对home、SystemSettings、单项编辑、确认对话框、Options、Media列表、boot分别做源帧与实现叠加/差异图。没有参考帧的页不要勾选1:1完成。
4. 测关键锚点和实际文字墨迹宽度；不要只测DOM有状态改变。圆角、层级和画布尺寸正确也不足以证明系统准确。
5. 要达到原版字形/波面/声音，提供可选的用户本地固件/主题加载或PPSSPP桥接。资源用户本地提供，静态仓库不携带商业固件；网络下载官方更新与再分发许可是两回事。
6. 若目前只能落实数值布局，应准确报告“主页/设置按有来源坐标重建，原厂字体/波纹/全系统仍未1:1”，不要换一套近似SVG就交差。

## 10. 原版错误对话框的新增参考帧

PPSSPP官方演示21秒出现真正固件“game cannot be started / data corrupted”对话框：`.research/psp-official/vshdemo-21s.png`。这是Sony系统的错误弹层，不是VitaXMB的自绘Yes/No框，足以证明“所有弹层都画居中暗卡片”不符原机。

该1568×944录制帧的游戏区域估计为x0..1567、y51..939，比例约3.2667。按该区域换算（研究测值，约±1原生px，不是程序读取）：上分割线x60..420、y105，下分割线同x、y168；两行正文左缘约133，centerY127/146；底部 ○ Back 位于约x260..310、centerY261。整屏是浅灰透明遮罩，原背景/图标/状态栏仍可见，不是只给正文添加矩形背景。此演示不是已核验具体版本/地区的用户实机帧，最终6.61验收仍应使用固定条件原生抓屏。

18秒帧为进入MemoryStick后的游戏列表，选中宽封面、父类别左滑接近边界、右下角△ Options；21秒错误页保留同一背景。参考图片属于研究，不能作为Pocket Museum现有页面截图交付。
