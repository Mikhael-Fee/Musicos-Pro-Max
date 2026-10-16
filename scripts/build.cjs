const { cpSync, mkdirSync, rmSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
const output = resolve(root, 'dist');
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
cpSync(resolve(root, 'index.html'), resolve(output, 'index.html'));
cpSync(resolve(root, 'assets'), resolve(output, 'assets'), { recursive: true });
console.log('Site estático preparado em dist/: HTML, CSS, JavaScript e ícone.');
