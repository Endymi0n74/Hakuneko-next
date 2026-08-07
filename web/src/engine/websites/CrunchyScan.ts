import { Tags } from '../Tags';
import icon from './CrunchyScan.webp';
import { FetchWindowScript } from '../platform/FetchProvider';
import {
    DecoratableMangaScraper,
    Manga,
    Chapter,
    Page,
    type MangaPlugin
} from '../providers/MangaPlugin';
import * as Common from './decorators/Common';

@Common.ImageAjax()
export default class extends DecoratableMangaScraper {

    public constructor() {
        super(
            'crunchyscan',
            'CrunchyScan',
            'https://crunchyscan.fr',
            Tags.Language.French,
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
        return new RegExpSafe(
            `^${this.URI.origin}/lecture-en-ligne/[^/]+$`
        ).test(url);
    }

    public override async FetchMangas(
        provider: MangaPlugin
    ): Promise<Manga[]> {
        const mangas = await FetchWindowScript<{
            slug: string;
            title: string;
        }[]>(
            new Request(new URL('/manga', this.URI)),
            `
            (() => {
                const results = [];
                const seen = new Set();
                const re = new RegExp("/lecture-en-ligne/([^/?#]+)");
                for (const anchor of document.querySelectorAll('a')) {
                    const href = anchor.href || anchor.getAttribute('href') || '';
                    const match = re.exec(href);
                    if (!match) continue;
                    const slug = match[1];
                    if (seen.has(slug)) continue;
                    seen.add(slug);
                    const text = (anchor.textContent || "").replace(/\\s+/g, " ").trim();
                    const title = text || anchor.getAttribute("title") || slug;
                    if (title.length < 2) continue;
                    results.push({ slug, title });
                }
                return results;
            })()
            `,
            3_000,
            30_000
        );

        return mangas.map(
            ({ slug, title }) => new Manga(this, provider, slug, title)
        );
    }

    public override async FetchManga(
        provider: MangaPlugin,
        url: string
    ): Promise<Manga> {
        const data = await FetchWindowScript<{
            title: string;
            slug: string;
        }>(
            new Request(url),
            `
            (() => {
                const h1 = document.querySelector("h1");
                const title = h1 ? h1.textContent.trim() : document.title.split("\\u00BB")[0].trim();
                const re = new RegExp("/lecture-en-ligne/([^/?#]+)");
                const match = re.exec(location.pathname);
                const slug = match ? match[1] : "";
                return { title: title || "Unknown", slug };
            })()
            `,
            2_000,
            20_000
        );

        return new Manga(this, provider, data.slug, data.title);
    }

    public override async FetchChapters(
        manga: Manga
    ): Promise<Chapter[]> {
        const chapters = await FetchWindowScript<{
            id: string;
            title: string;
        }[]>(
            new Request(
                new URL('./lecture-en-ligne/' + manga.Identifier, this.URI)
            ),
            `
            (() => {
                const results = [];
                const seen = new Set();
                const re = new RegExp("/read/([^/?#]+)");
                for (const anchor of document.querySelectorAll("a")) {
                    const href = anchor.href || anchor.getAttribute("href") || "";
                    const match = re.exec(href);
                    if (!match) continue;
                    const id = match[1];
                    if (seen.has(id)) continue;
                    seen.add(id);
                    const text = (anchor.textContent || "").replace(/\\s+/g, " ").trim();
                    results.push({ id, title: text || id });
                }
                return results.reverse();
            })()
            `,
            2_000,
            30_000
        );

        return chapters.map(
            ({ id, title }) => new Chapter(this, manga, id, title)
        );
    }

    public override async FetchPages(
        chapter: Chapter
    ): Promise<Page[]> {
        const mangaUrl = new URL('./lecture-en-ligne/' + chapter.Parent.Identifier, this.URI).href;
        const chapterUrl = new URL(
            './lecture-en-ligne/' + chapter.Parent.Identifier + '/read/' + chapter.Identifier,
            this.URI
        ).href;

        const urls = await FetchWindowScript<string[]>(
            new Request(chapterUrl, {
                headers: {
                    'Referer': mangaUrl,
                    'Origin': 'https://crunchyscan.fr'
                }
            }),
            `
            new Promise((resolve, reject) => {
                if (location.pathname.includes('/adblock') || document.body?.innerText?.includes('adblock')) {
                    reject(new Error('Cloudflare protection active. Please reload the web server and solve the captcha.'));
                    return;
                }

                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

                // Intercepter les requêtes réseau pour capturer les URLs d'images
                const captures = [];
                const originalFetch = window.fetch.bind(window);
                window.fetch = async (...args) => {
                    const response = await originalFetch(...args);
                    try {
                        const input = args[0];
                        const url = typeof input === 'string' ? input : input?.url ?? response.url;
                        if (url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp'))) {
                            captures.push(url);
                        }
                    } catch {}
                    return response;
                };

                const isImage = (url) => {
                    const lower = url.toLowerCase();
                    return lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
                           lower.endsWith(".png") || lower.endsWith(".webp") ||
                           lower.endsWith(".gif") || lower.endsWith(".avif");
                };

                const extractAll = () => {
                    const results = [];
                    const seen = new Set();

                    // Images
                    for (const img of document.querySelectorAll("img")) {
                        const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
                        if (!src || src.startsWith("data:")) continue;
                        try {
                            const clean = new URL(src, location.href).href;
                            if (!seen.has(clean) && isImage(clean)) {
                                seen.add(clean);
                                results.push(clean);
                            }
                        } catch {}
                    }

                    // Background images
                    for (const el of document.querySelectorAll("*")) {
                        const style = el.getAttribute("style") || "";
                        const match = style.match(/url\\(["']?([^"')]+)["']?\\)/);
                        if (match) {
                            try {
                                const clean = new URL(match[1], location.href).href;
                                if (!seen.has(clean) && isImage(clean)) {
                                    seen.add(clean);
                                    results.push(clean);
                                }
                            } catch {}
                        }
                    }

                    return results;
                };

                // Simuler un clic sur le bouton de lecture si présent
                setTimeout(() => {
                    const buttons = [...document.querySelectorAll('button, a')];
                    const readBtn = buttons.find(b => {
                        const text = (b.textContent || "").toLowerCase();
                        return text.includes('page') || text.includes('lire') || text.includes('lecture');
                    });
                    if (readBtn) readBtn.click();
                }, 2000);

                let lastCount = -1;
                let stable = 0;
                const start = Date.now();

                const poll = () => {
                    if (location.pathname.includes('/adblock')) {
                        reject(new Error('Cloudflare protection active.'));
                        return;
                    }

                    window.scrollTo(0, document.body.scrollHeight);

                    const domImages = extractAll();
                    const allUrls = [...new Set([...captures, ...domImages])]
                        .filter(url => !url.includes('logo') && !url.includes('icon') && !url.includes('avatar'));

                    if (allUrls.length === lastCount) {
                        stable++;
                    } else {
                        stable = 0;
                        lastCount = allUrls.length;
                    }

                    if ((allUrls.length > 0 && stable >= 15) || Date.now() - start > 90000) {
                        resolve(allUrls);
                    } else {
                        setTimeout(poll, 1000);
                    }
                };

                setTimeout(poll, 5000);
            })
            `,
            8_000,
            120_000
        );

        return urls.reverse().map(
            url => new Page(this, chapter, new URL(url), { Referer: mangaUrl })
        );
    }
}
