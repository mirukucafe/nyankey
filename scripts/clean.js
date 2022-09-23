const fs = require('fs');

fs.rmSync(__dirname + '/../packages/backend/built', { recursive: true, force: true });
fs.rmSync(__dirname + '/../packages/backend/tsconfig.tsbuildinfo', { force: true });
fs.rmSync(__dirname + '/../packages/client/built', { recursive: true, force: true });
fs.rmSync(__dirname + '/../packages/foundkey-js/built', { recursive: true, force: true });
fs.rmSync(__dirname + '/../packages/sw/built', { recursive: true, force: true });
fs.rmSync(__dirname + '/../built', { recursive: true, force: true });
