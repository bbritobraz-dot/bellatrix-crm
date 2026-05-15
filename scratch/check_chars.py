import sys

file_path = r'c:\Users\bbrit\OneDrive\Área de Trabalho\Bellatrix\bellatrix-crm\src\components\clients\ClientsView.tsx'
with open(file_path, 'rb') as f:
    content = f.read()
    for i, byte in enumerate(content):
        if byte > 127:
            print(f"Non-ASCII byte {byte} at position {i}")

# Print around line 235
lines = content.decode('utf-8', errors='ignore').splitlines()
for i in range(max(0, 230), min(len(lines), 245)):
    print(f"{i+1}: {repr(lines[i])}")
