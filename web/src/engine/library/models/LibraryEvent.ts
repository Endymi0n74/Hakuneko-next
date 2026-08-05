export type LibraryEventType =
    | 'check-started'
    | 'check-finished'
    | 'check-cancelled'
    | 'new-content'
    | 'auto-download-started'
    | 'auto-download-finished'
    | 'auto-download-error'
    | 'error';

export type LibraryEvent = {
    readonly timestamp: Date;
    readonly type: LibraryEventType;
    readonly message: string;
    readonly bookmarkKey?: string;
    readonly title?: string;
    readonly newChapterCount?: number;
    readonly queuedCount?: number;
    readonly skippedCount?: number;
};
