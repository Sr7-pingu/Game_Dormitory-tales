import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(projectRoot, 'dist');
const destination = join(projectRoot, 'dist-flat');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  }));
  return files.flat();
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const sourceFile of await filesIn(source)) {
  const fileName = sourceFile.split(/[\\/]/).at(-1);
  await cp(sourceFile, join(destination, fileName));
}

for (const fileName of ['index.html', 'index-DF1gIIYy.js', 'index-BAu_D-2J.css']) {
  const target = join(destination, fileName);
  const content = await readFile(target, 'utf8');
  await writeFile(target, content.replaceAll('/assets/', '/'));
}

console.log(`Created ${destination}`);
