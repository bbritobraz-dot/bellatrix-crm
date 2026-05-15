const fs = require('fs');
const path = 'c:\\Users\\bbrit\\OneDrive\\Área de Trabalho\\Bellatrix\\bellatrix-crm\\src\\components\\clients\\ClientsView.tsx';
const content = fs.readFileSync(path, 'utf8');

const tags = ['div', 'select', 'option', 'button', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'Link', 'Plus', 'Search', 'MapPin', 'Phone', 'Mail', 'Clock', 'LayoutList', 'KanbanSquare', 'X', 'Pencil', 'Copy', 'Check', 'Users', 'XCircle', 'Calendar'];

tags.forEach(tag => {
    const opened = (content.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
    const closed = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    const selfClosed = (content.match(new RegExp(`<${tag}[^>]*/>`, 'g')) || []).length;
    
    if (opened !== (closed + selfClosed)) {
        console.log(`Mismatch in tag ${tag}: opened=${opened}, closed=${closed}, self_closed=${selfClosed}`);
    }
});
console.log('Done');
