const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\bbrit\\OneDrive\\Área de Trabalho\\Bellatrix\\bellatrix-crm\\src\\components\\quotes\\QuoteForm.tsx', 'utf8');

const lines = content.split('\n');
let balance = 0;
lines.forEach((line, i) => {
  const opens = (line.match(/<div(?!\/)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  balance += (opens - closes);
  if (opens > 0 || closes > 0) {
    // console.log(`Line ${i+1}: Opens ${opens}, Closes ${closes}, Balance ${balance}`);
  }
});

console.log('Final Balance:', balance);
