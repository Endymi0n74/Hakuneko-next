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
    import type { LibraryHistoryEntry } from '../../../../engine/library/models/LibraryHistory';

    const monitor = window.HakuNeko.ChapterMonitor;

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
    let searchQuery = $state('');

    function getFilteredStatuses(): LibrarySeriesStatus[] {
        const query = searchQuery.trim().toLocaleLowerCase();

        if(query.length === 0) {
            return statuses;
        }

        return statuses.filter(series => {
            return series.title.toLocaleLowerCase().includes(query)
                || series.websiteID.toLocaleLowerCase().includes(query);
        });
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

        updateStatuses(monitor.Statuses.Value);
        history = [...monitor.History.Value];
        summary = { ...monitor.Summary.Value };
        isRunning = monitor.IsRunning.Value;
        lastChecked = monitor.LastChecked.Value;

        monitor.Statuses.Subscribe(onStatuses);
        monitor.History.Subscribe(onHistory);
        monitor.Summary.Subscribe(onSummary);
        monitor.IsRunning.Subscribe(onRunning);
        monitor.LastChecked.Subscribe(onLastChecked);

        return () => {
            monitor.Statuses.Unsubscribe(onStatuses);
            monitor.History.Unsubscribe(onHistory);
            monitor.Summary.Unsubscribe(onSummary);
            monitor.IsRunning.Unsubscribe(onRunning);
            monitor.LastChecked.Unsubscribe(onLastChecked);
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

        <Button
            icon={Renew}
            disabled={isRunning}
            onclick={() => void monitor.CheckNow()}
        >
            {isRunning ? 'Vérification…' : 'Vérifier maintenant'}
        </Button>
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
        <span>Dernière vérification</span>
        <strong>{formatDate(lastChecked)}</strong>
    </Tile>

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
            <div class="series-list">
                {#each getFilteredStatuses() as series (series.bookmarkKey)}
                    <Tile class="series-card">
                        <div class="series-main">
                            <div class="series-title">
                                {#if series.status === LibraryStatusKind.Checking}
                                    <InProgress size={20} />
                                {:else if series.status === LibraryStatusKind.UpToDate}
                                    <CheckmarkFilled size={20} />
                                {:else if series.status === LibraryStatusKind.NewContent}
                                    <NotificationNew size={20} />
                                {:else if series.status === LibraryStatusKind.Error}
                                    <WarningAlt size={20} />
                                {/if}

                                <div>
                                    <strong>{series.title}</strong>
                                    <small>{series.websiteID}</small>
                                </div>
                            </div>

                            <span class="status {statusClass(series.status)}">
                                {statusLabel(series.status)}
                            </span>
                        </div>

                        <div class="series-details">
                            <span>
                                Chapitres connus :
                                <strong>{series.knownChapterCount}</strong>
                            </span>

                            <span>
                                Nouveaux :
                                <strong>{series.newChapterCount}</strong>
                            </span>

                            {#if series.lastKnownChapter}
                                <span title={series.lastKnownChapter}>
                                    Dernier :
                                    <strong>{series.lastKnownChapter}</strong>
                                </span>
                            {/if}

                            <span>
                                Vérifié :
                                <strong>{formatDate(series.lastChecked)}</strong>
                            </span>
                        </div>

                        {#if series.error}
                            <p class="series-error">{series.error}</p>
                        {/if}
                    </Tile>
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

    .series-list {
        display: grid;
        gap: 0.5rem;
    }

    :global(.series-card) {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .series-main,
    .series-title,
    .series-details {
        display: flex;
        align-items: center;
    }

    .series-main {
        justify-content: space-between;
        gap: 1rem;
    }

    .series-title {
        gap: 0.65rem;
        min-width: 0;
    }

    .series-title div {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .series-title strong,
    .series-title small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .series-title small {
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .status {
        flex: none;
        padding: 0.25rem 0.55rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .status.up-to-date {
        background: var(--cds-support-success);
        color: var(--cds-text-on-color);
    }

    .status.new-content {
        background: var(--cds-support-info);
        color: var(--cds-text-on-color);
    }

    .status.error {
        background: var(--cds-support-error);
        color: var(--cds-text-on-color);
    }

    .status.checking {
        background: var(--cds-support-warning);
        color: var(--cds-text-primary);
    }

    .status.idle {
        background: var(--cds-layer-hover);
    }

    .series-details {
        flex-wrap: wrap;
        gap: 0.6rem 1.5rem;
        color: var(--cds-text-secondary, var(--cds-text-02));
    }

    .series-details span {
        min-width: 9rem;
    }

    .series-error {
        margin: 0;
        color: var(--cds-support-error);
        overflow-wrap: anywhere;
    }

    :global(.empty-state) {
        text-align: center;
    }

    :global(.empty-state p) {
        margin: 0.25rem;
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
        .summary {
            grid-template-columns: repeat(2, minmax(10rem, 1fr));
        }
    }

    @media (max-width: 45rem) {
        .heading,
        .series-heading,
        .history-heading {
            align-items: stretch;
            flex-direction: column;
        }

        .series-search {
            width: auto;
        }

        .summary {
            grid-template-columns: 1fr;
        }

        .series-main {
            align-items: flex-start;
            flex-direction: column;
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
