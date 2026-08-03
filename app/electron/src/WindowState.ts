import path from 'path';
import fs from 'fs/promises';
import { app, screen, type BrowserWindow } from 'electron';

const STATE_FILE_NAME = 'window-state.json';

export type WindowState = {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    maximized?: boolean;
};

const MinWidth = 760;
const MinHeight = 520;
const DefaultWidth = 1280;
const DefaultHeight = 800;

function GetStateFile(): string {
    return path.join(app.getPath('userData'), STATE_FILE_NAME);
}

/**
 * Make sure the restored window state fits on one of the currently connected displays.
 * Falls back to a centered default size when the previous position is no longer visible
 * (e.g. an external monitor was disconnected).
 */
function ClampToDisplays(state: WindowState): WindowState {
    try {
        const displays = screen.getAllDisplays();
        const maxWidth = Math.max(...displays.map(display => display.workArea.width));
        const maxHeight = Math.max(...displays.map(display => display.workArea.height));
        const width = Math.max(MinWidth, Math.min(state.width ?? DefaultWidth, maxWidth));
        const height = Math.max(MinHeight, Math.min(state.height ?? DefaultHeight, maxHeight));
        if (!Number.isFinite(state.x) || !Number.isFinite(state.y)) {
            return { width, height, maximized: state.maximized };
        }
        const x = state.x as number;
        const y = state.y as number;
        const isVisible = displays.some(({ workArea }) =>
            x < workArea.x + workArea.width - 80 &&
            x + width > workArea.x + 80 &&
            y < workArea.y + workArea.height - 60 &&
            y + height > workArea.y + 60
        );
        return isVisible ? { ...state, width, height } : { width, height, maximized: state.maximized };
    } catch {
        return state;
    }
}

export async function LoadWindowState(): Promise<WindowState> {
    try {
        const content = await fs.readFile(GetStateFile(), 'utf-8');
        const state = JSON.parse(content) as WindowState;
        if (!Number.isFinite(state.width) || !Number.isFinite(state.height)) {
            return {};
        }
        return ClampToDisplays(state);
    } catch {
        return {};
    }
}

export function SaveWindowState(win: BrowserWindow): void {
    if (!win || win.isDestroyed()) {
        return;
    }
    const bounds = win.isMaximized() ? win.getNormalBounds() : win.getBounds();
    const state: WindowState = { ...bounds, maximized: win.isMaximized() };
    fs.writeFile(GetStateFile(), JSON.stringify(state, null, 2), 'utf-8').catch(error => console.warn(error));
}

/**
 * Persist the window's size/position whenever it changes, debounced to avoid excessive disk writes.
 */
export function TrackWindowState(win: BrowserWindow): void {
    let timer: ReturnType<typeof setTimeout>;
    const queueSave = () => {
        clearTimeout(timer);
        timer = setTimeout(() => SaveWindowState(win), 300);
    };
    win.on('resize', queueSave);
    win.on('move', queueSave);
    win.on('maximize', queueSave);
    win.on('unmaximize', queueSave);
    win.on('close', () => SaveWindowState(win));
}
