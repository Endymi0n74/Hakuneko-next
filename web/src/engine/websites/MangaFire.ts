import { Tags } from '../Tags';
import icon from './MangaFire.webp';
import { FetchJSON, FetchWindowScript } from '../platform/FetchProvider';
import {
    DecoratableMangaScraper,
    Manga,
    Chapter,
    Page,
    type MangaPlugin
} from '../providers/MangaPlugin';
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
        super(
            'mangafire',
            'MangaFire',
            'https://mangafire.to',
            Tags.Language.English,
            Tags.Language.French,
            Tags.Language.Japanese,
            Tags.Language.Portuguese,
            Tags.Language.Spanish,
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
            `^${this.URI.origin}/title/[^/]+$`
        ).test(url);
    }

    public override async FetchMangas(
        provider: MangaPlugin
    ): Promise<Manga[]> {
        type This = typeof this;

        return Array.fromAsync(async function* (this: This) {
            for(let page = 1, run = true; run; page++) {
                const { items } = await FetchJSON<APIMangas>(
                    new Request(
                        new URL(
                            `./titles?page=${page}&limit=100`,
                            this.apiURL
                        )
                    )
                );

                const mangas = items.map(
                    ({ hid, title }) =>
                        new Manga(
                            this,
                            provider,
                            hid,
                            title
                        )
                );

                mangas.length > 0
                    ? yield* mangas
                    : run = false;
            }
        }.call(this));
    }

    public override async FetchManga(
        provider: MangaPlugin,
        url: string
    ): Promise<Manga> {
        const {
            data: {
                hid,
                title
            }
        } = await FetchJSON<{
            data: APIManga
        }>(
            new Request(
                new URL(
                    `./titles/${url.match(/\/title\/([^-]+)/).at(1)}`,
                    this.apiURL
                )
            )
        );

        return new Manga(
            this,
            provider,
            hid,
            title
        );
    }

    public override async FetchChapters(
        manga: Manga
    ): Promise<Chapter[]> {
        type Row = {
            id: string;
            text: string;
            language: string;
        };

        const rows = await FetchWindowScript<Row[]>(
            new Request(
                new URL(
                    `./title/${manga.Identifier}`,
                    this.URI
                )
            ),
            `
            new Promise(async resolve => {
                const sleep = milliseconds =>
                    new Promise(done => setTimeout(done, milliseconds));

                const languageButtons = [
                    { code: 'en', text: 'English' },
                    { code: 'fr', text: 'French' },
                    { code: 'ja', text: 'Japanese' },
                    { code: 'pt-br', text: 'Portuguese (Br)' }
                ];

                const normalize = value =>
                    (value ?? '')
                        .replace(/\\s+/g, ' ')
                        .trim();

                const extract = language => [
                    ...document.querySelectorAll(
                        'a[href*="/chapter/"], a[href*="/chapter-"]'
                    )
                ]
                    .map(link => {
                        const href =
                            link.getAttribute('href')
                            ?? link.href
                            ?? '';

                        const id = (
                            href.match(/\\/chapter\\/(\\d+)/)
                            ?? href.match(/chapter-(\\d+)/)
                            ?? []
                        )[1];

                        const text = normalize(
                            link.textContent
                        );

                        return {
                            id,
                            text,
                            language
                        };
                    })
                    .filter(row => row.id && row.text);

                const signature = rows =>
                    rows
                        .slice(0, 5)
                        .map(row => row.id + '|' + row.text)
                        .join('||');

                const waitForLanguage = async (
                    language,
                    beforeSignature
                ) => {
                    const start = Date.now();

                    while(Date.now() - start < 10000) {
                        const rows = extract(language);

                        const requestSeen = performance
                            .getEntriesByType('resource')
                            .some(entry => {
                                if(
                                    !entry.name.includes(
                                        '/api/titles/${manga.Identifier}/chapters?'
                                    )
                                ) {
                                    return false;
                                }

                                return new URL(entry.name)
                                    .searchParams
                                    .get('language') === language;
                            });

                        if(
                            rows.length > 0
                            && (
                                requestSeen
                                || signature(rows) !== beforeSignature
                            )
                        ) {
                            return rows;
                        }

                        await sleep(250);
                    }

                    return [];
                };

                const getDropdownTrigger = () => {
                    return [
                        ...document.querySelectorAll('button')
                    ].find(button => {
                        if(
                            button.closest(
                                '.dropdown__menu[role="menu"]'
                            )
                        ) {
                            return false;
                        }

                        const text = normalize(
                            button.textContent
                        );

                        return languageButtons.some(
                            language =>
                                text.includes(language.text)
                        );
                    });
                };

                const openDropdown = async () => {
                    const existing = document.querySelector(
                        '.dropdown__menu[role="menu"]'
                    );

                    if(existing) {
                        return existing;
                    }

                    const trigger = getDropdownTrigger();

                    if(!trigger) {
                        return null;
                    }

                    trigger.click();

                    const start = Date.now();

                    while(Date.now() - start < 3000) {
                        const menu = document.querySelector(
                            '.dropdown__menu[role="menu"]'
                        );

                        if(menu) {
                            return menu;
                        }

                        await sleep(100);
                    }

                    return null;
                };

                const selectLanguage = async language => {
                    const beforeRows = extract(language.code);
                    const beforeSignature = signature(beforeRows);

                    const menu = await openDropdown();

                    if(!menu) {
                        return [];
                    }

                    const option = [
                        ...menu.querySelectorAll(
                            'button.dropdown__item'
                        )
                    ].find(button =>
                        normalize(button.textContent)
                            .includes(language.text)
                    );

                    if(!option) {
                        return [];
                    }

                    option.click();

                    return waitForLanguage(
                        language.code,
                        beforeSignature
                    );
                };

                const result = [];
                const seen = new Set();

                const append = rows => {
                    for(const row of rows) {
                        const key =
                            row.language + '|' + row.id;

                        if(!seen.has(key)) {
                            seen.add(key);
                            result.push(row);
                        }
                    }
                };

                /*
                 * Preserve the language initially shown by MangaFire.
                 */
                const initialRows = extract('en');
                append(initialRows);

                /*
                 * Then load each real dropdown option using the exact DOM
                 * structure currently used by MangaFire:
                 *
                 * .dropdown__menu[role="menu"]
                 * button.dropdown__item
                 */
                for(const language of languageButtons) {
                    try {
                        append(
                            await selectLanguage(language)
                        );
                    } catch {
                        // Keep every language already collected.
                    }
                }

                resolve(result);
            })
            `,
            200
        );

        return rows.map(
            ({
                id,
                text,
                language
            }) => {
                const match = text.match(
                    /^(Ch\.?\s*\d+(?:\.\d+)?)\s*(.*)$/i
                );

                const [
                    number,
                    name
                ] = match
                    ? [
                        match[1],
                        match[2]
                    ]
                    : [
                        text,
                        ''
                    ];

                return new Chapter(
                    this,
                    manga,
                    id,
                    [
                        number,
                        name
                    ].joinTitleSegments(),
                    ...[
                        chapterLanguageMap.get(language)
                    ].filter(Boolean)
                );
            }
        );
    }

    public override async FetchPages(
        chapter: Chapter
    ): Promise<Page[]> {
        const urls = await FetchWindowScript<string[]>(
            new Request(
                new URL(
                    `./title/${chapter.Parent.Identifier}`
                    + `/chapter/${chapter.Identifier}`,
                    this.URI
                )
            ),
            `
            new Promise(resolve => {
                const extract = () => [
                    ...new Set(
                        [
                            ...document.querySelectorAll(
                                'img[src*="/manga/"], '
                                + 'img[data-src*="/manga/"], '
                                + '.reader img, '
                                + '[class*="reader"] img, '
                                + '[class*="page"] img'
                            )
                        ]
                            .map(
                                image =>
                                    image.currentSrc
                                    || image.src
                                    || image.dataset.src
                            )
                            .filter(
                                source =>
                                    source
                                    && !source.startsWith('data:')
                            )
                    )
                ];

                const start = Date.now();

                const poll = () => {
                    const urls = extract();

                    if(
                        urls.length > 0
                        || Date.now() - start > 8000
                    ) {
                        resolve(urls);
                    } else {
                        setTimeout(poll, 400);
                    }
                };

                poll();
            })
            `,
            200
        );

        return urls.map(
            url =>
                new Page(
                    this,
                    chapter,
                    new URL(url),
                    {
                        Referer: this.URI.href
                    }
                )
        );
    }
}
