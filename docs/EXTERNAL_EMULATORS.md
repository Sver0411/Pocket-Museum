# 连接本地模拟器

默认体验继续使用纯网页系统与已接入的浏览器核心。PSP 另提供可选的 PPSSPP 连接入口，不需要启动额外的 Pocket Museum 后端。

## 使用

1. 安装官方 [PPSSPP](https://www.ppsspp.org/download/)，在模拟器里打开你自己的 PSP 程序。
2. 在 PPSSPP 的 Settings → Tools → Developer Tools 中开启 **Allow remote debugger**。查看 **Local server port**；它不是所有安装都相同的固定值。
3. 运行本项目 `npm install` / `npm run dev`，从 `http://127.0.0.1:5173/` 打开，选择 PSP。
4. 右侧 **更多 → 连接模拟器**，填写 `ws://127.0.0.1:端口/debugger` 并连接。界面中的 27312 是可编辑的示例端口。
5. 点击 **共享模拟器窗口**，在浏览器弹出的选择器里选择 PPSSPP 窗口。使用四个裁剪值去掉窗口标题栏、黑边。声音由 PPSSPP 播放。
6. 关闭连接面板后，可以用机身按钮、键盘或标准手柄操作。网页暂停按钮暂停/恢复模拟 CPU；网页电源关闭、返回博物馆、换掌机会断开连接。

断开连接不会退出 PPSSPP，也不会删除原生模拟器里的游戏或存档。PSP HOME/宿主暂停菜单、存档、音量仍在 PPSSPP 窗口操作。其他掌机继续使用网页流程，3DS/Vita 外部接口尚未适配。

## 实际连接方式

- 按键通过官方 WebSocket 调试协议 `debugger.ppsspp.org` 传送，使用 `input.buttons.send`，保留持续按住、多键和多来源仲裁。
- 摇杆走独立的 `input.analog.send`，将浏览器向下为正的 Y 轴转换为 PSP 向上为正；不再同时按压十字键。失焦、暂停、切换、主动断开前发送按键释放和摇杆归中。
- CPU 暂停/恢复命令没有普通同 ticket 回复，本项目查询 `cpu.status` 确认真实状态，不把发出命令当作执行成功。
- 实时画面来自浏览器 `getDisplayMedia`，仅在用户点击并选定窗口后开启；不使用“反复暂停截图”模拟视频流。浏览器停止共享、退出掌机或断开时释放媒体轨道。
- **抓取暂停画面**是一次性的官方 `gpu.buffer.screenshot` 调用，会保持模拟器暂停。部分原生图形后端返回 `Could not download output`；此时显示具体说明，可继续通过窗口共享查看。它不是所有后端都保证支持的功能。

远程调试来源和窗口共享受 PPSSPP 与浏览器限制，因此连接入口只出现在 localhost 项目版本；离线单文件版不显示此入口。公开部署域名不能保证连接到本地调试服务。建议使用桌面 Chrome/Edge；手机端通常没有窗口共享能力。

## 验证

自动测试将协议兼容测试和真实原生联机测试分开：

```sh
npm test
npx playwright test tests/e2e/external-emulator.spec.ts
```

默认浏览器测试使用明确标识的测试服务与 Canvas 视频轨道，检查窗口画面进入 LCD、裁剪、按键、轴、暂停/恢复、轨道释放和错误提示。它不代表真实模拟器验收。

已打开自有原生 PPSSPP 程序时，可以执行独立联机用例；它通过 PPSSPP 发回的 `input.buttons` / `input.analog` 广播核对真实控制器状态：

```sh
POCKET_MUSEUM_PPSSPP=ws://127.0.0.1:27312/debugger \
  npx playwright test tests/e2e/external-emulator.spec.ts --grep 'real optional'
```

首次窗口选择需要手动进行，不通过测试跳过浏览器的用户选择。公开仓库不附带原生模拟器二进制、固件或商业游戏。版本与协议出处见 [核验记录](research/EXTERNAL_EMULATOR_PROTOCOL.md)。
