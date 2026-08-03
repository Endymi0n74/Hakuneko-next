import { Menu, MenuItem } from 'electron';

export function InitializeMenu() {
    const menu = new Menu();
    menu.append(new MenuItem({
        role: 'appMenu',
        submenu: [
            { role: 'close' },
            { role: 'quit' },
        ]
    }));
    menu.append(new MenuItem({
        role: 'editMenu',
        submenu: [
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
        ]
    }));
    menu.append(new MenuItem({
        role: 'viewMenu',
        submenu: [
            { role: 'toggleDevTools', accelerator: 'F12' },
            { role: 'reload', accelerator: 'CmdOrCtrl+R' },
            { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
            { type: 'separator' },
            { role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
            { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
            { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
            { type: 'separator' },
            { role: 'togglefullscreen', accelerator: 'F11' },
        ]
    }));
    Menu.setApplicationMenu(menu);
}