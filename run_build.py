import subprocess

with open('clean_build_log.txt', 'w', encoding='utf-8') as f:
    result = subprocess.run(['.\\gradlew.bat', 'assembleDebug', '--console=plain'], 
                            cwd='d:/Projects/CyberShield/AndroidCode', 
                            stdout=subprocess.PIPE, 
                            stderr=subprocess.STDOUT,
                            text=True)
    f.write(result.stdout)
