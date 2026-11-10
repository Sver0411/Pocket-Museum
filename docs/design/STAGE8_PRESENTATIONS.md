# Stage 8 — 七机型独立展示层

## 结构

`src/presentations/DevicePresentation.tsx` 定义七个独立展示组件。每个组件只组合 `keyboard`、`handheld`、`controls` 三个展示插槽；`App.tsx` 继续拥有唯一业务状态，`Console`、InputController、EmulatorBridge、原生系统和存储模块继续共享。运行状态通过 CSS 收敛辅助信息，不切换或重新挂载模拟器 DOM。

| 机型 | 展示组件 | 结构与材料 |
| --- | --- | --- |
| Game Boy | GBPresentation | 单色点阵背景、像素键帽、双线键位框、直角控制架与圆角下缘 |
| GBA | GBAPresentation | 宽幅游玩区、Y2K 椭圆轨道、左右错角玻璃面板 |
| GBA SP | GBSPPresentation | 银灰留白、细分隔线、无面板中心展台，突出上盖和铰链 |
| DS Lite | DSPresentation | 冰蓝背景、上下双屏导引框、分开的白色控制块与触摸提示 |
| 3DS | ThreeDSPresentation | 青绿 HOME 节奏、独立圆角键位卡片与应用磁贴式控制 |
| PSP | PSPPresentation | 淡紫蓝波纹、横向大画面、垂直导航轴及 XMB 风格列表 |
| PS Vita | VitaPresentation | 蓝紫气泡场景、OLED 中心区、圆形键帽和 LiveArea 风格胶囊控件 |

## 操作入口

- 唯一电源按钮位于原机身开关位置；原底部重复电源已移除。
- 支持网页游戏的机型在机身下沿显示卡带入口；拔出卡带、全屏、资源导入、媒体导入和外接模拟器位于“更多”弹出菜单。
- 左侧从实际设备键位生成映射，PSP/Vita 显示 ×/○/△/□，GB 不显示肩键。
- 右侧保留暂停、音量、亮度及翻盖姿态。选择了支持的卡带时显示存档操作。
- 游戏运行时减弱左侧辅助信息与背景，保留控制和屏幕，不重新挂载 iframe。
- 小屏幕隐藏左右栏，底部小型入口打开浮动控件；机身始终为页面中心。

## 首页和截图

首页九张屏幕预览来自本项目当前原生系统组件的实际浏览器渲染，分别覆盖七台机器。GB/GBA/SP 为无卡开机画面；DS/3DS 为双屏系统画面；PSP 为 XMB，Vita 为气泡桌面。它们是网页系统重建的预览，不是原厂固件截图。图片载入与解码成功后才显示展品，切换/返回时也使用相同加载逻辑。

`docs/screenshots/current/` 保存实际浏览器截图：七台机型页面、七台移动页面、GB/GBA/SP/DS 真实运行游戏，以及 3DS/PSP/Vita 系统页面。`index.json` 是本轮截图清单。`scripts/capture-current.mjs` 可重新采集。游戏能力保持 GB/GBA/mGBA、NDS/DeSmuME 和可选本地 PPSSPP 连接的现有范围。

八份独立 HTML 继续由同一份源码生成，并嵌入首页预览、机身、字体和音频。

## 验证

85 项本地资源 SHA-256、TypeScript、30 项单元测试、构建通过。完整浏览器回归 40 项通过；DS 平铺机身侧电源补齐后，新增展示测试与离线 HTML 共 4 项再次通过。生产构建的 GB/GBA/NDS 视频与存档检查、DS 日期、平铺和移动布局通过，23 张实际浏览器截图完成采集。三台翻盖机在合盖和完全展开后均能使用唯一的机身电源。
