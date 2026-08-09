import { app, BaseWindow, ipcMain, WebContentsView } from "electron"
import path from "path"
import { getPreloadPath } from "./utils.js";

const loadWebContents = (mainWindow: BaseWindow) => {
    // Skribbl
    const gameView = new WebContentsView({
        webPreferences: {
            preload: getPreloadPath("skribbl.cjs")
        }
    });
    mainWindow.contentView.addChildView(gameView);
    gameView.webContents.loadURL("https://skribbl.io");
    gameView.webContents.openDevTools({ mode: "detach" })
    
    // Sidebar
    const sidebar = new WebContentsView({
        webPreferences: {
            preload: getPreloadPath("sidebar.cjs")
        }
    })
    mainWindow.contentView.addChildView(sidebar);
    sidebar.webContents.loadURL("http://localhost:5123");

    let sidebarWidth = 40;
    const layout = () => {
        const { width, height } = mainWindow.getContentBounds();
        gameView.setBounds({ 
            x: 0,
            y: 0,
            width: width - sidebarWidth,
            height: height
        });
        sidebar.setBounds({
            x: width - sidebarWidth,
            y: 0,
            width: sidebarWidth,
            height: height
        })
    }

    layout();
    mainWindow.on("resize", layout);
    mainWindow.on("enter-full-screen", layout);
    mainWindow.on("leave-full-screen", layout);
    mainWindow.on("maximize", layout);
    mainWindow.on("unmaximize", layout);
    ipcMain.on("sidebarResize", (_, sidebarSize: number) => {
        sidebarWidth = sidebarSize;
        layout();
    });
}

app.on("ready", () => {
    const mainWindow = new BaseWindow({
        width: 1200,
        height: 800,
    });

    loadWebContents(mainWindow);

})