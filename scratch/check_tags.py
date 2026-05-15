import re

file_path = r'c:\Users\bbrit\OneDrive\Área de Trabalho\Bellatrix\bellatrix-crm\src\components\clients\ClientsView.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count <div and </div>
open_divs = len(re.findall(r'<div', content))
close_divs = len(re.findall(r'</div', content))

print(f"Open divs: {open_divs}")
print(f"Close divs: {close_divs}")

# Check for other tags
tags = ['select', 'option', 'button', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'Link', 'Plus', 'Search', 'MapPin', 'Phone', 'Mail', 'Clock', 'LayoutList', 'KanbanSquare', 'X', 'Pencil', 'Copy', 'Check', 'Users', 'XCircle', 'Calendar']
for tag in tags:
    opened = len(re.findall(f'<{tag}', content))
    closed = len(re.findall(f'</{tag}', content))
    self_closed = len(re.findall(f'<{tag}[^>]*/>', content))
    if opened != (closed + self_closed):
        print(f"Mismatch in tag {tag}: opened={opened}, closed={closed}, self_closed={self_closed}")
