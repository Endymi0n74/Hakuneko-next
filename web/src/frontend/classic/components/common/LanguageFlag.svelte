<script lang="ts">
    import { Tags, type Tag } from '../../../../engine/Tags';
    import { GlobalSettings } from '../../stores/Settings.svelte';

    interface Props {
        tags: ReadonlyArray<Tag>;
    }

    let { tags }: Props = $props();

    const availableLanguages = Tags.Language.toArray();

    let languageTag = $derived(
        tags.find(tag => availableLanguages.includes(tag))
    );

    let languageName = $derived(
        languageTag
            ? GlobalSettings.Locale[languageTag.Title]?.call(undefined)
                ?.replace(/^\p{Regional_Indicator}{2,4}\s*/u, '')
                ?? 'Langue inconnue'
            : 'Langue inconnue'
    );

    let language = $derived.by(() => {
        switch(languageTag) {
            case Tags.Language.Arabic:
                return 'sa';
            case Tags.Language.Chinese:
                return 'cn';
            case Tags.Language.English:
                return 'gb';
            case Tags.Language.French:
                return 'fr';
            case Tags.Language.German:
                return 'de';
            case Tags.Language.Indonesian:
                return 'id';
            case Tags.Language.Italian:
                return 'it';
            case Tags.Language.Japanese:
                return 'jp';
            case Tags.Language.Korean:
                return 'kr';
            case Tags.Language.Polish:
                return 'pl';
            case Tags.Language.Portuguese:
                return 'pt';
            case Tags.Language.Russian:
                return 'ru';
            case Tags.Language.Spanish:
                return 'es';
            case Tags.Language.Thai:
                return 'th';
            case Tags.Language.Turkish:
                return 'tr';
            case Tags.Language.Vietnamese:
                return 'vn';
            case Tags.Language.Multilingual:
                return 'multi';
            default:
                return 'unknown';
        }
    });
</script>

<span class="language-flag" title={languageName} aria-label={languageName}>
    <svg viewBox="0 0 24 16" role="img" aria-hidden="true">
        {#if language === 'fr'}
            <rect width="8" height="16" fill="#0055a4"/>
            <rect x="8" width="8" height="16" fill="#fff"/>
            <rect x="16" width="8" height="16" fill="#ef4135"/>
        {:else if language === 'gb'}
            <rect width="24" height="16" fill="#012169"/>
            <path d="M0 0L24 16M24 0L0 16" stroke="#fff" stroke-width="4"/>
            <path d="M0 0L24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.8"/>
            <path d="M12 0V16M0 8H24" stroke="#fff" stroke-width="5"/>
            <path d="M12 0V16M0 8H24" stroke="#c8102e" stroke-width="2.6"/>
        {:else if language === 'es'}
            <rect width="24" height="16" fill="#aa151b"/>
            <rect y="4" width="24" height="8" fill="#f1bf00"/>
            <rect x="6" y="6" width="2" height="4" fill="#aa151b"/>
        {:else if language === 'de'}
            <rect width="24" height="5.34" fill="#000"/>
            <rect y="5.33" width="24" height="5.34" fill="#dd0000"/>
            <rect y="10.66" width="24" height="5.34" fill="#ffce00"/>
        {:else if language === 'it'}
            <rect width="8" height="16" fill="#009246"/>
            <rect x="8" width="8" height="16" fill="#fff"/>
            <rect x="16" width="8" height="16" fill="#ce2b37"/>
        {:else if language === 'id'}
            <rect width="24" height="8" fill="#e70011"/>
            <rect y="8" width="24" height="8" fill="#fff"/>
        {:else if language === 'pl'}
            <rect width="24" height="8" fill="#fff"/>
            <rect y="8" width="24" height="8" fill="#dc143c"/>
        {:else if language === 'ru'}
            <rect width="24" height="5.34" fill="#fff"/>
            <rect y="5.33" width="24" height="5.34" fill="#0039a6"/>
            <rect y="10.66" width="24" height="5.34" fill="#d52b1e"/>
        {:else if language === 'jp'}
            <rect width="24" height="16" fill="#fff"/>
            <circle cx="12" cy="8" r="4" fill="#bc002d"/>
        {:else if language === 'cn'}
            <rect width="24" height="16" fill="#de2910"/>
            <path d="M4 2.2l.7 2.1h2.2L5.1 5.6l.7 2.1L4 6.4 2.2 7.7l.7-2.1-1.8-1.3h2.2z" fill="#ffde00"/>
        {:else if language === 'vn'}
            <rect width="24" height="16" fill="#da251d"/>
            <path d="M12 3l1.2 3.4h3.6l-2.9 2.1 1.1 3.5-3-2.1-3 2.1 1.1-3.5-2.9-2.1h3.6z" fill="#ff0"/>
        {:else if language === 'tr'}
            <rect width="24" height="16" fill="#e30a17"/>
            <circle cx="9" cy="8" r="4" fill="#fff"/>
            <circle cx="10.3" cy="8" r="3.2" fill="#e30a17"/>
            <path d="M14.2 5.8l.6 1.4 1.5.1-1.2 1 .4 1.5-1.3-.8-1.3.8.4-1.5-1.2-1 1.5-.1z" fill="#fff"/>
        {:else if language === 'th'}
            <rect width="24" height="16" fill="#a51931"/>
            <rect y="2.7" width="24" height="10.6" fill="#fff"/>
            <rect y="5.3" width="24" height="5.4" fill="#2d2a4a"/>
        {:else if language === 'pt'}
            <rect width="9.5" height="16" fill="#046a38"/>
            <rect x="9.5" width="14.5" height="16" fill="#da291c"/>
            <circle cx="9.5" cy="8" r="2.7" fill="#ffcd00"/>
        {:else if language === 'kr'}
            <rect width="24" height="16" fill="#fff"/>
            <path d="M12 4a4 4 0 0 1 0 8 2 2 0 0 0 0-4 2 2 0 0 1 0-4z" fill="#cd2e3a"/>
            <path d="M12 12a4 4 0 0 1 0-8 2 2 0 0 0 0 4 2 2 0 0 1 0 4z" fill="#0047a0"/>
            <path d="M3 3l4 2M17 11l4 2M3 13l4-2M17 5l4-2" stroke="#000" stroke-width=".7"/>
        {:else if language === 'sa'}
            <rect width="24" height="16" fill="#006c35"/>
            <path d="M5 7.5h14M7 10.5h10" stroke="#fff" stroke-width="1"/>
        {:else if language === 'multi'}
            <rect width="24" height="16" rx="2" fill="#0f62fe"/>
            <circle cx="12" cy="8" r="5" fill="none" stroke="#fff" stroke-width="1"/>
            <path d="M7 8h10M12 3c2 2 2 8 0 10M12 3c-2 2-2 8 0 10" fill="none" stroke="#fff" stroke-width=".8"/>
        {:else}
            <rect width="24" height="16" rx="2" fill="#6f6f6f"/>
            <text x="12" y="11" text-anchor="middle" font-size="8" fill="#fff">?</text>
        {/if}
    </svg>
</span>

<style>
    .language-flag {
        display: inline-flex;
        width: 1.5rem;
        height: 1rem;
        flex: none;
        overflow: hidden;
        border-radius: 0.125rem;
        box-shadow: 0 0 0 0.0625rem rgb(0 0 0 / 20%);
        vertical-align: middle;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
