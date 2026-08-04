import type { PluginController } from '../PluginController';
import { MediaContainer, type MediaChild, type StoreableMediaContainer, type MediaItem } from './MediaPlugin';
import { type StorageController, Store } from '../StorageController';
import type { InteractiveFileContentProvider } from '../InteractiveFileContentProvider';
import { ConvertToSerializedBookmark } from '../transformers/BookmarkConverter';
import { Bookmark, MissingWebsite, type BookmarkSerialized } from './Bookmark';
import { MissingInfoTracker } from '../trackers/IMediaInfoTracker';
import { NotImplementedError } from '../Error';
import { FlagType } from '../ItemflagManager';
import { Delay } from '../BackgroundTimers';

export type BookmarkImportResult = {
    cancelled: boolean;
    found: number;
    imported: number;
    skipped: number;
    broken: number;
}

export type BookmarkExportResult = {
    cancelled: boolean;
    exported: number;
}

const defaultBookmarkFileType: FilePickerAcceptType = {
    description: 'HakuNeko Bookmarks',
    accept: {
        'application/json': [ '.bookmarks' ]
    }
};

export class BookmarkPlugin extends MediaContainer<Bookmark> {

    constructor(private readonly storage: StorageController, private readonly plugins: PluginController, private readonly fileIO: InteractiveFileContentProvider) {
        super('bookmarks', 'Bookmarks');
        this.Load();
    }

    private readonly OnUpdatedChangedCallback = (_: Date, sender: Bookmark) => {
        this.storage.SavePersistent<BookmarkSerialized>(this.Serialize(sender), Store.Bookmarks, sender.StorageKey);
        this.entries.Dispatch();
    };

    private Deserialize(serialized: BookmarkSerialized): Bookmark {
        const parent = this.plugins.WebsitePlugins.find(plugin => plugin.Identifier === serialized.Media.ProviderID) ?? new MissingWebsite(serialized.Media.ProviderID);
        const tracker = this.plugins.InfoTrackers.find(tracker => tracker.Identifier === serialized.Info.ProviderID) ?? new MissingInfoTracker(serialized.Info.ProviderID);
        const bookmark = new Bookmark(
            new Date(serialized.Created),
            new Date(serialized.Updated),
            parent,
            serialized.Media.EntryID,
            serialized.Title,
            tracker,
            serialized.Info?.EntryID
        );
        bookmark.Updated.Subscribe(this.OnUpdatedChangedCallback);
        return bookmark;
    }

    private async Load() {
        const bookmarks = await this.storage.LoadPersistent<BookmarkSerialized[]>(Store.Bookmarks);
        this.entries.Value = bookmarks.map(bookmark => this.Deserialize(bookmark));
    }

    public async RefreshAllFlags() {
        for (const media of super.Entries.Value) {
            try {
                await media.Update();
                HakuNeko.ItemflagManager.LoadContainerFlags(media);
            } catch (error) {
                // Do not let a single broken/blocked bookmark (e.g. region-locked website) interrupt the others
                console.warn(error);
            }
        }
    }

    /**
     * Matches chapter titles that are commonly used for bonus/side content rather than the main story,
     * mirroring the heuristic used by the previous HakuMangaPlus auto-download layer.
     */
    private static readonly SpecialChapterPattern = /(special|extra|bonus|omake|hors[ -]?série|side story)/i;

    /**
     * Enqueue newly detected chapters (i.e. entries that are not yet flagged as read/current)
     * of every bookmark for download, and mark the queued ones as viewed so they are not queued again.
     * Chapters that are skipped (e.g. filtered out as "special") are left unflagged, so they remain
     * available for a manual download and are simply reconsidered - and skipped again - on the next run.
     * Intended to be called after {@link RefreshAllFlags} so bookmark entries and flags are up to date.
     * @param maxItemsPerBookmark - Maximum amount of new chapters to queue per bookmark on this run (0 = unlimited).
     * @param ignoreSpecials - When true, chapters whose title looks like bonus/special content are skipped.
     * @param delayMs - Delay to wait between each chapter that gets queued, to avoid hammering the website.
     */
    public async AutoDownloadNewContent(maxItemsPerBookmark = 0, ignoreSpecials = true, delayMs = 0): Promise<void> {
        for (const bookmark of super.Entries.Value) {
            try {
                let newEntries = await bookmark.GetUnflaggedContent();
                if (ignoreSpecials) {
                    newEntries = newEntries.filter(entry => !BookmarkPlugin.SpecialChapterPattern.test(entry.Title));
                }
                if (newEntries.length === 0) {
                    continue;
                }
                const toDownload = (maxItemsPerBookmark > 0 ? newEntries.slice(0, maxItemsPerBookmark) : newEntries) as StoreableMediaContainer<MediaItem>[];
                console.log(`[HakuNeko] Auto-download: "${bookmark.Title}" has ${newEntries.length} new chapter(s), queuing ${toDownload.length}`);
                for (const entry of toDownload) {
                    await HakuNeko.DownloadManager.Enqueue(entry);
                    await HakuNeko.ItemflagManager.FlagItem(entry, FlagType.Viewed);
                    if (delayMs > 0) {
                        await Delay(delayMs);
                    }
                }
            } catch (error) {
                // Do not let a single broken bookmark (e.g. missing website) interrupt the others
                console.warn(error);
            }
        }
    }

    public async Import(): Promise<BookmarkImportResult> {
        let data: Blob;
        const result: BookmarkImportResult = {
            cancelled: false,
            found: 0,
            imported: 0,
            skipped: 0,
            broken: 0,
        };
        try {
            data = await this.fileIO.LoadFile({
                types: [ defaultBookmarkFileType ]
            });
        } catch(error) {
            if(this.fileIO.IsAbortError(error)) {
                result.cancelled = true;
                return result;
            } else {
                throw error;
            }
        }
        const found = (JSON.parse(await data.text()) as Array<unknown>).map(entry => this.Deserialize(ConvertToSerializedBookmark(entry)));
        result.found = found.length;
        const imported = found.filter(bookmark => this.Entries.Value.none(entry => entry.IsSameAs(bookmark)));
        for(const bookmark of imported) {
            await this.storage.SavePersistent<BookmarkSerialized>(this.Serialize(bookmark), Store.Bookmarks, bookmark.StorageKey);
        }
        await this.Load();
        result.imported = imported.length;
        result.skipped = found.length - imported.length;
        result.broken = imported.filter(entry => entry.Parent instanceof MissingWebsite).length;
        return result;
    }

    public async Export(): Promise<BookmarkExportResult> {
        const bookmarks = super.Entries.Value.map(bookmark => this.Serialize(bookmark));
        const result: BookmarkExportResult = {
            cancelled: false,
            exported: 0
        };
        const data = new Blob([ JSON.stringify(bookmarks, null, 2) ], { type: 'application/json' });
        const today = new Date(Date.now() - 60000 * new Date().getTimezoneOffset()).toISOString().split('T').at(0);
        try {
            await this.fileIO.SaveFile(data, {
                suggestedName: `HakuNeko (${today}).bookmarks`,
                types: [ defaultBookmarkFileType ]
            });
            result.exported = bookmarks.length;
            return result;
        } catch(error) {
            if(this.fileIO.IsAbortError(error)) {
                result.cancelled = true;
                return result;
            } else {
                throw error;
            }
        }
    }

    private Serialize(bookmark: Bookmark): BookmarkSerialized {
        return {
            Created: bookmark.Created.getTime(),
            Updated: bookmark.Updated.Value.getTime(),
            Title: bookmark.Title,
            Media: {
                ProviderID: bookmark.Parent.Identifier,
                EntryID: bookmark.Identifier
            },
            Info: {
                ProviderID: bookmark.Tracker?.Identifier ?? null,
                EntryID: bookmark.InfoID ?? null
            }
        };
    }

    public async Add(entry: MediaContainer<MediaContainer<MediaChild>>) {
        if(this.IsBookmarked(entry)) {
            // TODO: Keep duplicate bookmark, or replace with new one?
            return;
        }
        const now = new Date();
        const bookmark = new Bookmark(now, now, entry.Parent, entry.Identifier, entry.Title);
        bookmark.Updated.Subscribe(this.OnUpdatedChangedCallback);
        this.entries.Push(bookmark);
        await this.storage.SavePersistent<BookmarkSerialized>(this.Serialize(bookmark), Store.Bookmarks, bookmark.StorageKey);
    }

    public async Remove(bookmark: Bookmark) {
        bookmark.Updated.Unsubscribe(this.OnUpdatedChangedCallback);
        this.entries.Value = super.Entries.Value.filter(entry => entry !== bookmark);
        await this.storage.RemovePersistent(Store.Bookmarks, bookmark.StorageKey);
    }

    public async Toggle(entry: MediaContainer<MediaContainer<MediaChild>>): Promise<boolean> {
        const bookmark = this.Find(entry);
        if (bookmark) {
            await this.Remove(bookmark);
            return false;
        }
        else {
            await this.Add(entry);
            return true;
        }
    }

    public Find(entry: MediaContainer<MediaChild>): Bookmark | undefined {
        return this.Entries.Value.find(bookmark => bookmark.IsSameAs(entry));
    }

    public IsBookmarked(entry: MediaContainer<MediaChild>): boolean {
        return !!this.Find(entry);
    }

    /*
    public override async Initialize(): Promise<void> {
        await super.Initialize();
        await this.Load();
    }
    */

    protected async PerformUpdate(): Promise<Bookmark[]> {
        throw new NotImplementedError();
    }

    public async Update(): Promise<void> {
        await this.Load();
    }

    public async GetEntriesWithUnflaggedContent(): Promise<Bookmark[]> {
        const results = await Promise.all(this.Entries.Value.map(async bookmark => (await bookmark.GetUnflaggedContent()).length > 0));
        return this.Entries.Value.filter((_, index) => results[index]);
    }
}