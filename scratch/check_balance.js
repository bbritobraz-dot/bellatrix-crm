const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\bbrit\\OneDrive\\Área de Trabalho\\Bellatrix\\bellatrix-crm\\src\\components\\quotes\\QuoteForm.tsx', 'utf8');

const divOpens = (content.match(/<div/g) || []).length;
const divCloses = (content.match(/<\/div>/g) || []).length;
const braceOpens = (content.match(/{/g) || []).length;
const braceCloses = (content.match(/}/g) || []).length;
const parenOpens = (content.match(/\(/g) || []).length;
const parenCloses = (content.match(/\)/g) || []).length;

console.log({
  divOpens,
  divCloses,
  braceOpens,
  braceCloses,
  parenOpens,
  parenCloses
});
