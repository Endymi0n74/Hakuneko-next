<script lang="ts">
    import Logo from '../../../../img/logo.png';
    import { Tile } from 'carbon-components-svelte';
    import { fade } from 'svelte/transition';
    import Suggestions from '../Suggestions.svelte';
    import Documentation from './Documentation.svelte';
    import { GlobalSettings } from '../../stores/Settings.svelte';
    import { GetNextLocale } from '../../lib/NextLocale';

    let nextLocale = $derived(GetNextLocale(GlobalSettings.LocaleID));
</script>

<div id="Home" in:fade>
    <Tile class="border hero" style="margin-bottom:1em;">
        <img
            alt="HakuNeko-Next logo"
            class="logo"
            src={Logo}
        />
        <div>
            <h2>{nextLocale.welcomeTitle}</h2>
            <p>{nextLocale.welcomeBody}</p>
            <p class="based-on">{nextLocale.basedOn}</p>
        </div>
    </Tile>

    <Tile class="border highlights" style="margin-bottom:1em;">
        <h3>{nextLocale.releaseHighlights}</h3>
        <ul>
            <li>✓ {nextLocale.featureMonitoring}</li>
            <li>✓ {nextLocale.featureLanguages}</li>
            <li>✓ {nextLocale.featureMangaFire}</li>
        </ul>
    </Tile>

    <Suggestions />

    <Tile id="documentation" class="border">
        <Documentation />
    </Tile>
</div>

<style>
    #Home {
        padding: 0.5em;
    }

    #Home :global(#Suggestions) {
        margin-bottom: 1em;
    }

    :global(.hero) {
        align-items: center;
        display: flex;
        gap: 1em;
    }

    .logo {
        border-radius: 10%;
        height: 4.5em;
        width: 4.5em;
    }

    :global(.hero h2) {
        margin-bottom: 0.35em;
    }

    :global(.hero p) {
        line-height: 1.45;
    }

    .based-on {
        color: var(--cds-text-secondary);
        margin-top: 0.35em;
    }

    :global(.highlights h3) {
        margin-bottom: 0.65em;
    }

    :global(.highlights ul) {
        display: grid;
        gap: 0.45em;
        list-style: none;
        margin: 0;
        padding: 0;
    }
</style>
