const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const targets = [
  'app.js',
  'migrate.js',
  'config',
  'controllers',
  'middlewares',
  'models',
  'routes',
  'utils',
  'src/scripts',
];

const collectJavaScriptFiles = (targetPath) => {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return targetPath.endsWith('.js') ? [targetPath] : [];

  return fs.readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(targetPath, entry.name);
    return entry.isDirectory()
      ? collectJavaScriptFiles(entryPath)
      : entry.name.endsWith('.js')
        ? [entryPath]
        : [];
  });
};

const files = targets.flatMap((target) => collectJavaScriptFiles(path.join(root, target)));

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax check berhasil untuk ${files.length} file JavaScript.`);
