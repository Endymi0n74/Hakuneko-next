export const enum LibraryStatusKind {
    Idle = 'idle',
    Checking = 'checking',
    UpToDate = 'up-to-date',
    NewContent = 'new-content',
    Error = 'error',
}

export type LibrarySeriesStatus = {
    readonly bookmarkKey: string;
    readonly title: string;
    readonly websiteID: string;
    readonly status: LibraryStatusKind;
    readonly lastChecked?: Date;
    readonly knownChapterCount: number;
    readonly newChapterCount: number;
    readonly lastKnownChapter?: string;
    readonly error?: string;
};
