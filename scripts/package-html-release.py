"""Package the already-built self-contained interfaces with their scope and checksums."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
out = root / 'releases' / 'pocketsp-html.zip'
out.parent.mkdir(parents=True, exist_ok=True)
readme = '''PocketSP 离线 HTML 交付\n\n双击 pocketsp-all.html 可在七台掌机之间切换；每个其他 HTML 对应一台掌机。\n文件内嵌机身图片、JS、CSS、交互控件、三种翻盖姿态与当前系统 UI，可断网运行。\n开机显示对应的无卡启动页或系统界面，实体方向/面键和触屏可以操作。\n\n这些文件不包含游戏模拟器核心。真实 GBA 游戏请用完整项目主页面的 GBA / GBA SP：选择卡带，再开启电源。\n完整 1:1 外壳和全部原版系统应用尚未完成。逐机覆盖、未完成项与官方资料见 docs/research/NATIVE_SYSTEMS.md。\n按用户要求排除 Nintendo 厂商 Logo。\n\n系统设置仅保存在本机浏览器。直接 file:// 打开时部分浏览器可能限制存储，但不影响基本界面操作。\n'''
with ZipFile(out, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted((root / 'public' / 'standalone').glob('*.html')):
        archive.write(file, file.name)
    archive.write(root / 'LICENSE', 'LICENSE.txt')
    for name in ['ACCEPTANCE.md', 'CONTROL_AUDIT.md', 'design/ASSETS.md', 'design/FLAT_PROMPTS.md', 'research/NATIVE_SYSTEMS.md', 'research/CLAMSHELL.md']:
        archive.write(root / 'docs' / name, 'docs/' + name)
    for folder in ['controls', 'systems', 'fold']:
        for file in sorted((root / 'docs' / 'screenshots' / folder).glob('*.png')):
            archive.write(file, 'docs/screenshots/' + folder + '/' + file.name)
    for file in sorted((root / 'docs' / 'screenshots').glob('flat-*.png')):
        archive.write(file, 'docs/screenshots/' + file.name)
    archive.writestr('README.txt', readme)
source_out=root/'releases'/'pocketsp-source.zip'
source_files=['.gitignore','LICENSE','README.md','index.html','emulator.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts']
with ZipFile(source_out,'w',ZIP_DEFLATED,compresslevel=9) as archive:
    for name in source_files: archive.write(root/name,'PocketSP/'+name)
    for folder in ['src','scripts','tests','public','docs']:
        for file in sorted((root/folder).rglob('*')):
            if file.is_file() and file.name!='.DS_Store' and '__pycache__' not in file.parts:
                archive.write(file,'PocketSP/'+str(file.relative_to(root)))
with ZipFile(source_out) as archive: assert archive.testzip() is None
files = [out,source_out, *sorted((root / 'public' / 'standalone').glob('*.html'))]
(root / 'releases' / 'SHA256SUMS').write_text(''.join(f'{sha256(f.read_bytes()).hexdigest()}  {f.relative_to(root)}\n' for f in files))
with ZipFile(out) as archive:
    assert archive.testzip() is None
    assert len([name for name in archive.namelist() if name.endswith('.html')]) == 8
print(f'Packaged {out.name}: {out.stat().st_size:,} bytes, 8 HTML files; {source_out.name}: {source_out.stat().st_size:,} bytes, runnable project. ZIP CRC and SHA-256 verified.')
