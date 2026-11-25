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
// Userscripts 4.x runs content scripts in Function('{GM,...}', code).
// A strict directive in a function with destructured parameters is a SyntaxError.
// Keep strict semantics inside the generated IIFE, not in the host wrapper.
const generated = result.outputFiles[0].text;
const strictPrefix = '"use strict";\n(() => {\n';
if (!generated.startsWith(strictPrefix)) {
  throw new Error('Unexpected bundle prefix; review Userscripts wrapper compatibility');
}
const body = '(() => {\n  "use strict";\n' + generated.slice(strictPrefix.length);
const script = header + '\n\n' + body;
// Syntax-only validation of the exact non-simple parameter style used by Userscripts.
new Function('{GM,GM_info,GM_xmlhttpRequest}', script);
if (!script.includes('clplens-fab') || !script.includes('parseAmount')) {
  throw new Error('Generated bundle is missing required runtime features');
}

const outputs = ['moncevia.user.js', 'extension/chromium/engine.js', 'extension/firefox/engine.js'];
// Userscripts Safari checks this dedicated metadata-only endpoint for updates.
// The installable payload remains moncevia.user.js (the downloadURL target).
const metaPath = resolve(root, 'moncevia.meta.js');
const metaScript = header + '\n';
if (checkOnly) {
  const existing = await readFile(metaPath, 'utf8');
  if (existing !== metaScript) {
    console.error('Generated metadata differs from source: moncevia.meta.js');
    process.exitCode = 1;
  }
} else {
  await writeFile(metaPath, metaScript, 'utf8');
  console.log('Built moncevia.meta.js metadata');
}
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
