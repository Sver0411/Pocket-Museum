# 写实机身素材

使用内置 imagegen 工具生成，源文件保留在工具返回的 generated_images 目录；项目使用副本全部在 `public/assets/`，没有引用用户下载目录或工具私有目录。

| 机型 | 项目文件 |
| --- | --- |
| Game Boy | `public/assets/gb-v1.png` |
| GBA | `public/assets/gba-v1.png` |
| GBA SP | `public/assets/silver-sp-v2.png` |
| DS Lite | `public/assets/ds-v1.png` |
| 3DS | `public/assets/3ds-v1.png` |
| PSP | `public/assets/psp-v1.png` |
| PS Vita | `public/assets/vita-v1.png` |

SP 以用户提供的四机型拼图左下角的银色 SP 为形态参考；其他机型根据对应外观生成。目标是统一摄影风格，空白屏幕，不出现 Nintendo 字样或椭圆 Logo。原始生成图片未经有损压缩。网页使用轻微 blur / contrast 过滤减轻高频噪点，输入命中区单独保留，不会被滤镜改变。

## GBA SP 提示词

Use case: precise-object-edit. Project asset for a working browser handheld emulator. Extract ONLY the silver Game Boy Advance SP clamshell handheld from the BOTTOM LEFT quadrant of the reference. Re-render that single isolated device at premium, exceptionally photorealistic catalog/product photography quality, viewed directly from the centered front at the same slightly elevated angle: upper display upright, lower controls deck foreshortened, symmetric, open hinge. This must look like an actual original 2003 silver plastic AGS-001 with metallic silver paint, not a vector illustration, not smooth purple plastic, not a toy. Finely grained sprayed silver metallic finish, realistic molded seams, minute surface variation, precise machining-like edge highlights, dark graphite matte D-pad and A/B buttons, genuine physical raised buttons with realistic contact shadows, speaker perforations, rubber bumpers, visible cartridge slot. Neutral silver light, large softbox from upper left and subtle white rim fill, no purple tint. Keep the upper screen an EMPTY dark black flat glass rectangle in exactly 3:2 aspect, no game or software UI. Keep small physical A/B/START/SELECT labels and 'GAME BOY ADVANCE SP' below the display. REMOVE every Nintendo wordmark, oval logo, and other manufacturer logo. No typography outside the device. No background, no floor, no added drop shadow outside the cutout, no surrounding panels or UI. Transparent alpha background. Show the entire device with at least 6% transparent margin on every side. Portrait canvas. The asset will have real HTML screen and input hitboxes overlaid; keep every control sharply defined, its geometry simple, regular and predictable. Do not add buttons that are not on an AGS-001.

## 其他机型的共同提示词

Use case: product-mockup. A single isolated photorealistic {subject} This is a production transparent cutout asset for the PocketSP browser UI. Premium museum catalog product photography. Extremely realistic materials, finely textured original molded plastic, authentic geometry and spacing, physical button thickness, fine seams, tiny realistic molding details, softbox white highlights, natural contact shadows between parts, clear clean edges. Centered DIRECT front view, symmetric, for a clamshell camera slightly elevated so upper lid is upright and lower deck is foreshortened, otherwise very slightly elevated front view. Entire device visible with 6% transparent margin on every side. NO background, NO ground plane, NO extra cast shadow, NO UI or panels around it. No game graphics. Keep model names such as GAME BOY or PSP if appropriate, keep necessary physical button legends, but REMOVE ALL Nintendo manufacturer wordmarks and oval logos and ALL Sony manufacturer wordmarks. No additional titles or decorative text outside the device, no watermark. White balanced neutral studio lighting with a very subtle cool rim, no strong purple tint, not stylized, not vector, not an illustration. All screens are empty flat dark glass with a restrained realistic reflection. One device only.

{subject} 分别为：

- An original 1989 Game Boy DMG-01, warm light gray / ivory ABS plastic, dark charcoal screen bezel, dark D-pad, two burgundy A/B buttons, slanted Select and Start pills, speaker slits. Empty dark olive LCD.
- An original 2001 horizontal Game Boy Advance AGB-001, translucent atomic purple shell with internal circuit boards subtly visible, light gray D-pad and A/B buttons, Start and Select on the lower left, shoulder buttons and speaker slots on the right. Empty black display.
- An original white Nintendo DS Lite clamshell, opened, two EMPTY dark black screens, pearly white shell, silver-gray D-pad on the left, four face buttons X/Y/A/B on the right. Lower touchscreen and Start/Select buttons. White hinge.
- An original aqua blue / teal Nintendo 3DS clamshell opened, upper screen EMPTY black surrounded by glossy black bezel, lower touchscreen EMPTY black, teal painted shell, gray circle pad and D-pad, four teal face buttons.
- An original black PlayStation Portable PSP-1000, horizontal silhouette, detailed glossy black plastic, silver rounded shoulder trim, D-pad on the left, analog nub, triangle/circle/cross/square face buttons on the right, tiny Home, volume, Select/Start buttons along bottom. EMPTY black widescreen display.
- An original black PlayStation Vita PCH-1000, horizontal rounded oval silhouette, glossy black front, subtle chrome rim, two analog sticks, D-pad and triangle/circle/cross/square face buttons, EMPTY black widescreen display.

## 2026-11-10 外侧盖板与平铺

外侧盖板使用 `LidCover.tsx` 绘制的原生 SVG。SP 银色、DS 白色、3DS 青色分别配色；按当前底座轮廓收边，没有添加高频噪点。

平铺版已重做为三张独立的正交俯视图，使用内置 image_gen 工具、以相应半展开素材为机型与材质参考，要求自然尺寸、圆形按钮、共面外壳、透明背景，不对斜视底图做透视拉伸。项目副本为 `public/assets/sp-flat-v1.png`、`ds-flat-v1.png`、`3ds-flat-v1.png`。每张有独立屏幕与控件坐标；半展开仍保留原素材。完整生成提示词见 [FLAT_PROMPTS.md](FLAT_PROMPTS.md)，几何限度见 [CLAMSHELL.md](../research/CLAMSHELL.md)。
