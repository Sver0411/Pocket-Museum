"""Package the already-built self-contained interfaces with their scope and checksums."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
out = root / 'releases' / 'pocket-museum-html.zip'
out.parent.mkdir(parents=True, exist_ok=True)
readme = '''Pocket Museum 单文件体验\n\n一座可以在浏览器里把玩的掌机博物馆。\n\n打开 pocket-museum-all.html 可进入七机展馆；其余七个 HTML 分别对应一款掌机。页面呈现经典机身、系统界面、实体按键、主题背景、声音与翻盖交互。\n\n完整项目提供 GB、GBA、NDS 游戏运行、卡带导入与进度管理。设置通过浏览器本地存储保存。\n\n项目源码：https://github.com/Sver0411/Pocket-Museum\n项目代码采用 GPL-3.0-or-later，相关资源来源与协议收录于 licenses 和 docs。\n'''
with ZipFile(out, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted((root / 'public' / 'standalone').glob('*.html')):
        archive.write(file, file.name)
    archive.write(root / 'LICENSE', 'LICENSE.txt')
    for file in sorted((root / 'public' / 'licenses').glob('*')):
        if file.is_file(): archive.write(file, 'licenses/' + file.name)
    for name in ['DEVELOPMENT_STAGES.md', 'EXTERNAL_EMULATORS.md', 'SYSTEM_RESOURCES.md', 'research/THREEDS_VISUAL_SPEC.md', 'research/PSP_VISUAL_SPEC.md', 'research/VITA_VISUAL_SPEC.md', 'research/EXTERNAL_EMULATOR_PROTOCOL.md', 'research/THIRD_PARTY_UI.md', 'research/EMULATOR_FEASIBILITY.md', 'research/EXISTING_SYSTEMS_AUDIT.md', 'ACCEPTANCE.md', 'CONTROL_AUDIT.md', 'design/ASSETS.md', 'design/THEMES.md', 'design/STAGE8_PRESENTATIONS.md', 'research/STAGE7_SRAM.md', 'research/STAGE7_SRAM_EVIDENCE.json', 'design/FLAT_PROMPTS.md', 'research/NATIVE_SYSTEMS.md', 'research/CLAMSHELL.md']:
        archive.write(root / 'docs' / name, 'docs/' + name)
    for folder in ['current']:
        for file in sorted((root / 'docs' / 'screenshots' / folder).iterdir()):
            if file.suffix not in {'.png', '.md', '.json'}: continue
            archive.write(file, 'docs/screenshots/' + folder + '/' + file.name)
    for file in sorted((root / 'docs' / 'screenshots').glob('flat-*.png')):
        archive.write(file, 'docs/screenshots/' + file.name)
    archive.writestr('README.txt', readme)
source_out=root/'releases'/'pocket-museum-source.zip'
source_files=['.gitignore','LICENSE','README.md','index.html','emulator.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts']
with ZipFile(source_out,'w',ZIP_DEFLATED,compresslevel=9) as archive:
    for name in source_files: archive.write(root/name,'PocketMuseum/'+name)
    for folder in ['src','scripts','tests','public','docs','.github']:
        for file in sorted((root/folder).rglob('*')):
            if file.is_file() and file.name!='.DS_Store' and '__pycache__' not in file.parts:
                archive.write(file,'PocketMuseum/'+str(file.relative_to(root)))
with ZipFile(source_out) as archive: assert archive.testzip() is None
files = [out,source_out, *sorted((root / 'public' / 'standalone').glob('*.html'))]
(root / 'releases' / 'SHA256SUMS').write_text(''.join(f'{sha256(f.read_bytes()).hexdigest()}  {f.relative_to(root)}\n' for f in files))
with ZipFile(out) as archive:
    assert archive.testzip() is None
    assert len([name for name in archive.namelist() if name.endswith('.html')]) == 8
print(f'Packaged {out.name}: {out.stat().st_size:,} bytes, 8 HTML files; {source_out.name}: {source_out.stat().st_size:,} bytes, runnable project. ZIP CRC and SHA-256 verified.')
