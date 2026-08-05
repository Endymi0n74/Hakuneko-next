import type { LibraryStatusKind } from './LibraryStatus';

export type LibraryHistoryEntry = {
    readonly timestamp: Date;
    readonly bookmarkKey: string;
    readonly title: string;
    readonly status: LibraryStatusKind;
    readonly newChapterCount: number;
    readonly message: string;
};
