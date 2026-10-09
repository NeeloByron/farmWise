import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const children = [
  spawn(process.execPath, ['backend/server.mjs'], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort'], { cwd: root + 'frontend', stdio: 'inherit' }),
];
let ending = false;
function stop(code = 0) { if (ending) return; ending = true; for (const child of children) child.kill(); process.exitCode = code; }
children.forEach(child => { child.on('error', error => { console.error(error.message); stop(1); }); child.on('exit', code => stop(code || 0)); });
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
