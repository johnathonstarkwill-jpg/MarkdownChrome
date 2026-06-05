import { execFile } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const releaseEntries = [
  'manifest.json',
  'src',
  'vendor',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

export function getReleaseEntries() {
  return [...releaseEntries];
}

export function getReleaseZipName(version) {
  return `markdown-chrome-${version}.zip`;
}

export async function readManifestVersion(manifestPath = 'manifest.json') {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  return manifest.version;
}

export async function buildReleaseZip({ cwd = process.cwd() } = {}) {
  const version = await readManifestVersion(join(cwd, 'manifest.json'));
  const zipPath = join(cwd, 'dist', getReleaseZipName(version));

  await mkdir(join(cwd, 'dist'), { recursive: true });
  await rm(zipPath, { force: true });
  await execFileAsync('zip', ['-qr', zipPath, ...releaseEntries], { cwd });

  return zipPath;
}

const isDirectRun = basename(fileURLToPath(import.meta.url)) === basename(process.argv[1] || '');

if (isDirectRun) {
  const zipPath = await buildReleaseZip();
  console.log(`Created ${zipPath}`);
}
