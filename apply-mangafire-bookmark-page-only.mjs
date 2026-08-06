import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve(
    'web/src/engine/websites/MangaFire.ts',
);

if(!fs.existsSync(target)) {
    throw new Error(`Fichier introuvable : ${target}`);
}

const source = fs.readFileSync(target, 'utf8');
const backup = `${target}.bookmark-page-only.bak`;

const startMarker = '    public override async FetchManga(';
const endMarker = '    public override async FetchChapters(';

const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if(start < 0 || end < 0) {
    throw new Error(
        'Impossible de localiser FetchManga dans MangaFire.ts.',
    );
}

const replacement = `    public override async FetchManga(
        provider: MangaPlugin,
        url: string
    ): Promise<Manga> {
        const uri = new URL(url);
        const slug = uri.pathname
            .match(/\\\\/title\\\\/([^/?#]+)/)
            ?.at(1);

        if(!slug) {
            throw new Error(
                \`Invalid MangaFire title URL: \${url}\`
            );
        }

        const identifier = slug
            .split('.')
            .at(-1);

        if(!identifier) {
            throw new Error(
                \`Unable to extract MangaFire identifier: \${url}\`
            );
        }

        /*
         * MangaFire now returns HTTP 403 for /api/titles/{id}.
         * Do not use that endpoint when a media URL is pasted.
         *
         * The title page remains accessible after the interactive
         * verification, so read the metadata directly from that page.
         */
        const metadata = await FetchWindowScript<{
            identifier: string;
            title: string;
        }>(
            new Request(uri),
            \`
            new Promise(resolve => {
                const normalize = value =>
                    String(value ?? '')
                        .replace(/\\\\s+/g, ' ')
                        .trim();

                const cleanTitle = value =>
                    normalize(value)
                        .replace(
                            /\\\\s*[-|]\\\\s*MangaFire\\\\s*$/i,
                            ''
                        )
                        .trim();

                const getTitle = () => {
                    const candidates = [
                        document.querySelector('h1')?.textContent,
                        document.querySelector(
                            'meta[property="og:title"]'
                        )?.content,
                        document.querySelector(
                            'meta[name="twitter:title"]'
                        )?.content,
                        document.title
                    ];

                    return candidates
                        .map(cleanTitle)
                        .find(value =>
                            value
                            && !/security check|verify you/i.test(value)
                        );
                };

                const started = Date.now();

                const poll = () => {
                    const title = getTitle();
                    const challengeActive =
                        location.pathname.includes('/@waf/challenge')
                        || /security check|verify you/i.test(
                            document.body?.innerText ?? ''
                        );

                    if(title && !challengeActive) {
                        resolve({
                            identifier: '${identifier}',
                            title
                        });
                        return;
                    }

                    if(Date.now() - started > 45_000) {
                        resolve({
                            identifier: '${identifier}',
                            title:
                                title
                                || '${slug}'
                                    .replace(/[._-]+/g, ' ')
                                    .trim()
                        });
                        return;
                    }

                    setTimeout(poll, 250);
                };

                poll();
            })
            \`,
            500,
            60_000
        );

        return new Manga(
            this,
            provider,
            metadata.identifier,
            metadata.title
        );
    }

`;

fs.writeFileSync(backup, source, 'utf8');
fs.writeFileSync(
    target,
    source.slice(0, start)
        + replacement
        + source.slice(end),
    'utf8',
);

console.log('Correctif MangaFire page-only appliqué.');
console.log(`Sauvegarde : ${backup}`);
console.log(`Fichier modifié : ${target}`);
