import { Tags } from '../Tags';
import icon from './MangaFire.webp';
import {
    FetchJSON,
    FetchWindowPreloadScript,
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

        const preload = `
        (() => {
            const captures = [];

            const store = (
                url,
                status,
                payload
            ) => {
                try {
                    const uri = new URL(
                        String(url),
                        location.origin
                    );

                    if(
                        !uri.pathname.includes(
                            '/api/titles/${manga.Identifier}/'
                        )
                        || (
                            !uri.pathname.endsWith('/chapters')
                            && !uri.pathname.endsWith('/volumes')
                        )
                    ) {
                        return;
                    }

                    captures.push({
                        url: uri.href,
                        status,
                        payload
                    });
                } catch {
                    // Ignore malformed and unrelated URLs.
                }
            };

            Object.defineProperty(
                window,
                '__hakunekoMangaFireCaptures',
                {
                    value: captures,
                    configurable: false,
                    writable: false
                }
            );

            const originalFetch =
                window.fetch.bind(window);

            window.fetch = async (...arguments_) => {
                const response =
                    await originalFetch(...arguments_);

                try {
                    const input = arguments_[0];

                    const url = typeof input === 'string'
                        ? input
                        : input?.url ?? response.url;

                    const payload =
                        await response.clone().json();

                    store(
                        url,
                        response.status,
                        payload
                    );
                } catch {
                    // Ignore non-JSON responses.
                }

                return response;
            };

            const originalOpen =
                XMLHttpRequest.prototype.open;

            const originalSend =
                XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(
                method,
                url,
                ...arguments_
            ) {
                this.__hakunekoMangaFireURL =
                    String(url);

                return originalOpen.call(
                    this,
                    method,
                    url,
                    ...arguments_
                );
            };

            XMLHttpRequest.prototype.send = function(
                ...arguments_
            ) {
                this.addEventListener('load', () => {
                    try {
                        store(
                            this.__hakunekoMangaFireURL
                                ?? this.responseURL,
                            this.status,
                            JSON.parse(this.responseText)
                        );
                    } catch {
                        // Ignore non-JSON responses.
                    }
                });

                return originalSend.apply(
                    this,
                    arguments_
                );
            };
        })();
        `;

        const rows = await FetchWindowPreloadScript<Row[]>(
            new Request(
                new URL(
                    `./title/${manga.Identifier}`,
                    this.URI
                )
            ),
            preload,
            `
            new Promise(async resolve => {
                const sleep = milliseconds =>
                    new Promise(done => setTimeout(done, milliseconds));

                const normalize = value =>
                    (value ?? '')
                        .replace(/\\s+/g, ' ')
                        .trim();

                const captures =
                    window.__hakunekoMangaFireCaptures
                    ?? [];

                const languages = [
                    { code: 'en', label: 'English' },
                    { code: 'fr', label: 'French' },
                    { code: 'ja', label: 'Japanese' },
                    { code: 'pt-br', label: 'Portuguese (Br)' },
                    { code: 'es', label: 'Spanish' }
                ];

                const waitForAnyCapture = async () => {
                    const started = Date.now();

                    while(Date.now() - started < 20000) {
                        if(captures.length > 0) {
                            return true;
                        }

                        await sleep(200);
                    }

                    return false;
                };

                const findLanguageTrigger = () => [
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

                    return languages.some(
                        language =>
                            text.includes(language.label)
                    );
                });

                const openLanguageMenu = async () => {
                    const existing = document.querySelector(
                        '.dropdown__menu[role="menu"]'
                    );

                    if(existing) {
                        return existing;
                    }

                    const started = Date.now();
                    let trigger;

                    while(
                        !trigger
                        && Date.now() - started < 10000
                    ) {
                        trigger = findLanguageTrigger();

                        if(!trigger) {
                            await sleep(200);
                        }
                    }

                    if(!trigger) {
                        return null;
                    }

                    trigger.click();

                    const menuStarted = Date.now();

                    while(Date.now() - menuStarted < 4000) {
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

                const waitForLanguageCapture = async (
                    code,
                    previousCount
                ) => {
                    const started = Date.now();

                    while(Date.now() - started < 15000) {
                        const matches = captures.filter(
                            capture => {
                                try {
                                    return new URL(
                                        capture.url
                                    ).searchParams.get('language')
                                        === code;
                                } catch {
                                    return false;
                                }
                            }
                        );

                        if(matches.length > previousCount) {
                            return true;
                        }

                        await sleep(200);
                    }

                    return false;
                };

                const selectLanguage = async language => {
                    const previousCount = captures.filter(
                        capture => {
                            try {
                                return new URL(
                                    capture.url
                                ).searchParams.get('language')
                                    === language.code;
                            } catch {
                                return false;
                            }
                        }
                    ).length;

                    const menu =
                        await openLanguageMenu();

                    if(!menu) {
                        return;
                    }

                    const option = [
                        ...menu.querySelectorAll(
                            'button.dropdown__item'
                        )
                    ].find(button =>
                        normalize(button.textContent)
                            .includes(language.label)
                    );

                    if(!option) {
                        return;
                    }

                    option.click();

                    await waitForLanguageCapture(
                        language.code,
                        previousCount
                    );
                };

                await waitForAnyCapture();

                for(const language of languages) {
                    try {
                        await selectLanguage(language);
                    } catch(error) {
                        console.warn(
                            '[HakuNeko] MangaFire language capture failed',
                            language.code,
                            error
                        );
                    }
                }

                const getObjects = payload => {
                    const objects = [];
                    const visited = new Set();

                    const walk = value => {
                        if(
                            !value
                            || typeof value !== 'object'
                            || visited.has(value)
                        ) {
                            return;
                        }

                        visited.add(value);

                        if(!Array.isArray(value)) {
                            objects.push(value);
                        }

                        for(const child of Object.values(value)) {
                            walk(child);
                        }
                    };

                    walk(payload);

                    return objects;
                };

                const getFirst = (
                    object,
                    names
                ) => {
                    for(const name of names) {
                        const value = object?.[name];

                        if(
                            value !== undefined
                            && value !== null
                            && value !== ''
                        ) {
                            return value;
                        }
                    }

                    return undefined;
                };

                const result = [];
                const seen = new Set();

                for(const capture of captures) {
                    if(
                        capture.status < 200
                        || capture.status >= 300
                    ) {
                        continue;
                    }

                    let language = 'en';

                    try {
                        language = new URL(
                            capture.url
                        ).searchParams.get('language')
                            ?? 'en';
                    } catch {
                        // Keep the English fallback.
                    }

                    for(const object of getObjects(
                        capture.payload
                    )) {
                        const id = getFirst(
                            object,
                            [
                                'id',
                                'hid',
                                'chapterId',
                                'chapter_id'
                            ]
                        );

                        const number = getFirst(
                            object,
                            [
                                'number',
                                'chapter',
                                'chapterNumber',
                                'chapter_number',
                                'no',
                                'num'
                            ]
                        );

                        if(
                            id === undefined
                            || number === undefined
                        ) {
                            continue;
                        }

                        const name = getFirst(
                            object,
                            [
                                'name',
                                'title',
                                'chapterName',
                                'chapter_name'
                            ]
                        );

                        const key =
                            language + '|' + id;

                        if(seen.has(key)) {
                            continue;
                        }

                        seen.add(key);

                        result.push({
                            id: String(id),
                            text: [
                                'Ch. ' + String(number),
                                name === undefined
                                    ? ''
                                    : String(name)
                            ]
                                .filter(Boolean)
                                .join(' - '),
                            language
                        });
                    }
                }

                console.log(
                    '[HakuNeko] MangaFire diagnostics',
                    {
                        href: location.href,
                        title: document.title,
                        body:
                            normalize(document.body?.innerText)
                                .slice(0, 300),
                        captureCount: captures.length,
                        captureURLs: captures.map(
                            capture => capture.url
                        ),
                        rowCount: result.length
                    }
                );

                resolve(result);
            })
            `,
            1500,
            120_000
        );

        return rows.map(
            ({
                id,
                text,
                language
            }) =>
                new Chapter(
                    this,
                    manga,
                    id,
                    text,
                    ...[
                        chapterLanguageMap.get(language)
                    ].filter(Boolean)
                )
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
