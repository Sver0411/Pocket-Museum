# 可选 PPSSPP 连接：WebSocket 协议核验

研究日期2026-11-10。初次调查仅核对源码；随后已加入可选连接，并实际启动官方 macOS SDL v1.20.4、运行本地测试程序，浏览器端验证了握手、按钮按下/释放、独立模拟轴、CPU 暂停/恢复和主动断开。`input.buttons` / `input.analog` 广播用于核对原生控制器状态。现有纯网页系统仍为默认。实时画面来自用户主动选择的浏览器窗口共享，不是 PPSSPP 提供的视频接口。详见 [使用与测试](../EXTERNAL_EMULATORS.md)。

本机原生图形后端的 `gpu.buffer.screenshot` 返回 `Could not download output`，未计为截图成功；UI 解释此限制并保留暂停。窗口共享的视频渲染/裁剪/释放通过可重复的 Canvas MediaStream 浏览器测试，原生窗口选择尚需手动验收。

## 固定来源与版本差异

- 当前开发提交 [`d20d388611395a1948c3092dcbdbba347d0e954f`](https://github.com/hrydgard/ppsspp/tree/d20d388611395a1948c3092dcbdbba347d0e954f)，提交时间2026-11-10T00:00:21Z。
- [该提交官方WebSocketDebugger.md](https://github.com/hrydgard/ppsspp/blob/d20d388611395a1948c3092dcbdbba347d0e954f/docs/WebSocketDebugger.md) 说明transport和异步事件；实际InputSubscriber/GPUBufferSubscriber/GameSubscriber/CPUCoreSubscriber/ClientConfigSubscriber均已下载并阅读。
- GitHub最新正式版API为 **v1.20.4，2026-05-16**，标签对应commit **`fa50bb1976065c4f8b1b47af227d367fe9771555`**。另读取正式标签的五个Subscriber核对兼容性，不能把master新增API默认认为已存在。

| API | v1.20.4正式版 | 本次master |
| --- | --- | --- |
| version | name、version | 另有pid、path |
| input.buttons.send / analog.send | 有 | 有，基本格式一致 |
| cpu.stepping / cpu.resume / cpu.status | 有，异步广播 | 有，异步广播；status另有us、clockHz |
| gpu.buffer.screenshot | 有；要求CPU或GPU stepping | 相同要求；headless Vulkan另有显示帧缓冲fallback |
| client.config.set acknowledgeDeferred | **没有该事件** | 有 |
| game.state.load/save/rewind/verify | GameSubscriber中没有 | 有；排队到CPU下一帧执行 |
| 音频订阅/PCM/视频流 | 没有 | 没有 |

### 连接

```js
const socket = new WebSocket('ws://127.0.0.1:34567/debugger', 'debugger.ppsspp.org');
socket.send(JSON.stringify({event:'version',name:'Pocket Museum',version:'1.0',ticket:1}));
```

- 路径`/debugger`；**必需**WebSocket subprotocol `debugger.ppsspp.org`。端口是用户在PPSSPP设置的Local Server Port，不能假设恒为某个默认值。
- 设置 > Tools > Developer Tools > Allow remote debugger。`RemoteDebuggerOnStartup=true`可启用。当前master增加统一`--debugger=PORT`命令行；不要承诺正式版识别该新参数。正式版最稳妥用UI设置。
- 每个请求用唯一`ticket`；普通回复沿用event并回显ticket。错误`{event:'error',message:'...',level:2,ticket:...}`；未知事件会返回`Bad message: unknown event`。
- master的Origin规则只放行localhost/127.0.0.1/[::1]、模拟器自己以IP提供的页面、指定官方调试器域；`file://`的null Origin被拒。**公开部署域名不能直接假设获准连接本机**。本项目localhost开发来源符合规则；服务器本身也不是公网服务。
- HTTPS网页连`ws://`还受浏览器mixed-content/本地网络权限约束。应保留浏览器真实失败信息，不把所有失败写“模拟器未启动”。不自动改用户防火墙/远程设置。

## 握手与状态

master握手示例：

```json
{"event":"version","name":"PPSSPP","version":"v1.20.4-...","pid":1234,"path":"/path/to/EBOOT.PBP","ticket":1}
```

`pid/path`在正式版缺失是正常，不是握手失败。版本字符串可能包含git信息，不能要求固定完整字符串。收到`name:'PPSSPP'`并完成`game.status`、`cpu.status`才显示具体连接状态。

`game.status`返回`{game:null|{id,version,title},paused:boolean}`；paused只表示**PPSSPP暂停菜单**，不是CPU调试stepping。

`cpu.status`返回`{stepping,paused,pc,ticks}`；master另有`us,clockHz`。判断截图可用至少看stepping，不能拿game.paused代替。没有boot时pc/ticks可为0。

## 按钮按下、同时按住、释放

[InputSubscriber.cpp:28–59,112–166](https://github.com/hrydgard/ppsspp/blob/d20d388611395a1948c3092dcbdbba347d0e954f/Core/Debugger/WebSocket/InputSubscriber.cpp#L28)：

```json
{"event":"input.buttons.send","buttons":{"cross":true,"ltrigger":true,"up":true},"ticket":10}
{"event":"input.buttons.send","buttons":{"cross":false,"up":false},"ticket":11}
{"event":"input.buttons.send","buttons":{"ltrigger":false},"ticket":12}
```

- buttons是对象，值必须true/false/null。true按下，false释放；**未列出的键或null保持当前状态**。`{buttons:{}}`不会释放所有键。
- 回复只含event/ticket；含义是已接收并写入控制器状态，不代表游戏已采样到某帧。
- PSP有效游戏键：`cross,circle,triangle,square,up,down,left,right,start,select,ltrigger,rtrigger`。另有home、screen、note、vol_up/down等名称，但注释警告部分不被PPSSPP尊重；home不是等同向PPSSPP宿主发送“打开暂停菜单”。
- 每种实体输入先在父应用聚合键来源，跨键盘/触摸/手柄按住时不能一个源松开就释放另一个源。只发聚合变化。
- 页面blur、hidden、切换机型、主动断开**先显式发送所有由本网页持有的键false和轴0**。源码连接析构没有对ButtonsSend写入的全局ctrlCurrent状态统一复位，不能指望断开会自动松开。意外网络断开无法保证发出清除，UI应明确提示在PPSSPP确认控制状态。
- `input.buttons.press`是有限帧脉冲，完成后才回复，不适合持续按住。正式版用WebSocket广播观察vblank递减；master改为sceCtrl精确计数，存在实现差异，跨版本不建议靠它做逐帧精密回放。

## 模拟摇杆与轴方向

```json
{"event":"input.analog.send","stick":"left","x":0.5,"y":1,"ticket":13}
{"event":"input.analog.send","stick":"left","x":0,"y":0,"ticket":14}
```

- x/y两个字段均必需，必须有限数字、范围[-1,1]；stick可省略默认left，也允许right（原PSP仅一个物理摇杆，右轴用于扩展映射）。
- **向右x=+1，向上y=+1**。浏览器Pointer/Gamepad通常向下是正，因此`protocolY=-browserY`。
- 原因是[sceCtrl.cpp:296–304](https://github.com/hrydgard/ppsspp/blob/d20d388611395a1948c3092dcbdbba347d0e954f/Core/HLE/sceCtrl.cpp#L296) 将x映射`ceil(x*127.5+127.5)`，y映射`ceil(-y*127.5+127.5)`。
- 值写入后持续保持，不是单帧脉冲；每次变化发送，结束/取消/丢失焦点发0,0。切勿同时把摇杆变化映射成D-pad视觉按压。

## CPU暂停/恢复的异步处理

```json
{"event":"cpu.stepping","ticket":20}
{"event":"cpu.resume","ticket":21}
```

- [CPUCoreSubscriber.cpp:70–107](https://github.com/hrydgard/ppsspp/blob/d20d388611395a1948c3092dcbdbba347d0e954f/Core/Debugger/WebSocket/CPUCoreSubscriber.cpp#L70)：它们**不是同ticket即时回复**。实际进入对应状态后发送无ticket的`cpu.stepping` / `cpu.resume`广播。
- master可先发`{event:'client.config.set',acknowledgeDeferred:true,ticket:2}`。之后立即得到`{event:'deferred',for:'cpu.resume',ticket:21}`仅表示已接受，**不是恢复成功**；仍等广播或cpu.status确认。
- v1.20.4对此config事件返回未知事件，应降级继续连接。不能为等待一个永远不会出现的同ticket的cpu.resume响应而卡死。
- 如果已经在目标状态，未必产生新状态广播。先查询cpu.status，已stepping时无需再次pause；恢复后以`stepping:false`检查。用有界超时处理状态异常。

## 截图：关键限制与准确响应

[GPUBufferSubscriber.cpp:226–259](https://github.com/hrydgard/ppsspp/blob/d20d388611395a1948c3092dcbdbba347d0e954f/Core/Debugger/WebSocket/GPUBufferSubscriber.cpp#L226) 和正式版都检查：

```cpp
if (!currentDebugMIPS->isAlive()) Fail("CPU not started");
if (coreState != CORE_STEPPING_CPU && !GPUStepping::IsStepping())
  Fail("Neither CPU or GPU is stepping");
```

**运行中的游戏不能靠此API持续取帧。它不是无侵入高帧率画面订阅，不能宣传实时串流。** GPU stepping也会影响运行。频繁“暂停→截图→恢复”会改变游戏时序、音频和操控。

推荐只提供用户主动触发的**暂停截图**：先查询cpu.status，若运行则申请cpu.stepping，等状态确认，再截图。保持暂停便于检查；若设计需要恢复，应记录是不是本网页主动暂停，只恢复自己暂停的会话，不恢复用户原先已暂停的游戏。

### PNG，建议使用

```json
{"event":"gpu.buffer.screenshot","type":"uri","ticket":30}
```

回复：

```json
{"event":"gpu.buffer.screenshot","ticket":30,"width":480,"height":272,"uri":"data:image/png;base64,...","isFramebuffer":true}
```

- `type:'uri'`默认；字段名是`uri`，里面已经有`data:image/png;base64,`前缀，**不是`data`或`image`字段**。
- width/height随宿主渲染分辨率/实际缓冲变化，不强制480×272。`isFramebuffer`可缺失，只有true时写出。
- 可选`alpha:boolean`、`stackWidth:number`；普通屏幕截图不要启用。
- 底层WebSocket分片由浏览器自动重组为一个message，客户端正常JSON.parse即可，不自行把每个PNG段当消息。

### 原始像素，不是PNG

```json
{"event":"gpu.buffer.screenshot","type":"base64","ticket":31}
```

返回`width,height,flipped,format,base64,isFramebuffer?`。width是像素stride；format可能R8G8B8A8_UNORM、B8G8R8A8_UNORM等，还存在16位packed格式。不能直接添加PNG前缀显示，须正确解码颜色/stride/翻转。首版应只支持uri并验证前缀、尺寸与长度。

master对headless Vulkan没有backbuffer时会读显示帧缓冲；显示关闭时给480×272黑图。截图成功≠游戏真的在输出可玩的非黑画面。

## 音频与存档边界

- 本次完整WebSocket Subscriber目录与主注册表**无音频流订阅/PCM/WebRTC/视频编码事件**。日志/显存/内存API不能当成低延迟音频接口。连接模式声音来自原生PPSSPP扬声器；浏览器不能宣称播放了外部模拟器音频。
- master新增`game.state.save/load`以path或slot操作宿主PPSSPP文件，`wait:true`可等完成；它排队到下一CPU帧，CPU停住时需推进才能完成。正式版没有。不能把它和项目IndexedDB原生存档/即时存档混为同一存储。
- 连接模式不自动扫描磁盘、上传ROM、下载固件或启动商业游戏；由用户在原生PPSSPP打开自己的程序。

## macOS可获取构建（只调查，未安装）

- [正式发布v1.20.4](https://github.com/hrydgard/ppsspp/releases/tag/v1.20.4) 实际资产有 `PPSSPPSDL-macOS-v1.20.4.zip`，37,389,023bytes：[官方下载](https://github.com/hrydgard/ppsspp/releases/download/v1.20.4/PPSSPPSDL-macOS-v1.20.4.zip)。这里只取得发布元数据，未下载/运行该二进制，也未核验签名/架构。
- [Homebrew公式](https://formulae.brew.sh/formula/ppsspp) 默认1.20.4，`brew install ppsspp`；有AppleSilicon/Intel bottle。实际Formula安装PPSSPPSDL.app并提供`PPSSPPSDL`/`ppsspp`包装器，**没有安装PPSSPPHeadless步骤**。`brew install --HEAD ppsspp`跟master但不固定commit，不能当可复现验收。
- [官方开发构建页](https://dev.ppsspp.org/devbuilds/) 存在。直连获取403，web工具仅取得动态页框架，未确认当前Mac开发二进制准确URL/hash，不能编造“已取得最新dev Mac包”。
- 原生`PPSSPPHeadless`可从固定源码构建；官方[开发说明](https://www.ppsspp.org/docs/development/getting-started/)说明headless用于自动测试，传统模式无显示/音频。当前master支持headless graphics路径，需实际构建后验证，不是brew现成headless。
- 已有私有 `.research/core-survey/EBOOT.PBP`来自Saymond/PSP-apps v3.0（168,088bytes）和MIT notice，但对应tag仓库只包含README/LICENSE，缺少可复现程序源码。因此可用于已有私有调查，不提升为已审计可分发演示游戏。更适合的公开演示需另构建源码明确的homebrew。

## 最小验收

真实PPSSPP进程才算验收：连通并读取version/game.status；cross持续按下和释放由程序观察；摇杆向上/回中；同时键；blur释放；运行时截图返回明确stepping错误；主动暂停后PNG显示；恢复游戏推进。再验证断开/重新连接、正式版config未知事件降级。WebSocket假服务的协议测试只能证明前端解析与状态机，**不能报告原生联动已实测**。

私有来源/元数据放 `.research/ppsspp-protocol/`，固定提交如上。生产默认纯网页运行，无需安装原生依赖。
