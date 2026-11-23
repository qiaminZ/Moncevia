import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const checkOnly = process.argv.includes('--check');
const header = (await readFile(resolve(root, 'src/meta/userscript.header.txt'), 'utf8')).trimEnd();
if (!header.startsWith('// ==UserScript==') || !header.includes('// ==/UserScript==')) {
  throw new Error('Invalid userscript metadata header');
}

const result = await build({
  absWorkingDir: root,
  entryPoints: ['src/entry/index.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  loader: { '.css': 'text' },
  write: false,
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'warning',
  outfile: 'moncevia.generated.js',
});
if (result.outputFiles?.length !== 1) throw new Error('Expected one JS bundle');
const script = header + '\n\n' + result.outputFiles[0].text;
if (!script.includes('clplens-fab') || !script.includes('parseAmount')) {
  throw new Error('Generated bundle is missing required runtime features');
}

const outputs = ['moncevia.user.js', 'extension/chromium/engine.js', 'extension/firefox/engine.js'];
let mismatch = false;
for (const file of outputs) {
  const path = resolve(root, file);
  if (checkOnly) {
    const original = await readFile(path, 'utf8');
    if (original !== script) {
      console.error('Generated artifact differs from source:', file);
      mismatch = true;
    }
  } else {
    await writeFile(path, script, 'utf8');
    console.log('Built', file, script.length, 'characters');
  }
}
if (mismatch) process.exitCode = 1;
