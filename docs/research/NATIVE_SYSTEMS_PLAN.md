# 实机系统复刻：实施顺序

2026-11-10 更新：已完成两轮可操作系统界面与本地应用扩展，新增半展开/平铺/闭合；实际覆盖和未完成项以 [NATIVE_SYSTEMS.md](NATIVE_SYSTEMS.md) 为准，以下为后续工作的实施顺序。

用户新目标：先纠正裁剪、摇杆支撑和输入串联，再把七台机器的实机开机/无卡/系统 UI 纳入同一主页面和各独立 HTML。保持不显示 Nintendo 厂商 Logo 的既有约束；这项是与逐像素原机复刻的明确差异。

## 顺序

1. 修复控件画层：原照片静止不覆盖；分离命中区和可见帽体；独立数字键与摇杆视觉；真实轮廓、无黑色垫片。
2. 建立每台机器的开关机与插卡状态，移除“电源开即自动选演示卡带”的网页行为。
3. 按官方依据实现 GB/AGB/AGS 启动画面；没有系统菜单，不虚构卡带挑选 UI。
4. DS Lite：双屏主菜单、PictoChat、Download Play、四组设置及退出关机。
5. 原版 3DS：HOME Menu、卡带槽、系统应用、系统设置和 HOME 返回流程。
6. PSP-1000：固定固件基线的 XMB、各分类、设置、对话框、HOME 返回。
7. Vita PCH-1000：锁屏、气泡主页、LiveArea、应用/索引/PS 返回与设置。
8. 逐页比较截图与行为，登记未实现项。没有对齐的页面不能标记为 1:1 完成。

## 已取得的官方来源

- DS Lite 官方说明书：https://assets.nintendo.eu/image/upload/v1635390384/NAL/Support/DSLiteInstructionBooklet.pdf
- DS 菜单图：https://en-americas-support.nintendo.com/app/answers/detail/a_id/7255/
- GBA 官方说明书：https://www.nintendo.com/eu/media/downloads/support_1/game_boy_advance_4/GBA_Manual_UK_DE_FR.pdf
- AGS 官方说明书入口：https://en-americas-support.nintendo.com/app/answers/detail/a_id/16961/
- 原版 3DS 官方说明书：https://assets.nintendo.eu/image/upload/v1626222882/NAL/Support/3DSOperationsManual_AU.pdf
- PSP 官方设置目录：https://manuals.playstation.net/document/en/psp/current/settings/index.html
- PSP 型号默认设置差异：https://manuals.playstation.net/document/en/psp/current/settings/index_default.html
- PSP 系统设置：https://manuals.playstation.net/document/en/psp/current/settings/index_system.html
- Vita 主页 / LiveArea / 索引：https://manuals.playstation.net/document/en/psvita/basic/screens.html
- Vita 操作流程：https://manuals.playstation.net/document/gb/psvita/basic/basicoperation.html
- Vita 无卡与启动行为：https://manuals.playstation.net/document/en/psvita/game/game_card.html

系统界面按官方文档的英文基线实现；应用外围仍保持中文。不捆绑来历不明的固件或把未实现的外设/在线服务伪装成功。
