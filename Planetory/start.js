import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================');
console.log(' Starting Planetory Server & Client ');
console.log('====================================\n');

const server = spawn('node', ['server/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

const client = spawn('node', ['./node_modules/vite/bin/vite.js', '--host'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('[Backend Error]:', err);
});

client.on('error', (err) => {
  console.error('[Frontend Error]:', err);
});

const cleanup = () => {
  server.kill();
  client.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
