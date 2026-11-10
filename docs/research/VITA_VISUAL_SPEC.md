# PS Vita PCH-1000 / 3.74：可执行视觉依据与复用调查

2026-11-10；限定研究，没有修改生产代码，没有下载固件。全部坐标以 **960×544 原点左上** 为逻辑画布。本文区别三种证据：**A** Sony 官方行为/画面；**B** 开源实现的明确常量（不等于原厂常量）；**C** 低分辨率官方截图的换算测量（误差通常 ±4–8 原生像素）。没有取得 3.74 实机无损截图的部分不标为像素认证。

## 可以立即落实的纠偏

1. 主页采用 **3 / 4 / 3 交错气泡，最多 10 个槽位**；删除目前屏幕顶部“PS Vita”文字标头和两行五列布局。主页分页点放左侧。顶部是黑色 32px 信息栏：连接状态、中央 Home/已打开 LiveArea 微型图标、时间/音量/电池、右上通知页角。
2. 图标点选先进入该应用 **LiveArea**，再点击门板 Start；禁止把所有气泡直接跳入应用。应用中 PS 返回 LiveArea；Home/LiveArea 中 PS 显示索引。主页上下翻页、Home 与已开启 LiveArea 左右移动，最多六个开启的 LiveArea。
3. LiveArea 使用 x60..900 的中央卡片与两侧蓝色背景；Settings 的门板约 `(340,183,280,158)`，不是占满屏幕的巨大图标加一行网页按钮。
4. 锁屏保留左下日期/时间、右上向左下剥页。没有许可的原厂壁纸/字体/气泡图片不混入生产目录。锁屏字体和背景目前存在明确像素差异，不能把重绘称原始固件。

## 版本基线

- [Sony 3.74 官方更新页](https://www.playstation.com/en-us/support/hardware/psvita/system-software/) 确认 2022-05-10 的 3.74，并说明账户登录改为设备密码。**不要下载页面中的 PUP**。
- 当前 [Sony User Guide](https://manuals.playstation.net/document/en/psvita/basic/screens.html) 页脚说明 3.73 或以后；它可作为 3.74 操作基线。页内插图沿用旧示例、通知数量和已打开应用状态，并非“全新 PCH-1000 3.74 恢复出厂布局证明”。
- [PCH-1000 官方规格](https://www.playstation.com/content/dam/global_pdc/en/corporate/support/manuals/psvita-docs/PCH-1001_1101-1.6_2.pdf) 为 960×544 OLED。PCH-2000 是 LCD，PSTV 没有同样触摸锁屏；不要混用。
- 2011/2012 首发官方图有 near、旧 Group Messaging 和旧应用顺序；[2012 官方 FAQ](https://blog.playstation.com/?p=69885) 的预装应用名单是首发证据，不是 3.74 排序证据。当前 guide 第一页有 PS4 Link 和 Parental Controls，不能拿首发第一屏的 near 替换。
- 首次初始化（地区/时间/账户设置）与已经初始化后的唤醒锁屏不同；当前目标是初始化完成的英文系统、Original 默认主题。不要在每天开机时重复初始化向导。

## 可集成成品实际检查

| 候选 | 固定版本、源码与许可 | 实际能力 / 采用结论 |
| --- | --- | --- |
| [boulbeba115/vita-launcher](https://github.com/boulbeba115/vita-launcher) | `d2113ea83d2783740d68bef3bad90e94c7fe9e47`，2026-08-06；根目录和 36 个文件中 **没有 LICENSE**，API `license:null`。实际 UI 是 `app/src/main/assets/index.html`，Kotlin 只负责 Android 桥 | 确实有可独立浏览器打开的 peel、bubble、LiveArea，不是只看 README。私有 Chrome 960×544 打开成功，12 mock apps，零 pageerror，研究截图 `vita-launcher-lock.png`。但是顶部 VITA、右侧页点、响应式规则网格、Android包名/Launcher/Search、全新图标不符合原机。**不直接复制无许可代码**；也不是1:1成品 |
| [hotdog-face/VitaOS](https://github.com/hotdog-face/VitaOS) | `41a6f0b1f4ba56966cc66d7bf09dfea2e95d283b`，GPL-3.0；已下载实际源码、LICENSE、CREDITS和截图 | 原生 VitaSDK/CMake，README明确 PS5-style；分栏现代启动器，不是3.74气泡固件。不能整包当原系统。字体资源含 Inter/NotoSansJP 并有独立 notice，但不是原厂 PVF |
| [Vita3K 旧 ImGui 系统 UI](https://github.com/Vita3K/Vita3K/tree/a01f2b15b6b4149a80f531e56df351369ebc2e55/vita3k/gui/src) | 固定 `a01f2b15b6b4149a80f531e56df351369ebc2e55`；源码头与 `COPYING.txt` 为 GPL-2.0-or-later；已读取 themes.cpp、home_screen.cpp、live_area.cpp、settings.cpp、information_bar.cpp、gui.cpp | **有可复用几何/状态/LiveArea XML 渲染实现**，不是仅有编辑器。但是主页用可配置等距网格，锁屏用点击直接关闭，不是原机完整3D气泡与剥页。底图/原厂图标/字体由用户安装固件读取，源码许可不授权它们。建议复用明确常量/算法并署名，不照搬错误网格 |
| [Vita3K 当前 master](https://github.com/Vita3K/Vita3K/tree/885f9168d9ab63a5c3f2bbade2f216e6daef14aa) | 本次树 SHA `885f9168d9ab63a5c3f2bbade2f216e6daef14aa`；`91f533f86faa82fa61f1bb6411cd2d4bbedeb4a2` 提交 complete GUI overhaul | 已改为 Qt GUI；不能拿当前桌面列表宣称原机气泡 UI |
| [LiveAreaDesigner](https://github.com/robin994/LiveAreaDesigner/tree/b54f4e81a735ec3559d3b59c162db72f9b8a1811) / [运行 Demo](https://robin994.github.io/LiveAreaDesigner/) | Web1.32，MIT；`docs/geometry.mjs` 已获取实际代码 | 可直接复用 CARD/SCREEN 坐标、XML 布局计算与主题/样例绘制；不是锁屏/主页/Settings。`CARD={x:60,y:44,width:840,height:500}`，卡片顶44px保留系统动作区。作者还明确 ad0 等无 RCO gate 槽时手工 gate 布局未经实机验证，不能把所有模板画同一个门 |

未发现具有清楚许可、浏览器可执行且已逐像素覆盖锁屏→交错气泡主页→所有系统 LiveArea→设置完整链路的成品。此结论仅对应本次实查候选，不是互联网不存在其他实现的断言。

## 主页坐标与顺序（A/C）

最有用的无红框官方完整屏幕样本是 [`basic_start_01.jpg`](https://manuals.playstation.net/document/imgpsvita/basic_start_01.jpg)，页面 [Starting and closing applications](https://manuals.playstation.net/document/en/psvita/basic/start.html)。原图 **305×173**，没有960版本；`basic_screens_01.jpg` 另含红框/注释，不能整体按960拉伸测量。以下是前者换算，`x'=x*960/305`、`y'=y*544/173`。气泡有浮动/变形，图像单帧不能推出动效曲线。

| 槽位 | 中心 (x,y) | 该官方截图的应用 |
| --- | --- | --- |
| 0 | `(252,132)` | Welcome Park |
| 1 | `(482,132)` | PS Store |
| 2 | `(708,132)` | Browser |
| 3 | `(145,283)` | Trophies |
| 4 | `(368,283)` | Friends |
| 5 | `(595,283)` | Messages |
| 6 | `(815,283)` | Party |
| 7 | `(252,434)` | PS4 Link |
| 8 | `(482,434)` | 空。另一个官方 screens 示意图在此放用户创建的 Folder，**不是固定系统 app** |
| 9 | `(708,434)` | Parental Controls |

- 球体直径约134–138px；应用标题在球体下方，原生约17–19px。不是图标中心放现代单色线框+卡片文字。
- 左侧分页点 `x≈22`，三个点 `y≈255/280/305`；当前页白色，其他半透明。第三行空槽不要自动撑开其他气泡位置。
- 顶栏高32px；黑背景、白色状态。通知不是普通电池旁小红徽标，而是右上向下伸出的蓝色页角/圆弧，含数量。本示例5条。无通知状态外观不同，见 Vita3K notice 常量。
- 图标图案：Welcome Park 橙色手/123白球；Store蓝购物袋PS符号；Browser青蓝WWW；Trophies黄奖杯；Friends红蓝人脸；Messages紫色对话；Party红耳机；PS4 Link蓝设备；Parental Controls绿图案。它们属于受保护原厂美术，**不能因从guide看到就当MIT图片复制**。
- 第二页精确默认顺序尚无 3.74 恢复出厂的原生截图证明。可以确认应用目录存在 Videos、Music、Photos、Email、Calendar、Content Manager、PS3 Remote Play、Settings。当前自己排列不可标为恢复出厂1:1。

## 锁屏（B；需实机截图补证）

[Vita3K themes.cpp 固定源码](https://github.com/Vita3K/Vita3K/blob/a01f2b15b6b4149a80f531e56df351369ebc2e55/vita3k/gui/src/themes.cpp)：

- `99–102`：默认白色；`date_pos=(900,186)`、`clock_pos=(880,146)`，用画布右下减偏移转换为日期左上`(60,358)`、时钟左上`(80,398)`。
- `474–503`：信息栏32；内容从y32开始；白色细圆角框外接 `(32,64)..(928,512)`，radius20。这个框是 **Vita3K 绘制行为，仍需与原机默认锁屏对照**。
- `510–548`：日期font34；时间font116；12小时制AM/PM font56，贴时间右下。不能用网页居中大标题代替。
- `161–163`：默认锁屏图片从用户的 `vs0/data/internal/keylock/keylock.png` 读取，不在代码许可覆盖的资源里。
- `554`：Vita3K点击屏幕关闭，**没有原机剥页实现**。交互需按原机右上角向左下剥页补齐，不要把该实现误认为原机行为证据。
- Sony guide [Theme](https://manuals.playstation.net/document/en/psvita/settings/theme.html) 证实 Start screen 与主页背景独立设置。官方 power/start 页面本次没有找到默认锁屏960无损图。不能凭自行画的浅色背景声称所有颜色已核对。

## LiveArea 与 Settings 门板（A/B/C）

[官方 Settings LiveArea 图](https://manuals.playstation.net/document/imgpsvita/settings_livearea_01.jpg) 与 [说明](https://manuals.playstation.net/document/en/psvita/settings/livearea.html)：图像345×192包含外部ABC标签，屏幕实际约305×173，红框也会污染边缘。可见中央绿卡、顶小User's Guide动作图标、门板、底左User's Guide卡片；不可以从红框像素取原机边框颜色。

| 元素 | 960×544坐标/值 | 证据 |
| --- | --- | --- |
| 信息栏 | `(0,0,960,32)`，black | Vita3K information_bar.cpp:559–563；Sony图吻合 |
| 中央LiveArea卡片 | `(60,44,840,500)` | LiveAreaDesigner geometry.mjs:4；Sony图吻合 |
| Settings标题 | 约`(70,52)`，约28px，浅白 | C，截图测量 |
| 系统帮助动作图标 | 中心约`(480,78)`，约72×72 | C，截图测量；不是所有应用固定3个动作 |
| a1门板 | `(340,183,280,158)` | Vita3K live_area.cpp:102–113、683、705–708 |
| a2/a3/a4门板 | `(340,149,280,158)` | 同文件:113–146；原坐标为窗口右下偏移 |
| a5门板 | `(580,149,280,158)` | 同文件:149–161 |
| Browser门板 | `(579,149,280,158)` | 同文件:164–177 |
| a1 frame1 | `(60,130,260,260)` | 同文件:106 |
| a1 frame2 | `(640,130,260,260)` | 同文件:107 |
| a1 frame3 | `(60,390,840,150)` | 同文件:108 |
| 银色门板边框 | `#c0c0c0`，厚10，圆角10 | 同文件:1190–1195，B，不是截图测得 |
| Start | font25，白字，蓝底`#14a8de`圆角10 | 同文件:1198–1209，B；宽按文字+26，高文字+5，靠门板底部 |
| User's Guide底卡 | 约`(90,400,380,140)` | C，包含救生圈和右侧标签；需要精细素材补证 |

换算细节：Vita3K LiveArea内容窗口960×512起点y32；a1 gate_pos=(620,361)是**从窗口右下减**，故x=960−620=340，y=32+512−361=183。直接把(620,361)当左上会完全错位。不同模板门板不同，不要统一居中。

Settings应用内部的开源参考也可用，但要区分模拟器删减功能与原机：

- [settings.cpp:250–260](https://github.com/Vita3K/Vita3K/blob/a01f2b15b6b4149a80f531e56df351369ebc2e55/vita3k/gui/src/settings.cpp#L250)：内容y32；列表区域宽780、高414，x90；常规列表y96，行高80；标题中心约(480,67)，32px左右；绿色背景 fallback `#24780c`；白字。
- 该文件:354–372首页 **只有Sound & Display / Theme & Background / Date & Time / Language**，是Vita3K实现子集，不是原机完整设置首页。不能因此删去Flight Mode等原机项目。
- [Sony设置目录](https://manuals.playstation.net/document/en/psvita/settings/index.html)顺序：Flight Mode、System Update、Network、PlayStation Network、Devices、Notifications、Sound & Display、Theme & Background、Location Data、Security、Date & Time、Language、Accessibility、System、Format、Power Save Settings。目录中的子项目是层级，不是所有一起铺到主列表。3.74账户管理限制按更新说明处理。
- 本次没有取得当前3.74 Settings内部页面的960原生无损图，因此行高/颜色的B值只作为起始实现，不可报像素匹配通过。

## 原厂资源实际在哪里、哪些可用

- `themes.cpp:371` 默认图标读 `vs0/app/<TITLEID>/sce_sys/icon0.png`；`:399`默认背景读同目录pic0；`live_area.cpp:193`默认布局读 `vs0/data/internal/livearea/default/.../template.xml`；这些都不在Vita3K仓库许可里。
- `gui.cpp:229–268`原厂字体为 `sa0/data/font/pvf/ltn0.pvf`、jpn0/cn0/kr0等。不得从别人固件包提取再当开源字体分发。
- Vita3K有合法 fallback `data/fonts/mplus-1mn-bold.ttf`，独立 `data/fonts/LICENSE_E`：M+ FONTS PROJECT 2002–2017，允许商业/非商业、修改/复制/分发，保留notice。可用于授权fallback，**字体度量并非原厂**；不是拿粗体替代后仍称1:1。
- 原机精确图标/字体可通过“用户本地提供自己的主题或合法授权素材”通道加载；公共发行仍使用明确标记来源的重绘资源。应把重绘与原厂像素差异列在验收中。
- [Sony guide使用条款](https://manuals.playstation.net/document/en/terms.html)保留原内容知识产权，只允许有条件个人非商业单份手册打印，不是通用图像再分发授权。研究下载的Sony截图留在 `.research/vita-visual`，不要复制进public或发布产物。

## 工程落地与验收建议

- 把所有坐标固定在960×544根画布，再整体等比缩放；不要让媒体查询改成另一个网格。气泡数组保留slot索引，空槽也保留。
- 基于上述来源重做顶部状态条/3-4-3/左页点/LiveArea门板后，在960×544截取纯屏幕，与官方缩略图用**相同缩小滤镜**对齐比较。不要用整机照片机身透视差异评价屏幕位置。
- 视觉验收分为布局、图标轮廓、字体、波纹/剥页动画四项。已测布局不能替代未核验字体/图标动画。
- 需补的最高价值证据：PCH-1000官方3.74、英文、Original主题、恢复出厂后两页主页，唤醒默认锁屏，Settings首页/LiveArea，无通知和有通知两种顶栏；使用设备PS+START原生截图。现有公开guide只能锁定结构和近似测量，不能证明所有像素。

## 私有研究文件

`.research/vita-visual/` 保存候选ZIP/实际源码、API元数据、Sony HTML/截图、研究拼图与 `probe-candidate.mjs`。没有引入生产资源。Vita3K源引用固定提交如上；源码头GPL与COPYING均已读取。此研究未运行原生VitaOS构建，也未宣称Qt/ImGui项目能直接作为浏览器Vita模拟核心。
