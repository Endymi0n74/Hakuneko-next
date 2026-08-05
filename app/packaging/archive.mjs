import fs from 'node:fs/promises';
import { run } from '../tools.mjs';

/**
 * Create a ZIP containing the provided directory as its top-level folder.
 */
export async function createWindowsZip(sourceDirectory, destinationFile) {
    await fs.rm(destinationFile, { force: true });

    const command = [
        'powershell',
        '-NoProfile',
        '-Command',
        `"Compress-Archive`,
        `-LiteralPath '${sourceDirectory}'`,
        `-DestinationPath '${destinationFile}'`,
        '-CompressionLevel Optimal',
        '-Force"'
    ].join(' ');

    await run(command);
}
