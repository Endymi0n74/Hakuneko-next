<script lang="ts">
    import {
        Button,
        ContextMenu,
        ContextMenuDivider,
        ContextMenuGroup,
        ContextMenuOption,
        Dropdown,
        InlineNotification,
        Loading,
        Search,
    } from 'carbon-components-svelte';
    import ChevronSort from 'carbon-icons-svelte/lib/ChevronSort.svelte';
    import EarthFilled from 'carbon-icons-svelte/lib/EarthFilled.svelte';

    import { fade } from 'svelte/transition';

    import MediaComponent from './MediaItem.svelte';
    import { Store as UI } from '../stores/Stores.svelte';
    import { Tags, type Tag } from '../../../engine/Tags';
    const availableLanguageTags = Tags.Language.toArray();
    import { GlobalSettings } from '../stores/Settings.svelte';
    import { GetNextLocale } from '../lib/NextLocale';

    import type {
        StoreableMediaContainer,
        MediaItem,
        MediaContainer,
        MediaChild,
    } from '../../../engine/providers/MediaPlugin';
    import { FlagType } from '../../../engine/ItemflagManager';
    import { resizeBar } from '../lib/actions';
    import { Key as GlobalKey } from '../../../engine/SettingsGlobal';
    import type { Directory } from '../../../engine/SettingsManager';

    let nextLocale = $derived(GetNextLocale(GlobalSettings.LocaleID));

    let items: MediaContainer<MediaItem>[] = $state([]);
    let filteredItems: MediaContainer<MediaItem>[] = $state([]);
    let selectedItems: MediaContainer<MediaItem>[] = $state([]);
    let reverseSortOrder: boolean = $state(false);

    let loadItem: Promise<MediaContainer<MediaChild>> = $state();

    $effect(() => {
        loadItem = updateMedia(UI.selectedMedia);
    });

    async function updateMedia( media: MediaContainer<MediaChild> ): Promise<MediaContainer<MediaChild>> {
        items = [];
        selectedItems = [];
        if (media) {
            await media?.Update();
            items = media?.Entries.Value as MediaContainer<MediaItem>[];
        }
        return media;
    }

    $effect(() => {
        const position = filteredItems.indexOf(UI.selectedItem);
        UI.selectedItemPrevious = filteredItems[position + 1];
        UI.selectedItemNext = filteredItems[position - 1];
    });

    const onItemView = (item: MediaContainer<MediaItem>) => (event) => {
        if (item === UI.selectedItem || event.ctrlKey || event.shiftKey) return;
        UI.selectedItem = item;
    };

    let itemNameFilter = $state('');
    
    $effect(() => {
        filteredItems = items?.filter((item) => {
            let conditions: boolean[] = [];
            if (itemNameFilter)
                conditions.push(
                    item.Title.toLowerCase().indexOf(
                        itemNameFilter.toLowerCase(),
                    ) !== -1,
                );
            if (langFilter) conditions.push(item.Tags.Value.includes(langFilter));
            return conditions.every((condition) => condition);
        });
    });
    let showItems = $derived(reverseSortOrder ? filteredItems.toReversed() : filteredItems);

    let itemsdiv: HTMLElement = $state();

    let MediaLanguages: Tag[] = $derived(
        items.reduce((detectedLangaugeTags: Tag[], item) => {
            const undetectedLangaugeTags = item.Tags.Value.filter(
                (tag) =>
                    !detectedLangaugeTags.includes(tag) &&
                    availableLanguageTags.includes(tag),
            );
            return [...detectedLangaugeTags, ...undetectedLangaugeTags];
        }, [])
    );
        const LanguagePresentation: Record<
        string,
        { flag: string; label: string }
    > = {
        Multilingual: { flag: '🌐', label: 'Multilingual' },
        Arabic: { flag: '🇸🇦', label: 'العربية' },
        Chinese: { flag: '🇨🇳', label: '中文' },
        English: { flag: '🇬🇧', label: 'English' },
        French: { flag: '🇫🇷', label: 'Français' },
        German: { flag: '🇩🇪', label: 'Deutsch' },
        Indonesian: { flag: '🇮🇩', label: 'Bahasa Indonesia' },
        Italian: { flag: '🇮🇹', label: 'Italiano' },
        Japanese: { flag: '🇯🇵', label: '日本語' },
        Korean: { flag: '🇰🇷', label: '한국어' },
        Polish: { flag: '🇵🇱', label: 'Polski' },
        Portuguese: {
            flag: '🇧🇷',
            label: 'Português (Brasil)',
        },
        Russian: { flag: '🇷🇺', label: 'Русский' },
        Spanish: { flag: '🇪🇸', label: 'Español' },
        Thai: { flag: '🇹🇭', label: 'ไทย' },
        Turkish: { flag: '🇹🇷', label: 'Türkçe' },
        Vietnamese: { flag: '🇻🇳', label: 'Tiếng Việt' },
    };

    const PreferredLanguageOrder = [
        'French',
        'English',
        'Portuguese',
        'Spanish',
        'Japanese',
        'Korean',
        'Chinese',
        'German',
        'Italian',
        'Indonesian',
        'Polish',
        'Russian',
        'Turkish',
        'Vietnamese',
        'Thai',
        'Arabic',
        'Multilingual',
    ];

    function languageKey(language: Tag): string {
        return String(language.Title).split('_').at(-1)
            ?? String(language.Title);
    }

    function languageText(language: Tag): string {
        const presentation =
            LanguagePresentation[languageKey(language)];

        return presentation
            ? `${presentation.flag} ${presentation.label}`
            : GlobalSettings.Locale[language.Title]();
    }

    function languagePriority(language: Tag): number {
        const priority = PreferredLanguageOrder.indexOf(
            languageKey(language),
        );

        return priority === -1
            ? Number.MAX_SAFE_INTEGER
            : priority;
    }

    const hiddenLanguageStorageKey =
        'hakuneko-next.hidden-chapter-languages';

    function loadHiddenLanguages(): string[] {
        try {
            return JSON.parse(
                localStorage.getItem(hiddenLanguageStorageKey)
                    ?? '[]',
            );
        } catch {
            return [];
        }
    }

    let hiddenLanguageKeys: string[] =
        $state(loadHiddenLanguages());

    function isLanguageVisible(language: Tag): boolean {
        return !hiddenLanguageKeys.includes(
            languageKey(language),
        );
    }

    let langFilterID: '*' | Tag = $state('*');
    let langFilter = $derived(
        langFilterID === '*' ? null : langFilterID,
    );

    function saveHiddenLanguages(): void {
        localStorage.setItem(
            hiddenLanguageStorageKey,
            JSON.stringify(hiddenLanguageKeys),
        );
    }

    function setLanguageVisible(
        language: Tag,
        visible: boolean,
    ): void {
        const key = languageKey(language);

        hiddenLanguageKeys = visible
            ? hiddenLanguageKeys.filter(
                hidden => hidden !== key,
            )
            : [...new Set([
                ...hiddenLanguageKeys,
                key,
            ])];

        saveHiddenLanguages();

        if(!visible && langFilterID === language) {
            langFilterID = '*';
        }
    }

    function showAllLanguages(): void {
        hiddenLanguageKeys = [];
        saveHiddenLanguages();
    }

    function hideAllLanguages(): void {
        hiddenLanguageKeys =
            MediaLanguages.map(languageKey);

        saveHiddenLanguages();
        langFilterID = '*';
    }

    let OrderedMediaLanguages: Tag[] = $derived(
        [...MediaLanguages].sort((left, right) => {
            const priority =
                languagePriority(left)
                - languagePriority(right);

            return priority !== 0
                ? priority
                : languageText(left).localeCompare(
                    languageText(right),
                );
        }),
    );

    let VisibleMediaLanguages: Tag[] = $derived(
        OrderedMediaLanguages.filter(
            isLanguageVisible,
        ),
    );

    let allLanguagesText = $derived(
        `🌍 ${nextLocale.allLanguages} (${VisibleMediaLanguages.length}/${MediaLanguages.length})`,
    );

    let langComboboxItems = $derived(
        VisibleMediaLanguages.length > 0
            ? [
                {
                    id: '*',
                    text: allLanguagesText,
                },
                ...VisibleMediaLanguages.map(
                    language => ({
                        id: language,
                        text: languageText(language),
                    }),
                ),
            ]
            : [
                {
                    id: '*',
                    text: allLanguagesText,
                },
            ],
    );

    //Media Changed and the langFilter is no longer valid.
    $effect(()=>{
        if(items.length>0 && !MediaLanguages.includes(langFilter)) langFilterID = '*';
    });

    /*
     * Multi Item Selection
     * CTRL + click = individual add to selected list
     * SHIFT + click = sequencial group add from last click
     * Drag = multiple select from first mousedown
     */

    let multipleSelectionFrom: number = -1;
    let multipleSelectionTo: number = -1;

    let multipleSelectionDragFrom: number = -1;
    let multipleSelectionDragTo: number = -1;
    let selectedDragItems: MediaContainer<MediaItem>[] = [];
    let contextItem: MediaContainer<MediaItem> = $state();
    
    function onContextMenuClose() {
        contextItem = null;
    }
    const mouseHandler = (item: MediaContainer<MediaItem>) => (event: any) => {
        if (event.button === 2) {
            contextItem = item;
        }
        if (event.button === 0) {
            // left click
            switch (event.type) {
                case 'mousedown':
                    multipleSelectionDragFrom = filteredItems.indexOf(item);
                    multipleSelectionDragTo = -1;
                    selectedDragItems = [];
                    break;
                case 'mouseenter':
                    multipleSelectionDragTo = filteredItems.indexOf(item);
                    break;
                case 'mouseup':
                    multipleSelectionDragTo = filteredItems.indexOf(item);
                    onItemClick(event, item);
                    break;
            }
        }

        function onItemClick(
            event: MouseEvent,
            item: MediaContainer<MediaItem>,
        ) {
            if (multipleSelectionDragFrom !== multipleSelectionDragTo) {
                // multiple item
                filteredItems.forEach((item, index) => {
                    // Select all items between first and last drag
                    if (
                        (index >= multipleSelectionDragFrom &&
                            index <= multipleSelectionDragTo) ||
                        (index >= multipleSelectionDragTo &&
                            index <= multipleSelectionDragFrom)
                    )
                        selectedDragItems.push(item);
                });

                if (event.shiftKey || event.ctrlKey) {
                    // Merge & dedupe
                    selectedItems = [
                        ...new Set([...selectedItems, ...selectedDragItems]),
                    ];
                } else {
                    selectedItems = selectedDragItems;
                }
                selectedDragItems = [];
            } else {
                // click on item
                if (event.shiftKey) {
                    //range mode
                    if (multipleSelectionFrom === -1) {
                        multipleSelectionFrom = filteredItems.indexOf(item);
                        multipleSelectionTo = multipleSelectionFrom;
                        selectedItems = [item];
                    } else {
                        multipleSelectionTo = filteredItems.indexOf(item);
                        if (multipleSelectionFrom > multipleSelectionTo) {
                            const swap: number = multipleSelectionFrom;
                            multipleSelectionFrom = multipleSelectionTo;
                            multipleSelectionTo = swap;
                        }
                        selectedItems = filteredItems.slice(
                            multipleSelectionFrom,
                            multipleSelectionTo + 1,
                        );
                    }
                } else if (event.ctrlKey) {
                    //multiple mode
                    multipleSelectionFrom = filteredItems.indexOf(item);
                    multipleSelectionTo = -1;
                    if (selectedItems.includes(item))
                        selectedItems = selectedItems.filter(
                            (search) => search !== item,
                        );
                    else selectedItems = [...selectedItems, item];
                } else {
                    //single item
                    multipleSelectionFrom = filteredItems.indexOf(item);
                    multipleSelectionTo = multipleSelectionFrom;
                    selectedItems = [item];
                }
            }
        }
    };

    async function downloadItems(items: MediaContainer<MediaItem>[]) {
        try {
            await HakuNeko.SettingsManager.OpenScope().Get<Directory>(GlobalKey.MediaDirectory).EnsureAccess();
        } catch(error) {
            // TODO: Use appropriate error visualization ...
            alert(error?.message ?? error);
            return;
        }
        items.forEach(item => window.HakuNeko.DownloadManager.Enqueue(item as StoreableMediaContainer<MediaItem>));
    }

    function reverseSort() {
        reverseSortOrder = !reverseSortOrder;
    }
</script>

{#if filteredItems.length > 0}
    <ContextMenu target={[itemsdiv]} onclose={onContextMenuClose}>
        {#if contextItem}
            <ContextMenuOption
                labelText="Download - {contextItem?.Title}"
                shortcutText="⌘D"
                onclick={() => downloadItems([contextItem])}
            />
        {/if}
        {#if selectedItems.length > 1}
            <ContextMenuOption
                labelText="Download {selectedItems.length} selecteds"
                shortcutText="⌘S"
                onclick={() => downloadItems(selectedItems.toReversed())}
            />
        {/if}
        <ContextMenuOption
            labelText="Download all"
            shortcutText="⌘A"
            onclick={() => downloadItems(filteredItems.toReversed())}
        />
        {#if contextItem}
            <ContextMenuDivider />
            <ContextMenuOption
                labelText="View"
                shortcutText="⌘V"
                onclick={() => {
                    UI.selectedItem = contextItem;
                }}
            />
            <ContextMenuOption labelText="Flag as">
                <ContextMenuOption
                    labelText="Not viewed"
                    onclick={async () => {
                        window.HakuNeko.ItemflagManager.UnflagItem(contextItem);
                    }}
                />
                <ContextMenuOption
                    labelText="Viewed"
                    onclick={async () => {
                        window.HakuNeko.ItemflagManager.FlagItem(
                            contextItem,
                            FlagType.Viewed,
                        );
                    }}
                />
                <ContextMenuOption
                    labelText="Current"
                    onclick={async () => {
                        window.HakuNeko.ItemflagManager.FlagItem(
                            contextItem,
                            FlagType.Current,
                        );
                    }}
                />
            </ContextMenuOption>
            <ContextMenuOption labelText="Copy">
                <ContextMenuGroup labelText="Copy options">
                    <ContextMenuOption
                        id="url"
                        labelText="URL"
                        shortcutText="⌘C"
                    />
                    <ContextMenuOption
                        id="name"
                        labelText="name"
                        shortcutText="⌘N"
                    />
                </ContextMenuGroup>
            </ContextMenuOption>
        {/if}
    </ContextMenu>
{/if}

<div id="Item" transition:fade>
    <div id="ItemTitle">
        <h5>{nextLocale.itemList}</h5>
    </div>
    <div id="LanguageFilter">
        <Button
            icon={EarthFilled}
            size="small"
            tooltipPosition="bottom"
            tooltipAlignment="center"
            iconDescription="Languages"
        />

        <Dropdown
            disabled={VisibleMediaLanguages.length === 0}
            placeholder={nextLocale.allLanguages}
            bind:selectedId={langFilterID}
            size="sm"
            items={langComboboxItems}
        />

        <details id="LanguagePreferences">
            <summary title="Choose displayed languages">
                🌍
            </summary>

            <div class="language-preferences-menu">
                <div class="language-preferences-header">
                    <strong>
                        {nextLocale.displayedLanguages}
                        ({VisibleMediaLanguages.length}/{MediaLanguages.length})
                    </strong>

                    <div class="language-preferences-actions">
                        <button
                            type="button"
                            onclick={showAllLanguages}
                        >
                            {nextLocale.selectAll}
                        </button>

                        <button
                            type="button"
                            onclick={hideAllLanguages}
                        >
                            {nextLocale.selectNone}
                        </button>
                    </div>
                </div>

                {#each OrderedMediaLanguages as language}
                    <label>
                        <input
                            type="checkbox"
                            checked={isLanguageVisible(language)}
                            onchange={(event) =>
                                setLanguageVisible(
                                    language,
                                    event.currentTarget.checked,
                                )}
                        />
                        <span>{languageText(language)}</span>
                    </label>
                {/each}
            </div>
        </details>
    </div>
    <div id="ItemFilter">
        <Search id="ItemFilterSearch" size="sm" bind:value={itemNameFilter} />
    </div>
    <div id="ItemList" class="list" bind:this={itemsdiv}>
        {#await loadItem}
            <div class="loading center">
                <div><Loading withOverlay={false} /></div>
                <div>... items</div>
            </div>
        {:then}
            {#each showItems as item (item)}
                <MediaComponent
                    {item}
                    multilang={!langFilter && MediaLanguages.length > 1}
                    selected={selectedItems.includes(item)}
                    hover={item === contextItem}
                    onView={(event) => onItemView(item)(event.detail)}
                    onmousedown={mouseHandler(item)}
                    onmouseup={mouseHandler(item)}
                    onmouseenter={mouseHandler(item)}
                />
            {/each}
        {:catch error}
            <div class="error">
                <InlineNotification
                    lowContrast
                    title={error.name}
                    subtitle={error.message}
                />
            </div>
        {/await}
    </div>
    <div id="ItemBottom">
        {nextLocale.items}: {filteredItems.length}/{items.length}
        <Button
            size="small"
            kind="ghost"
            icon={ChevronSort}
            iconDescription="Reverse items sorting"
            onclick={reverseSort}
            style="float:right; padding:0; height:1.5em; min-height:1.5em">
        </Button>
    </div>
    <div 
        role="separator"
        aria-orientation="vertical"
        class="resize"
        use:resizeBar={{orientation:'vertical'}}
    ></div>
</div>

<style>
    #Item {
        display: grid;
        min-height: 0;
        height: 100%;
        grid-template-columns: 1fr 4px;
        grid-template-rows: 2.2em 2.2em 2.2em 1fr 2em;
        gap: 0.3em 0.3em;
        grid-template-areas:
            'ItemTitle Nothing'
            'LanguageFilter Resize'
            'ItemFilter Resize'
            'ItemList Resize'
            'ItemBottom Resize';
        grid-area: Item;
        min-width: 22em;
    }
    #LanguageFilter {
        grid-area: LanguageFilter;
        display: grid;
        grid-template-columns: auto 1fr auto;
        position: relative;
    }

    #LanguagePreferences {
        position: relative;
    }

    #LanguagePreferences > summary {
        align-items: center;
        cursor: pointer;
        display: flex;
        height: 100%;
        justify-content: center;
        list-style: none;
        min-width: 2.5rem;
        user-select: none;
    }

    #LanguagePreferences > summary::-webkit-details-marker {
        display: none;
    }

    .language-preferences-menu {
        background: var(--cds-layer);
        border: 1px solid var(--cds-border-subtle);
        box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 25%);
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        max-height: 24rem;
        min-width: 17rem;
        overflow-y: auto;
        padding: 0.8rem;
        position: absolute;
        right: 0;
        top: 100%;
        z-index: 500;
    }

    .language-preferences-header {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        margin-bottom: 0.35rem;
    }

    .language-preferences-actions {
        display: flex;
        gap: 0.25rem;
    }

    .language-preferences-actions button {
        background: transparent;
        border: 1px solid var(--cds-border-subtle);
        color: inherit;
        cursor: pointer;
        font: inherit;
        min-height: 1.65rem;
        padding: 0 0.45rem;
    }

    .language-preferences-actions button:hover {
        background: var(--cds-layer-hover);
    }

    .language-preferences-menu label {
        align-items: center;
        cursor: pointer;
        display: flex;
        gap: 0.55rem;
        min-height: 1.75rem;
        white-space: nowrap;
    }

    #ItemFilter {
        grid-area: ItemFilter;
    }
    #ItemList {
        grid-area: ItemList;
        background-color: var(--cds-field-01);
        overflow-x: hidden;
    }
    #ItemList .loading {
        width: 100%;
        height: 100%;
    }
    #ItemTitle {
        padding-top: 0.3em;
    }
    #ItemBottom {
        grid-area: ItemBottom;
        margin: 0.25em;
    }
    :global(#ItemList .list) {
        white-space: nowrap;
        list-style-type: none;
        padding: 0.25em;
    }
    .resize {
        grid-area: Resize;
        float:right;
        width:4px;
        cursor: col-resize;
    }
    .resize:hover {
            background-color:var(--cds-ui-02); 
    }
</style>
