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
        throw new Error(
            'CrunchyScan uses a protected image delivery system that cannot be scraped with standard methods. '
            + 'Manga and chapter listing works, but page extraction is not yet supported. '
            + 'If Cloudflare blocks access, reload the web server (Ctrl+R) and solve the captcha.'
        );
    }
}
