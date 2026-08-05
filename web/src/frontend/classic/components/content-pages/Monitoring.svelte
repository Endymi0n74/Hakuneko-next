<script lang="ts">
    import { onMount } from 'svelte';
    import {
        Button,
        Tile,
    } from 'carbon-components-svelte';
    import Renew from 'carbon-icons-svelte/lib/Renew.svelte';
    import WarningAlt from 'carbon-icons-svelte/lib/WarningAlt.svelte';
    import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
    import InProgress from 'carbon-icons-svelte/lib/InProgress.svelte';
    import NotificationNew from 'carbon-icons-svelte/lib/NotificationNew.svelte';
    import { fade } from 'svelte/transition';

    import {
        LibraryStatusKind,
        type LibrarySeriesStatus,
    } from '../../../../engine/library/models/LibraryStatus';
    import type { LibrarySummary } from '../../../../engine/library/models/LibrarySummary';
    import { Key as GlobalKey } from '../../../../engine/SettingsGlobal';
    import type { Check, Numeric } from '../../../../engine/SettingsManager';
    import type { LibraryHistoryEntry } from '../../../../engine/library/models/LibraryHistory';

    const monitor = window.HakuNeko.ChapterMonitor;
    const globalSettings = window.HakuNeko.SettingsManager.OpenScope();
    const automaticCheckSetting = globalSettings.Get<Check>(GlobalKey.CheckNewContent);
    const checkPeriodSetting = globalSettings.Get<Numeric>(GlobalKey.CheckNewContentPeriod);
    const autoDownloadSetting = globalSettings.Get<Check>(GlobalKey.AutoDownloadNewContent);
    const maxDownloadsSetting = globalSettings.Get<Numeric>(GlobalKey.AutoDownloadNewContentMaxItems);
    const ignoreSpecialsSetting = globalSettings.Get<Check>(GlobalKey.AutoDownloadIgnoreSpecials);
    const downloadDelaySetting = globalSettings.Get<Numeric>(GlobalKey.AutoDownloadDelay);

    let statuses = $state<LibrarySeriesStatus[]>([]);
    let history = $state<LibraryHistoryEntry[]>([]);
    let summary = $state<LibrarySummary>({
        total: 0,
        checking: 0,
        upToDate: 0,
        newContent: 0,
        errors: 0,
        newChapterCount: 0,
    });
    let isRunning = $state(false);
    let lastChecked = $state<Date | null>(null);
    let checkedCount = $state(0);
    let totalCount = $state(0);
    let searchQuery = $state('');
    type SortKey = 'status' | 'title' | 'website' | 'known' | 'new' | 'checked';
    let sortKey = $state<SortKey>('status');
    let sortAscending = $state(true);
    let automaticCheck = $state(automaticCheckSetting.Value);
    let checkPeriod = $state(checkPeriodSetting.Value);
    let autoDownload = $state(autoDownloadSetting.Value);
    let maxDownloads = $state(maxDownloadsSetting.Value);
    let ignoreSpecials = $state(ignoreSpecialsSetting.Value);
    let downloadDelay = $state(downloadDelaySetting.Value);

    function getFilteredStatuses(): LibrarySeriesStatus[] {
        const query = searchQuery.trim().toLocaleLowerCase();

        const filtered = query.length === 0
            ? [...statuses]
            : statuses.filter(series => {
                return series.title.toLocaleLowerCase().includes(query)
                    || series.websiteID.toLocaleLowerCase().includes(query);
            });

        const statusOrder: Record<LibraryStatusKind, number> = {
            [LibraryStatusKind.NewContent]: 0,
            [LibraryStatusKind.Error]: 1,
            [LibraryStatusKind.Checking]: 2,
            [LibraryStatusKind.UpToDate]: 3,
            [LibraryStatusKind.Idle]: 4,
        };

        filtered.sort((left, right) => {
            let result = 0;

            switch(sortKey) {
                case 'status':
                    result = statusOrder[left.status] - statusOrder[right.status];
                    break;

                case 'title':
                    result = left.title.localeCompare(right.title);
                    break;

                case 'website':
                    result = left.websiteID.localeCompare(right.websiteID);
                    break;

                case 'known':
                    result = left.knownChapterCount - right.knownChapterCount;
                    break;

                case 'new':
                    result = left.newChapterCount - right.newChapterCount;
                    break;

                case 'checked':
                    result = (left.lastChecked?.getTime() ?? 0)
                        - (right.lastChecked?.getTime() ?? 0);
                    break;
            }

            return sortAscending ? result : -result;
        });

        return filtered;
    }

    function changeSort(nextKey: SortKey): void {
        if(sortKey === nextKey) {
            sortAscending = !sortAscending;
            return;
        }

        sortKey = nextKey;
        sortAscending = true;
    }

    function sortIndicator(key: SortKey): string {
        if(sortKey !== key) {
            return '';
        }

        return sortAscending ? ' ▲' : ' ▼';
    }

    function updateStatuses(value: Map<string, LibrarySeriesStatus>) {
        statuses = [...value.values()].sort((left, right) => {
            if(left.status === LibraryStatusKind.NewContent
                && right.status !== LibraryStatusKind.NewContent) {
                return -1;
            }

            if(right.status === LibraryStatusKind.NewContent
                && left.status !== LibraryStatusKind.NewContent) {
                return 1;
            }

            if(left.status === LibraryStatusKind.Error
                && right.status !== LibraryStatusKind.Error) {
                return -1;
            }

            if(right.status === LibraryStatusKind.Error
                && left.status !== LibraryStatusKind.Error) {
                return 1;
            }

            return left.title.localeCompare(right.title);
        });
    }

    function formatDate(value?: Date | null): string {
        if(!value) {
            return 'Jamais';
        }

        return value.toLocaleString();
    }

    function formatHistoryTime(value: Date): string {
        return value.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function statusLabel(status: LibraryStatusKind): string {
        switch(status) {
            case LibraryStatusKind.Checking:
                return 'Vérification';

            case LibraryStatusKind.UpToDate:
                return 'À jour';

            case LibraryStatusKind.NewContent:
                return 'Nouveaux chapitres';

            case LibraryStatusKind.Error:
                return 'Erreur';

            default:
                return 'En attente';
        }
    }

    function statusClass(status: LibraryStatusKind): string {
        switch(status) {
            case LibraryStatusKind.Checking:
                return 'checking';

            case LibraryStatusKind.UpToDate:
                return 'up-to-date';

            case LibraryStatusKind.NewContent:
                return 'new-content';

            case LibraryStatusKind.Error:
                return 'error';

            default:
                return 'idle';
        }
    }

    function updateAutomaticCheck(value: boolean): void {
        automaticCheck = value;
        automaticCheckSetting.Value = value;
    }

    function updateCheckPeriod(value: number): void {
        checkPeriod = Math.max(
            checkPeriodSetting.Min,
            Math.min(checkPeriodSetting.Max, value)
        );
        checkPeriodSetting.Value = checkPeriod;
    }

    function updateAutoDownload(value: boolean): void {
        autoDownload = value;
        autoDownloadSetting.Value = value;
    }

    function updateMaxDownloads(value: number): void {
        maxDownloads = Math.max(
            maxDownloadsSetting.Min,
            Math.min(maxDownloadsSetting.Max, value)
        );
        maxDownloadsSetting.Value = maxDownloads;
    }

    function updateIgnoreSpecials(value: boolean): void {
        ignoreSpecials = value;
        ignoreSpecialsSetting.Value = value;
    }

    function updateDownloadDelay(value: number): void {
        downloadDelay = Math.max(
            downloadDelaySetting.Min,
            Math.min(downloadDelaySetting.Max, value)
        );
        downloadDelaySetting.Value = downloadDelay;
    }

    onMount(() => {
        const onStatuses = (value: Map<string, LibrarySeriesStatus>) => {
            updateStatuses(value);
        };
        const onHistory = (value: ReadonlyArray<LibraryHistoryEntry>) => {
            history = [...value];
        };
        const onSummary = (value: LibrarySummary) => {
            summary = { ...value };
        };
        const onRunning = (value: boolean) => {
            isRunning = value;
        };
        const onLastChecked = (value: Date | null) => {
            lastChecked = value;
        };
        const onCheckedCount = (value: number) => {
            checkedCount = value;
        };
        const onTotalCount = (value: number) => {
            totalCount = value;
        };
        const onAutomaticCheck = (value: boolean) => {
            automaticCheck = value;
        };
        const onCheckPeriod = (value: number) => {
            checkPeriod = value;
        };
        const onAutoDownload = (value: boolean) => {
            autoDownload = value;
        };
        const onMaxDownloads = (value: number) => {
            maxDownloads = value;
        };
        const onIgnoreSpecials = (value: boolean) => {
            ignoreSpecials = value;
        };
        const onDownloadDelay = (value: number) => {
            downloadDelay = value;
        };

        updateStatuses(monitor.Statuses.Value);
        history = [...monitor.History.Value];
        summary = { ...monitor.Summary.Value };
        isRunning = monitor.IsRunning.Value;
        lastChecked = monitor.LastChecked.Value;
        checkedCount = monitor.CheckedCount.Value;
        totalCount = monitor.TotalCount.Value;

        monitor.Statuses.Subscribe(onStatuses);
        monitor.History.Subscribe(onHistory);
        monitor.Summary.Subscribe(onSummary);
        monitor.IsRunning.Subscribe(onRunning);
        monitor.LastChecked.Subscribe(onLastChecked);
        monitor.CheckedCount.Subscribe(onCheckedCount);
        monitor.TotalCount.Subscribe(onTotalCount);
        automaticCheckSetting.Subscribe(onAutomaticCheck);
        checkPeriodSetting.Subscribe(onCheckPeriod);
        autoDownloadSetting.Subscribe(onAutoDownload);
        maxDownloadsSetting.Subscribe(onMaxDownloads);
        ignoreSpecialsSetting.Subscribe(onIgnoreSpecials);
        downloadDelaySetting.Subscribe(onDownloadDelay);

        return () => {
            monitor.Statuses.Unsubscribe(onStatuses);
            monitor.History.Unsubscribe(onHistory);
            monitor.Summary.Unsubscribe(onSummary);
            monitor.IsRunning.Unsubscribe(onRunning);
            monitor.LastChecked.Unsubscribe(onLastChecked);
            monitor.CheckedCount.Unsubscribe(onCheckedCount);
            monitor.TotalCount.Unsubscribe(onTotalCount);
            automaticCheckSetting.Unsubscribe(onAutomaticCheck);
            checkPeriodSetting.Unsubscribe(onCheckPeriod);
            autoDownloadSetting.Unsubscribe(onAutoDownload);
            maxDownloadsSetting.Unsubscribe(onMaxDownloads);
            ignoreSpecialsSetting.Unsubscribe(onIgnoreSpecials);
            downloadDelaySetting.Unsubscribe(onDownloadDelay);
        };
    });
</script>

<div id="monitoring-page" in:fade>
    <div class="heading">
        <div>
            <h2>Surveillance</h2>
            <p>
                Vérification automatique des favoris et détection des nouveaux chapitres.
            </p>
        </div>

        <div class="monitor-actions">
            {#if isRunning}
                <Button
                    kind="secondary"
                    onclick={() => monitor.CancelCurrentCheck()}
                >
                    Arrêter après la série en cours
                </Button>
            {/if}

            <Button
                icon={Renew}
                disabled={isRunning}
                onclick={() => void monitor.CheckNow()}
            >
                {isRunning ? 'Vérification…' : 'Vérifier maintenant'}
            </Button>
        </div>
    </div>

    <div class="summary">
        <Tile class="summary-card">
            <strong>{summary.total}</strong>
            <span>Séries surveillées</span>
        </Tile>

        <Tile class="summary-card up-to-date-card">
            <strong>{summary.upToDate}</strong>
            <span>À jour</span>
        </Tile>

        <Tile class="summary-card new-content-card">
            <strong>{summary.newContent}</strong>
            <span>
                Nouveautés
                {#if summary.newChapterCount > 0}
                    ({summary.newChapterCount} chapitres)
                {/if}
            </span>
        </Tile>

        <Tile class="summary-card error-card">
            <strong>{summary.errors}</strong>
            <span>Erreurs</span>
        </Tile>
    </div>

    <Tile class="last-check">
        <div class="last-check-value">
            <span>Dernière vérification</span>
            <strong>{formatDate(lastChecked)}</strong>
        </div>

        {#if isRunning}
            <div class="monitor-progress">
                <span>
                    Série {Math.min(checkedCount + 1, totalCount)} sur {totalCount}
                </span>
                <progress
                    max={Math.max(totalCount, 1)}
                    value={checkedCount}
                ></progress>
            </div>
        {/if}
    </Tile>

    <section class="automation-section">
        <div class="automation-heading">
            <div>
                <h3>Automatisation</h3>
                <p>
                    Configure la vérification périodique et le téléchargement automatique.
                </p>
            </div>

            <span class:enabled={automaticCheck} class="automation-state">
                {automaticCheck ? 'Surveillance active' : 'Surveillance inactive'}
            </span>
        </div>

        <div class="automation-grid">
            <Tile class="automation-card">
                <label class="toggle-line">
                    <input
                        type="checkbox"
                        checked={automaticCheck}
                        onchange={event => updateAutomaticCheck(event.currentTarget.checked)}
                    />
                    <span>
                        <strong>Vérification automatique</strong>
                        <small>Contrôle périodiquement les séries surveillées.</small>
                    </span>
                </label>

                <label class="field-line">
                    <span>Intervalle en minutes</span>
                    <input
                        type="number"
                        min={checkPeriodSetting.Min}
                        max={checkPeriodSetting.Max}
                        value={checkPeriod}
                        disabled={!automaticCheck}
                        onchange={event => updateCheckPeriod(event.currentTarget.valueAsNumber)}
                    />
                </label>
            </Tile>

            <Tile class="automation-card">
                <label class="toggle-line">
                    <input
                        type="checkbox"
                        checked={autoDownload}
                        onchange={event => updateAutoDownload(event.currentTarget.checked)}
                    />
                    <span>
                        <strong>Téléchargement automatique</strong>
                        <small>
                            Ajoute les nouveaux chapitres détectés à la file de téléchargement.
                        </small>
                    </span>
                </label>

                <label class="field-line">
                    <span>Maximum par série</span>
                    <input
                        type="number"
                        min={maxDownloadsSetting.Min}
                        max={maxDownloadsSetting.Max}
                        value={maxDownloads}
                        disabled={!autoDownload}
                        onchange={event => updateMaxDownloads(event.currentTarget.valueAsNumber)}
                    />
                </label>

                <label class="toggle-line compact">
                    <input
                        type="checkbox"
                        checked={ignoreSpecials}
                        disabled={!autoDownload}
                        onchange={event => updateIgnoreSpecials(event.currentTarget.checked)}
                    />
                    <span>
                        <strong>Ignorer les chapitres spéciaux</strong>
                        <small>Ignore les bonus, extras, omake et side stories.</small>
                    </span>
                </label>

                <label class="field-line">
                    <span>Délai entre les ajouts (ms)</span>
                    <input
                        type="number"
                        min={downloadDelaySetting.Min}
                        max={downloadDelaySetting.Max}
                        step="100"
                        value={downloadDelay}
                        disabled={!autoDownload}
                        onchange={event => updateDownloadDelay(event.currentTarget.valueAsNumber)}
                    />
                </label>
            </Tile>
        </div>

        <p class="automation-note">
            La valeur 0 pour « Maximum par série » signifie qu'aucune limite n'est appliquée.
        </p>
    </section>

    <section class="series-section">
        <div class="series-heading">
            <div>
                <h3>Séries</h3>
                <small>{getFilteredStatuses().length} résultat(s)</small>
            </div>

            <input
                class="series-search"
                type="search"
                placeholder="Rechercher une série ou un site"
                bind:value={searchQuery}
            />
        </div>

        {#if statuses.length === 0}
            <Tile class="empty-state">
                <p>
                    Aucun résultat de surveillance pour le moment.
                </p>
                <p>
                    Lance une vérification pour analyser les favoris.
                </p>
            </Tile>
        {:else if getFilteredStatuses().length === 0}
            <Tile class="empty-state">
                <p>Aucune série ne correspond à la recherche.</p>
                <Button kind="ghost" onclick={() => searchQuery = ''}>
                    Effacer la recherche
                </Button>
            </Tile>
        {:else}
            <div class="series-table">
                <div class="series-table-header">
                    <button onclick={() => changeSort('status')}>
                        État{sortIndicator('status')}
                    </button>
                    <button onclick={() => changeSort('title')}>
                        Série{sortIndicator('title')}
                    </button>
                    <button onclick={() => changeSort('website')}>
                        Site{sortIndicator('website')}
                    </button>
                    <button onclick={() => changeSort('known')}>
                        Connus{sortIndicator('known')}
                    </button>
                    <button onclick={() => changeSort('new')}>
                        Nouveaux{sortIndicator('new')}
                    </button>
                    <button onclick={() => changeSort('checked')}>
                        Vérifié{sortIndicator('checked')}
                    </button>
                </div>

                {#each getFilteredStatuses() as series (series.bookmarkKey)}
                    <article class="series-row">
                        <div class="series-status-cell">
                            {#if series.status === LibraryStatusKind.Checking}
                                <InProgress size={18} />
                            {:else if series.status === LibraryStatusKind.UpToDate}
                                <CheckmarkFilled size={18} />
                            {:else if series.status === LibraryStatusKind.NewContent}
                                <NotificationNew size={18} />
                            {:else if series.status === LibraryStatusKind.Error}
                                <WarningAlt size={18} />
                            {/if}

                            <span class="status {statusClass(series.status)}">
                                {statusLabel(series.status)}
                            </span>
                        </div>

                        <div class="series-title-cell">
                            <strong title={series.title}>{series.title}</strong>
                            {#if series.lastKnownChapter}
                                <small title={series.lastKnownChapter}>
                                    Dernier : {series.lastKnownChapter}
                                </small>
                            {/if}
                            {#if series.error}
                                <small class="series-error">{series.error}</small>
                            {/if}
                        </div>

                        <span title={series.websiteID}>{series.websiteID}</span>
                        <strong>{series.knownChapterCount}</strong>
                        <strong class:new-count={series.newChapterCount > 0}>
                            {series.newChapterCount}
                        </strong>
                        <span>{formatDate(series.lastChecked)}</span>
                    </article>
                {/each}
            </div>
        {/if}
    </section>


    <section class="history-section">
        <div class="history-heading">
            <div>
                <h3>Historique</h3>
                <small>{history.length} entrée(s)</small>
            </div>

            <Button
                kind="ghost"
                disabled={history.length === 0}
                onclick={() => monitor.ClearHistory()}
            >
                Effacer l'historique
            </Button>
        </div>

        {#if history.length === 0}
            <Tile class="empty-state">
                <p>L'historique apparaîtra après une vérification.</p>
            </Tile>
        {:else}
            <div class="history-list">
                {#each history.slice(0, 30) as entry}
                    <Tile class="history-card">
                        <div class="history-time">
                            <strong>{formatHistoryTime(entry.timestamp)}</strong>
                            <small>{entry.timestamp.toLocaleDateString()}</small>
                        </div>

                        <div class="history-content">
                            <strong>{entry.title}</strong>
                            <span>{entry.message}</span>
                        </div>

                        <span class="status {statusClass(entry.status)}">
                            {statusLabel(entry.status)}
                        </span>
                    </Tile>
                {/each}
            </div>
        {/if}
    </section>
</div>

<style>
    #monitoring-page {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 100%;
        padding: 0.75rem;
    }

    .heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .heading h2 {
        margin: 0 0 0.25rem;
    }

    .heading p {
        margin: 0;
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(10rem, 1fr));
        gap: 0.75rem;
    }

    :global(.summary-card) {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        border-left: 0.3rem solid var(--cds-border-subtle);
    }

    :global(.summary-card strong) {
        font-size: 2rem;
    }

    :global(.up-to-date-card) {
        border-left-color: var(--cds-support-success);
    }

    :global(.new-content-card) {
        border-left-color: var(--cds-support-info);
    }

    :global(.error-card) {
        border-left-color: var(--cds-support-error);
    }

    :global(.last-check) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .series-section h3 {
        margin: 0 0 0.75rem;
    }

    .series-table {
        display: grid;
        gap: 0.125rem;
    }

    .series-table-header,
    .series-row {
        display: grid;
        grid-template-columns:
            minmax(8rem, 0.85fr)
            minmax(13rem, 1.8fr)
            minmax(7rem, 0.8fr)
            minmax(4.5rem, 0.45fr)
            minmax(5rem, 0.5fr)
            minmax(10rem, 1fr);
        gap: 0.75rem;
        align-items: center;
    }

    .series-table-header {
        padding: 0.6rem 0.75rem;
        background: var(--cds-layer-accent, var(--cds-ui-02));
    }

    .series-table-header button {
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--cds-text-secondary, var(--cds-text-02));
        font-size: 0.75rem;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
    }

    .series-table-header button:hover {
        color: var(--cds-text-primary, var(--cds-text-01));
    }

    .series-row {
        min-height: 3.75rem;
        padding: 0.65rem 0.75rem;
        background: var(--cds-layer, var(--cds-ui-01));
    }

    .series-row:hover {
        background: var(--cds-layer-hover, var(--cds-hover-ui));
    }

    .series-row > span,
    .series-title-cell strong,
    .series-title-cell small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .series-status-cell {
        display: flex;
        align-items: center;
        gap: 0.45rem;
    }

    .series-title-cell {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .series-title-cell small {
        margin-top: 0.15rem;
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .series-title-cell .series-error {
        color: var(--cds-support-error);
    }

    .new-count {
        color: var(--cds-support-info);
    }


    .history-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }

    .history-heading h3 {
        margin: 0;
    }

    .history-heading small {
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .history-list {
        display: grid;
        gap: 0.5rem;
    }

    :global(.history-card) {
        display: grid;
        grid-template-columns: 5rem minmax(0, 1fr) auto;
        gap: 1rem;
        align-items: center;
    }

    .history-time,
    .history-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .history-time small,
    .history-content span {
        margin-top: 0.2rem;
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .history-content strong,
    .history-content span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .monitor-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    :global(.last-check) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
    }

    .last-check-value,
    .monitor-progress {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .monitor-progress {
        width: min(24rem, 45vw);
        text-align: right;
    }

    .monitor-progress progress {
        width: 100%;
        height: 0.5rem;
        accent-color: var(--cds-focus);
    }

    .automation-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .automation-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    .automation-heading h3,
    .automation-heading p {
        margin: 0;
    }

    .automation-heading p {
        margin-top: 0.25rem;
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .automation-state {
        flex: none;
        padding: 0.3rem 0.6rem;
        border-radius: 1rem;
        background: var(--cds-layer-hover);
        font-size: 0.75rem;
        font-weight: 600;
    }

    .automation-state.enabled {
        background: var(--cds-support-success);
        color: var(--cds-text-on-color);
    }

    .automation-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    :global(.automation-card) {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .toggle-line,
    .field-line {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .toggle-line {
        align-items: flex-start;
    }

    .toggle-line.compact {
        margin-top: 0.25rem;
    }

    .toggle-line input {
        flex: none;
        width: 1rem;
        height: 1rem;
        margin-top: 0.15rem;
    }

    .toggle-line span {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }

    .toggle-line small,
    .automation-note {
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .field-line {
        justify-content: space-between;
    }

    .field-line input {
        width: 7rem;
        padding: 0.45rem 0.55rem;
        border: 0;
        border-bottom: 0.0625rem solid var(--cds-border-strong);
        background: var(--cds-field, var(--cds-field-01));
        color: inherit;
    }

    .field-line input:focus {
        outline: 0.125rem solid var(--cds-focus);
        outline-offset: -0.125rem;
    }

    .field-line input:disabled,
    .toggle-line input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .automation-note {
        margin: 0;
        font-size: 0.75rem;
    }

    .series-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
    }

    .series-heading h3 {
        margin: 0;
    }

    .series-heading small {
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .series-search {
        width: min(24rem, 45vw);
        padding: 0.65rem 0.75rem;
        border: 0;
        border-bottom: 0.0625rem solid var(--cds-border-strong);
        outline: 0;
        background: var(--cds-field, var(--cds-field-01));
        color: inherit;
    }

    .series-search:focus {
        outline: 0.125rem solid var(--cds-focus);
        outline-offset: -0.125rem;
    }

    @media (max-width: 70rem) {
        .automation-grid {
            grid-template-columns: 1fr;
        }

        .summary {
            grid-template-columns: repeat(2, minmax(10rem, 1fr));
        }

        .series-table-header {
            display: none;
        }

        .series-row {
            grid-template-columns: minmax(8rem, 0.8fr) minmax(12rem, 1.4fr) 1fr 5rem 5rem;
        }

        .series-row > span:last-child {
            grid-column: 2 / -1;
        }
    }

    @media (max-width: 45rem) {
        .heading,
        .series-heading,
        .history-heading,
        .automation-heading,
        :global(.last-check) {
            align-items: stretch;
            flex-direction: column;
        }

        .series-search,
        .monitor-progress {
            width: auto;
        }

        .monitor-actions {
            align-items: stretch;
            flex-direction: column-reverse;
        }

        .summary {
            grid-template-columns: 1fr;
        }

        .series-row {
            grid-template-columns: 1fr;
        }

        .series-row > span:last-child {
            grid-column: auto;
        }

        :global(.history-card) {
            grid-template-columns: 4rem minmax(0, 1fr);
        }

        :global(.history-card .status) {
            grid-column: 2;
            justify-self: start;
        }
    }
</style>
