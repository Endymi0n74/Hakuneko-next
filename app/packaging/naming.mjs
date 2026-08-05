export function sanitizeProductName(productName) {
    return productName
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '');
}

export function normalizeArchitecture(architecture) {
    switch(architecture?.toLowerCase()) {
        case 'ia32':
        case 'x86':
            return 'x86';

        case 'arm64':
            return 'ARM64';

        case 'amd64':
        case 'x64':
            return 'x64';

        default:
            return architecture ?? 'unknown';
    }
}

export function createWindowsArtifactName(productName, version, architecture) {
    const safeProductName = sanitizeProductName(productName);
    const normalizedArchitecture = normalizeArchitecture(architecture);

    return `${safeProductName}-v${version}-Windows-${normalizedArchitecture}.zip`;
}
