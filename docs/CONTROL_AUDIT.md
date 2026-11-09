# 七台掌机控制审查

更新：2026-11-10。主页面、整合 HTML 和七个单机 HTML 共用这些修正。三台翻盖机的闭合对齐、拖动和完全展开另见 [CLAMSHELL.md](research/CLAMSHELL.md)。

| 问题 | 当前实现 | 验证 |
| --- | --- | --- |
| 十字键四个方向独立下沉 | 每台一个整体帽体、四个固定命中区；Sony 分区也作为联动帽体 | 七台逐键和斜向输入 |
| 不管按哪边，看起来都朝一边倾斜 | 上/下绕 X 轴使用相反角度，左/右绕 Y 轴使用相反角度；受力方向同时决定帽体小幅位移与表面明暗 | 浏览器读取实际 DOMMatrix；四向各验证所按端深度低于对端，四个变换互不相同；28 张局部截图 |
| 静止时有黑线、矩形遮罩缝 | 删除通用黑色 socket 和通用百分比十字裁剪；静止时不覆盖原图，各机型独立 SVG 轮廓 | 对照源图和按压图；轮廓坐标位于 `controlArt.ts` |
| 摇杆底下空、底座跟着帽体跑 | 凹槽与环留在原图，只裁出帽体；受力时保留实心支撑，限制行程 | 3DS/PSP 滑动与 Vita 倾斜的静止、按住、回中截图 |
| 推摇杆带动十字键 | 分开逻辑输入和实体受力反馈，`stick:`/手柄轴不压下十字键；独立十字键输入仍可叠加 | 单元测试验证同向多个来源的持有/释放，浏览器断言十字键保持未按下 |
| 按钮裁剪挪动周围机身 | 命中范围与可见帽体轮廓分开，圆键/胶囊键/倾斜 Select 按源图单独遮罩 | 全部实体键按下和释放、实际可见像素变化 |
| 摇杆键盘斜向松开一个键全部回中 | 分别持有每个键，不让全局键盘监听抢走摇杆方向事件 | 上+右，松开上仍保留右；切机/合盖/失焦清理 |
| 多指抢占同一摇杆、残留输入 | 首个指针持有、Pointer Capture、取消与失焦释放、多来源仲裁 | CDP 真实多点触摸/取消、Gamepad 断开和真实核心输入探测 |
| Home 只打开网页帮助 | Home/PS 进入本机系统导航；网页帮助由问号打开 | PSP XMB、3DS HOME 与 Vita LiveArea/索引；系统细节见范围记录 |

运动参数属于网页显示尺度，尚未使用实机高速摄影进行机械行程标定。SVG 轮廓是对当前源图的手工对齐，后续替换底图必须重新标定，不能直接套用。照片里的固定侧壁光照仍会影响观感，尚不是完整的动态三维材质模型。

## 拆机依据

- [iFixit：PSP 1000 Buttons Replacement，第 7–8 步](https://www.ifixit.com/Guide/PSP+1000+Buttons+Replacement/1784)
- [iFixit：Vita Directional Pad Buttons，OEM 零件照片](https://www.ifixit.com/products/playstation-vita-directional-pad-buttons)
- [iFixit：Vita Directional Pad Replacement，第 20 步](https://www.ifixit.com/Guide/PlayStation+Vita+Directional+Pad+Replacement/8088)

`docs/screenshots/controls/` 中 `*-up/down/left/right.png` 是本轮四方向实际浏览器局部图。`src/components/DPad.tsx` 决定受力方向，`controlArt.ts` 决定各机型的照片轮廓。

平铺版使用独立正视素材与 `flatDevices.ts` 内重新标定的按钮、屏幕、摇杆和十字帽体轮廓，不再对半展开图片做投影拉伸。合盖时内侧控件设为 inert；形态切换不会销毁游戏 iframe。
