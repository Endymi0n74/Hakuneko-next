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
                    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
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
                const title = h1 ? h1.textContent.trim() : document.title.split("\u00BB")[0].trim();
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
                    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
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
        const script = `
        (async () => {
            const delay = ms => new Promise(r => setTimeout(r, ms));

            // --- 1. Exécute le script reader ---
            const oldScript = document.querySelector('script[src*="/reader/reader-"]');
            const src = oldScript ? oldScript.getAttribute('src') : null;
            if (!src) return { error: 'Script reader non trouvé' };

            oldScript.remove();
            const newScript = document.createElement('script');
            newScript.src = src;
            newScript.async = false;

            await new Promise((resolve, reject) => {
                newScript.onload = resolve;
                newScript.onerror = reject;
                document.head.appendChild(newScript);
            });

            document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
            await delay(15000); // Attend WASM + allImg

            // --- 2. Récupère les données ---
            if (!window.allImg || window.allImg.length === 0) {
                return { error: 'allImg vide', allImg: window.allImg };
            }

            const fp = (() => { try { return getFingerprint(); } catch(e) { return 'roblox'; } })();
            const urls = window.allImg
                .filter(x => typeof x === 'string' && x.includes('http'))
                .map(url => url.replace(/&amp;/g, '&') + '&cid=' + encodeURIComponent(fp));

            console.log('[Hakuneko] URLs à télécharger:', urls.length);

            // --- 3. TÉLÉCHARGE DANS LE HEADLESS ---
            const base64Images = [];
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                try {
                    console.log('[Hakuneko] Téléchargement', i + 1, '/', urls.length);
                    const resp = await fetch(url, {
                        headers: {
                            'Accept': 'image/avif,image/webp,*/*',
                            'Referer': location.href,
                            'secs-ch-aa': '1'
                        }
                    });

                    if (!resp.ok) {
                        console.log('[Hakuneko] HTTP', resp.status, 'pour page', i);
                        continue;
                    }

                    const blob = await resp.blob();
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    base64Images.push(base64);
                    console.log('[Hakuneko] OK page', i, '-', Math.round(blob.size / 1024), 'Ko');

                } catch(e) {
                    console.log('[Hakuneko] Erreur page', i, ':', e.message);
                }

                // Petite pause entre les téléchargements
                await delay(200);
            }

            console.log('[Hakuneko] Total téléchargé:', base64Images.length, '/', urls.length);

            if (base64Images.length > 0) {
                return base64Images;
            }

            return { error: 'Aucun téléchargement réussi', urls: urls.length };
        })()
        `;

        const result = await FetchWindowScript<any>(
            new Request(
                new URL(
                    './lecture-en-ligne/' + chapter.Parent.Identifier + '/read/' + chapter.Identifier,
                    this.URI
                )
            ),
            script,
            1_000,
            600_000 // 10 min max
        );

        if (result && result.error) {
            throw new Error(`CrunchyScan: ${result.error} | urls=${result.urls || 'N/A'}`);
        }

        if (!result || !Array.isArray(result) || result.length === 0) {
            throw new Error('Aucune page trouvée pour ce chapitre.');
        }

        return result.map(url => new Page(this, chapter, new URL(url)));
    }
}
