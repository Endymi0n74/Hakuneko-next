export type LibraryEventType =
    | 'check-started'
    | 'check-finished'
    | 'new-content'
    | 'error';

export type LibraryEvent = {
    readonly timestamp: Date;
    readonly type: LibraryEventType;
    readonly message: string;
    readonly bookmarkKey?: string;
    readonly title?: string;
    readonly newChapterCount?: number;
};
