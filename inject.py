import json
import os

geojson_path = 'd:/Projects/CyberShield/AndroidCode/app/src/main/assets/countries.geojson'
html_path = 'd:/Projects/CyberShield/AndroidCode/app/src/main/assets/globe.html'

with open(geojson_path, 'r', encoding='utf-8') as f:
    geojson = f.read()

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('<script src="./countries.js"></script>', '<script>\nconst COUNTRIES_DATA = ' + geojson + ';\n</script>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Injection complete. globe.html updated.")
