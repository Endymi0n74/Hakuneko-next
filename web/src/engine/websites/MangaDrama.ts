import { Tags } from '../Tags';
import icon from './MangaDrama.webp';
import {
    Fetch,
    FetchWindowScript
} from '../platform/FetchProvider';
import {
    DecoratableMangaScraper,
    Manga,
    Chapter,
    Page,
    type MangaPlugin
} from '../providers/MangaPlugin';
import * as Common from './decorators/Common';

type MangaDramaEntry = {
    id: string;
    title: string;
};

type MangaDramaChapter = {
    id: string;
    title: string;
};

@Common.ImageAjax()
export default class extends DecoratableMangaScraper {

    public constructor() {
        super(
            'mangadrama',
            'MangaDrama',
            'https://mangadrama.com',
            Tags.Language.English,
            Tags.Media.Manga,
            Tags.Media.Manhwa,
            Tags.Media.Manhua,
            Tags.Source.Aggregator
        );
    }

    public override get Icon() {
        return icon;
    }

    public override ValidateMangaURL(url: string): boolean {
        try {
            const uri = new URL(url);

            return uri.origin === this.URI.origin
                && /^\/manga\/[^/]+\/?$/.test(uri.pathname);
        } catch {
            return false;
        }
    }

    public override async FetchMangas(
        provider: MangaPlugin
    ): Promise<Manga[]> {
        const entries = await FetchWindowScript<MangaDramaEntry[]>(
            new Request(
                new URL('/manga/', this.URI)
            ),
            `
            new Promise(resolve => {
                const normalize = value =>
                    String(value ?? '')
                        .replace(/\\s+/g, ' ')
                        .trim();

                const getSlug = href => {
                    try {
                        return new URL(
                            href,
                            location.origin
                        ).pathname
                            .match(/^\\/manga\\/([^/]+)\\/?$/)
                            ?.at(1);
                    } catch {
                        return undefined;
                    }
                };

                const collect = () => {
                    const result = [];
                    const seen = new Set();

                    for(const anchor of document.querySelectorAll(
                        'a[href*="/manga/"]'
                    )) {
                        const id = getSlug(anchor.href);

                        if(!id || seen.has(id)) {
                            continue;
                        }

                        const container = anchor.closest(
                            'article, li, .item-summary, '
                            + '.page-item-detail, .row, .c-tabs-item__content'
                        );

                        const title = normalize(
                            anchor.getAttribute('title')
                            || anchor.textContent
                            || container?.querySelector(
                                'h1, h2, h3, h4, .post-title, .title'
                            )?.textContent
                        );

                        if(
                            !title
                            || /^manga$/i.test(title)
                            || title.length < 2
                        ) {
                            continue;
                        }

                        seen.add(id);
                        result.push({
                            id,
                            title
                        });
                    }

                    return result;
                };

                const started = Date.now();

                const poll = () => {
                    const entries = collect();

                    if(
                        entries.length > 0
                        || Date.now() - started > 15000
                    ) {
                        resolve(entries);
                    } else {
                        setTimeout(poll, 250);
                    }
                };

                poll();
            })
            `,
            500,
            30_000
        );

        return entries.map(
            ({ id, title }) =>
                new Manga(
                    this,
                    provider,
                    id,
                    title
                )
        );
    }

    public override async FetchManga(
        provider: MangaPlugin,
        url: string
    ): Promise<Manga> {
        const uri = new URL(url);
        const identifier = uri.pathname
            .match(/^\/manga\/([^/]+)\/?$/)
            ?.at(1);

        if(!identifier) {
            throw new Error(
                `Invalid MangaDrama URL: ${url}`
            );
        }

        const title = await FetchWindowScript<string>(
            new Request(uri),
            `
            new Promise(resolve => {
                const normalize = value =>
                    String(value ?? '')
                        .replace(/\\s+/g, ' ')
                        .trim();

                const clean = value =>
                    normalize(value)
                        .replace(
                            /\\s*[-|]\\s*Manga\\s*Drama\\s*$/i,
                            ''
                        )
                        .trim();

                const findTitle = () => [
                    document.querySelector('h1')?.textContent,
                    document.querySelector(
                        '.post-title h1, .post-title, .manga-title'
                    )?.textContent,
                    document.querySelector(
                        'meta[property="og:title"]'
                    )?.content,
                    document.title
                ]
                    .map(clean)
                    .find(Boolean);

                const started = Date.now();

                const poll = () => {
                    const title = findTitle();

                    if(
                        title
                        || Date.now() - started > 15000
                    ) {
                        resolve(
                            title
                            || '${identifier}'
                                .replace(/[-_]+/g, ' ')
                        );
                    } else {
                        setTimeout(poll, 250);
                    }
                };

                poll();
            })
            `,
            500,
            30_000
        );

        return new Manga(
            this,
            provider,
            identifier,
            title
        );
    }

    public override async FetchChapters(
        manga: Manga
    ): Promise<Chapter[]> {
        const chapters = await FetchWindowScript<MangaDramaChapter[]>(
            new Request(
                new URL(
                    `/manga/${manga.Identifier}/`,
                    this.URI
                )
            ),
            `
            new Promise(resolve => {
                const chapterRoot =
                    '/manga/${manga.Identifier}/';

                const extractChapter = href => {
                    try {
                        const uri = new URL(
                            href,
                            location.origin
                        );

                        if(
                            uri.origin !== location.origin
                            || !uri.pathname.startsWith(chapterRoot)
                        ) {
                            return undefined;
                        }

                        const id = decodeURIComponent(
                            uri.pathname
                                .slice(chapterRoot.length)
                                .replace(/^\\/+|\\/+$/g, '')
                        );

                        if(
                            !id
                            || /^read$/i.test(id)
                            || id === '${manga.Identifier}'
                        ) {
                            return undefined;
                        }

                        return id;
                    } catch {
                        return undefined;
                    }
                };

                const getChapterNumber = value => {
                    const match = String(value ?? '').match(
                        /(?:chapter|ch\\.?|episode|ep\\.?)?[-_\\s]*([0-9]+(?:\\.[0-9]+)?)/i
                    );

                    return match
                        ? Number.parseFloat(match[1])
                        : Number.NEGATIVE_INFINITY;
                };

                const formatChapterTitle = id => {
                    const normalized = String(id)
                        .replace(/[-_]+/g, ' ')
                        .replace(/\\s+/g, ' ')
                        .trim();

                    const match = normalized.match(
                        /^(?:chapter|ch\\.?|episode|ep\\.?)\\s*([0-9]+(?:\\.[0-9]+)?)(?:\\s+(.*))?$/i
                    );

                    if(!match) {
                        const number = getChapterNumber(normalized);

                        return Number.isFinite(number)
                            ? 'Chapter ' + number
                            : normalized;
                    }

                    const number = match[1];
                    const subtitle = String(match[2] ?? '')
                        .replace(
                            /^\\d+\\s+(?:minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\\b.*$/i,
                            ''
                        )
                        .trim();

                    return subtitle
                        ? 'Chapter ' + number + ' - ' + subtitle
                        : 'Chapter ' + number;
                };

                const collect = () => {
                    const result = [];
                    const seen = new Set();

                    const selectors = [
                        '.wp-manga-chapter a',
                        '.version-chap a',
                        '.chapter-link',
                        'a[href*="/chapter-"]',
                        'a[href*="/chapter/"]',
                        'a[href^="' + chapterRoot + '"]'
                    ].join(',');

                    for(const anchor of document.querySelectorAll(
                        selectors
                    )) {
                        const id = extractChapter(anchor.href);

                        if(!id || seen.has(id)) {
                            continue;
                        }

                        if(
                            !/(?:chapter|ch\\.?|episode|ep\\.?|\\d)/i
                                .test(id)
                        ) {
                            continue;
                        }

                        seen.add(id);
                        result.push({
                            id,
                            title: formatChapterTitle(id)
                        });
                    }

                    return result.sort(
                        (left, right) =>
                            getChapterNumber(right.id)
                            - getChapterNumber(left.id)
                    );
                };

                const started = Date.now();

                const poll = () => {
                    const result = collect();

                    if(
                        result.length > 0
                        || Date.now() - started > 20000
                    ) {
                        resolve(result);
                    } else {
                        setTimeout(poll, 300);
                    }
                };

                poll();
            })
            `,
            750,
            35_000
        );

        return chapters.map(
            ({ id, title }) =>
                new Chapter(
                    this,
                    manga,
                    id,
                    title,
                    Tags.Language.English
                )
        );
    }

    public override async FetchPages(
        chapter: Chapter
    ): Promise<Page[]> {
        const request = new Request(
            new URL(
                `/manga/${chapter.Parent.Identifier}/`
                + `${chapter.Identifier}/`,
                this.URI
            ),
            {
                headers: {
                    Accept: 'text/html,application/xhtml+xml',
                    Referer: this.URI.href
                }
            }
        );

        const response = await Fetch(request);
        const html = await response.text();

        const document = new DOMParser()
            .parseFromString(html, 'text/html');

        const root = document.querySelector('#chapter-content');

        if(!root) {
            throw new Error(
                'No readable pages were found for this MangaDrama chapter.'
            );
        }

        const urls: string[] = [];
        const seen = new Set<string>();

        for(const image of root.querySelectorAll('img')) {
            const candidates = [
                image.getAttribute('data-original-src'),
                image.getAttribute('data-src'),
                image.getAttribute('data-lazy-src'),
                image.getAttribute('data-original'),
                image.getAttribute('src')
            ];

            const value = candidates.find(
                candidate =>
                    candidate
                    && !candidate.startsWith('data:')
            );

            if(!value) {
                continue;
            }

            try {
                const url = new URL(
                    value
                        .replaceAll('&amp;', '&')
                        .trim(),
                    request.url
                );

                if(
                    !['http:', 'https:'].includes(url.protocol)
                    || seen.has(url.href)
                    || /(?:^|[\/_.-])(logo|avatar|icon|banner|ads?|emoji|spinner|loading)(?:[\/_.-]|$)/i
                        .test(url.href)
                ) {
                    continue;
                }

                seen.add(url.href);
                urls.push(url.href);
            } catch {
                // Ignore malformed image URLs.
            }
        }

        if(urls.length === 0) {
            const pageText = document.body?.textContent
                ?.replace(/\s+/g, ' ')
                .trim()
                .toLowerCase() ?? '';

            const locked =
                /premium|paywall|subscribe|subscription|purchase|buy|unlock|locked|members? only|login to read|sign in to read|coins?|credits?/
                    .test(pageText);

            throw new Error(
                locked
                    ? 'This MangaDrama chapter is locked or requires a paid account.'
                    : 'No readable pages were found for this MangaDrama chapter.'
            );
        }

        return urls.map(
            url =>
                new Page(
                    this,
                    chapter,
                    new URL(url),
                    {
                        Referer: request.url
                    }
                )
        );
    }

}
