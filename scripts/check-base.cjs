const fs = require('fs');
const path = require('path');

const file = path.join('dist', 'dev-tracker', 'browser', 'index.html');
const html = fs.readFileSync(file, 'utf8');

if (/<base href="[^"]*github\.com[^"]*">/.test(html)) {
  console.error(
    '\nERROR: el <base href> del build apunta a github.com (URL del repo), no a GitHub Pages.\n' +
    '  Causa habitual: pasar `--base-href=https://github.com/...` al hacer deploy.\n' +
    '  Usa `npm run deploy` o `ng deploy` SIN ese flag.\n' +
    '  Deploy abortado para no publicar un sitio roto.\n'
  );
  process.exit(1);
}

console.log('base href correcto:', (html.match(/<base href="[^"]*">/) || [])[0]);