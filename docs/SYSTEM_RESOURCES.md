# 本地系统资源

原厂字体、图标、壁纸与 LiveArea 美术不包含在模拟器的开源代码许可中。公共版本使用按官方画面重建的资源，它们不能算作原厂逐像素相同。为使用自己有权使用的实际资源，3DS、PSP、Vita 的“更多”菜单可以导入一个本地文件夹。文件只进入当前浏览器的原有 `pocketsp` v2 设置表，不上传、不改变游戏存档格式；“恢复内置素材”可清除。

文件夹包含 `pocket-museum-theme.json` 及其引用的图片/字体。例：

```json
{
  "format": 1,
  "device": "vita",
  "icons": {
    "welcome": "icons/welcome.png",
    "browser": "icons/browser.png",
    "settings": "icons/settings.png"
  },
  "backgrounds": {
    "home": "home.png",
    "lock": "lock.png",
    "live:settings": "settings-livearea.png"
  },
  "font": "font.woff2"
}
```

`font`、`icons`、`backgrounds`、`banners` 均可省略。图片只接受 PNG、JPEG、WebP，单图最大8MiB，8–4096像素；字体只接受浏览器支持的 TTF、OTF、WOFF/WOFF2，最大4MiB；文件夹总计最大32MiB。只解析相对本地路径，不接受 URL、SVG、脚本或父目录路径。字体先实际解码成功，再保存与替换。

- Vita icon key 为 `welcome / store / browser / trophies / friends / messages / party / music / videos / photos / settings / content / remote / near`。背景用960×544原生尺寸。`live:settings` 是不含系统信息栏及交互门板的背景美术，系统仍实际交互；其他 `live:<appId>` 同理。
- PSP 类别图标用 `category:Settings / category:Photo / category:Music / category:Video / category:Game / category:Network / category:PlayStation Network`；一级条目使用 `item:System Settings`、`item:Memory Stick™` 等屏幕上的完整名称。类别图标画布64×48、普通条目按主题保留透明边。背景480×272。PGF不是浏览器字体，不能把扩展名改成TTF使用。
- 3DS 图标key为 `card / health / camera / sound / mii / plaza / ar / face / activity / download / shop / settings`。原生上屏 banner 可通过 `"banners":{"card":"top-card.png","camera":"top-camera.png"}` 提供；原生400×240。主界面下屏为320×240。

这里没有从固件自动解密/转换字体的功能，也不会下载/分发固件。导入实际美术可以保留其像素，但仍不能证明全部系统程序、动画与交互已经1:1。原版程序运行与用户素材渲染是不同能力，见三份 `*_VISUAL_SPEC.md`。
