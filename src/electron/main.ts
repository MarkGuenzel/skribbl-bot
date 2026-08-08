import { app, BaseWindow, WebContentsView } from "electron"
import path from "path"
import { getPreloadPath } from "./utils.js";

const SIDEBAR_WIDTH = 320;

const loadWebContents = (mainWindow: BaseWindow) => {
    // Skribbl
    const gameView = new WebContentsView();
    mainWindow.contentView.addChildView(gameView);
    gameView.webContents.loadURL("https://skribbl.io");
    
    // Sidebar
    const sidebar = new WebContentsView({
        webPreferences: {
            preload: getPreloadPath()
        }
    })
    mainWindow.contentView.addChildView(sidebar);
    sidebar.webContents.loadURL("http://localhost:5123");

    const layout = () => {
        const { width, height } = mainWindow.getContentBounds();
        gameView.setBounds({ 
            x: 0,
            y: 0,
            width: width - SIDEBAR_WIDTH,
            height: height
        });
        sidebar.setBounds({
            x: width - SIDEBAR_WIDTH,
            y: 0,
            width: SIDEBAR_WIDTH,
            height: height
        })
    }

    layout();
    mainWindow.on("resize", layout);
    mainWindow.on("enter-full-screen", layout);
    mainWindow.on("leave-full-screen", layout);
    mainWindow.on("maximize", layout);
    mainWindow.on("unmaximize", layout);
}

app.on("ready", () => {
    const mainWindow = new BaseWindow({
        width: 1200,
        height: 800,
    });

    loadWebContents(mainWindow);

})