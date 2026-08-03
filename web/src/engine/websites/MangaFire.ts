import { Tags } from '../Tags';
import icon from './MangaFire.webp';
import { FetchJSON, FetchWindowScript } from '../platform/FetchProvider';
import { DecoratableMangaScraper, Manga, Chapter, Page, type MangaPlugin } from '../providers/MangaPlugin';
import * as Common from './decorators/Common';

type APIResults<T> = {
    items: T[];
};

type APIManga = {
    hid: string;
    title: string;
};

type APIMangas = APIResults<APIManga>;

const chapterLanguageMap = new Map([
    ['en', Tags.Language.English],
    ['es', Tags.Language.Spanish],
    ['es-la', Tags.Language.Spanish],
    ['fr', Tags.Language.French],
    ['ja', Tags.Language.Japanese],
    ['pt-br', Tags.Language.Portuguese]
]);

@Common.ImageAjax()
export default class extends DecoratableMangaScraper {

    private readonly apiURL = `${this.URI.origin}/api/`;

    public constructor() {
        super('mangafire', 'MangaFire', 'https://mangafire.to', Tags.Language.English, Tags.Language.French, Tags.Language.Japanese, Tags.Language.Portuguese, Tags.Language.Spanish, Tags.Media.Manga, Tags.Media.Manhwa, Tags.Media.Manhua, Tags.Source.Aggregator);
    }

    public override get Icon() {
        return icon;
    }

    public override ValidateMangaURL(url: string): boolean {
        return new RegExpSafe(`^${this.URI.origin}/title/[^/]+$`).test(url);
    }

    public override async FetchMangas(provider: MangaPlugin): Promise<Manga[]> {
        type This = typeof this;
        return Array.fromAsync(async function* (this: This) {
            for (let page = 1, run = true; run; page++) {
                const { items } = await FetchJSON<APIMangas>(new Request(new URL(`./titles?page=${page}&limit=100`, this.apiURL)));
                const mangas = items.map(({ hid, title }) => new Manga(this, provider, hid, title));
                mangas.length > 0 ? yield* mangas : run = false;
            }
        }.call(this));
    }

    public override async FetchManga(provider: MangaPlugin, url: string): Promise<Manga> {
        const { data: { hid, title } } = await FetchJSON<{ data: APIManga }>(new Request(new URL(`./titles/${url.match(/\/title\/([^-]+)/).at(1)}`, this.apiURL)));
        return new Manga(this, provider, hid, title);
    }

    public override async FetchChapters(manga: Manga): Promise<Chapter[]> {
        type Row = { id: string; text: string; language: string };
        const rows = await FetchWindowScript<Row[]>(new Request(new URL(`./title/${manga.Identifier}`, this.URI)), `
            new Promise(resolve => {
                const extract = () => [...document.querySelectorAll('a[href*="/chapter/"]')].map(link => {
                    const id = (link.href.match(/\\/chapter\\/(\\d+)/) ?? [])[1];
                    const text = link.textContent?.replace(/\\s+/g, ' ')?.trim() ?? '';
                    const language = link.closest('.title-detail_row')?.querySelector('.title-detail_row-flag')?.title ?? 'en';
                    return { id, text, language };
                }).filter(row => row.id);
                const start = Date.now();
                const poll = () => {
                    const rows = extract();
                    if (rows.length > 0 || Date.now() - start > 8000) {
                        resolve(rows);
                    } else {
                        setTimeout(poll, 400);
                    }
                };
                poll();
            })
        `, 200);
        return rows.map(({ id, text, language }) => {
            const match = text.match(/^(Ch\.?\s*\d+(?:\.\d+)?)\s*(.*)$/i);
            const [ number, name ] = match ? [ match[1], match[2] ] : [ text, '' ];
            return new Chapter(this, manga, id, [number, name].joinTitleSegments(), ...[chapterLanguageMap.get(language)].filter(Boolean));
        });
    }

    public override async FetchPages(chapter: Chapter): Promise<Page[]> {
        const urls = await FetchWindowScript<string[]>(new Request(new URL(`./title/${chapter.Parent.Identifier}/chapter/${chapter.Identifier}`, this.URI)), `
            new Promise(resolve => {
                const extract = () => [...new Set(
                    [...document.querySelectorAll('img[src*="/manga/"], img[data-src*="/manga/"], .reader img, [class*="reader"] img, [class*="page"] img')]
                        .map(img => img.currentSrc || img.src || img.dataset.src)
                        .filter(src => src && !src.startsWith('data:'))
                )];
                const start = Date.now();
                const poll = () => {
                    const urls = extract();
                    if (urls.length > 0 || Date.now() - start > 8000) {
                        resolve(urls);
                    } else {
                        setTimeout(poll, 400);
                    }
                };
                poll();
            })
        `, 200);
        return urls.map(url => new Page(this, chapter, new URL(url), { Referer: this.URI.href }));
    }
}