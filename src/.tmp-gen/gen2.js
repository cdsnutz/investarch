import fs from 'node:fs';
import JSZip from 'jszip';
import { buildKitFiles } from '../lib/buildKit.js';

const seed = JSON.parse(fs.readFileSync('/tmp/seed.json', 'utf8'));
const files = buildKitFiles(seed, { repo_name: seed.repo_name });
const zip = new JSZip();
files.forEach((f) => zip.file(f.path, f.content, f.executable ? { unixPermissions: '755' } : undefined));
const buf = await zip.generateAsync({ type: 'nodebuffer', platform: 'UNIX' });
fs.writeFileSync('/tmp/modulex.zip', buf);
const backend = files.filter((f) => /^(server|database|tests)\//.test(f.path) || ['verify.sh', 'vitest.config.js'].includes(f.path));
console.log('TOTAL ' + files.length + ' files, zip ' + buf.length + ' bytes');
console.log('BACKEND:');
backend.forEach((f) => console.log('  ' + f.path + '  (' + f.content.split('\n').length + ' lines)'));