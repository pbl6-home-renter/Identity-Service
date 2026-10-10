#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let migrationName = 'NewMigration';
const extraArgs = [];

for (const arg of args) {
  if (arg.startsWith('name=')) {
    migrationName = arg.replace(/^name=/, '');
  } else if (arg.startsWith('--name=')) {
    migrationName = arg.replace(/^--name=/, '');
  } else if (!arg.startsWith('-') && !arg.includes('/')) {
    migrationName = arg;
  } else {
    extraArgs.push(arg);
  }
}

const targetDir = path.resolve(process.cwd(), 'src/migrations');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = migrationName.includes('/')
  ? migrationName
  : `src/migrations/${migrationName}`;

const cmd = 'npx';
const cmdArgs = [
  'typeorm-ts-node-commonjs',
  'migration:create',
  targetPath,
  ...extraArgs,
];

const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 0);

