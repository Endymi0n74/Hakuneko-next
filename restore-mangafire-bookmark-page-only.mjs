import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(
    'web/src/engine/websites/MangaFire.ts',
);
const backup = `${target}.bookmark-page-only.bak`;

if(!fs.existsSync(backup)) {
    throw new Error(`Sauvegarde introuvable : ${backup}`);
}

fs.copyFileSync(backup, target);
fs.rmSync(backup);

console.log('MangaFire.ts restauré.');
