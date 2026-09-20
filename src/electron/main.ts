import { app, BaseWindow, WebContentsView } from "electron"
import path from "path"
import { getPreloadPath, ipcMainHandle, ipcMainOn, ipcWebContentsSend } from "./utils.js";
import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "fs";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import fetch from "cross-fetch";

type CSVRow = {
    word: string,
    count: number
}
const csvPath = "src/electron/skribbl-words.csv"
const SEARCH_URL = "http://localhost:8080/search"
const adBlocker = await ElectronBlocker.fromLists(fetch, [
    "https://easylist.to/easylist/easylist.txt",
    "https://easylist.to/easylist/easyprivacy.txt",
]);

const loadWebContents = (mainWindow: BaseWindow) => {
    // Skribbl
    const gameView = new WebContentsView({
        webPreferences: {
            preload: getPreloadPath("skribbl.cjs"),
            sandbox: false
        }
    });
    mainWindow.contentView.addChildView(gameView);
    gameView.webContents.loadURL("https://skribbl.io");
    // gameView.webContents.openDevTools({ mode: "bottom" });

    adBlocker.enableBlockingInSession(gameView.webContents.session);
    
    // Sidebar
    const sidebar = new WebContentsView({
        webPreferences: {
            preload: getPreloadPath("sidebar.cjs"),
            sandbox: false
        }
    })
    mainWindow.contentView.addChildView(sidebar);
    sidebar.webContents.loadURL("http://localhost:5123");
    // sidebar.webContents.openDevTools({ mode: "bottom" });

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

    ipcMainOn("sidebarResize", (sidebarSize) => {
        sidebarWidth = sidebarSize;
        layout();
    });

    return { gameView, sidebar };
}

const getImages = async (word: string): Promise<string[]> => {
    const query = new URL(SEARCH_URL);
    query.searchParams.set("q", word);
    query.searchParams.set("categories", "images");
    query.searchParams.set("format", "json");

    const response = await fetch(query);
    console.log({
        status: response.status,
        redirected: response.redirected,
        url: response.url,
        contentType: response.headers.get("content-type"),
    });

    const data: SearchResponse = await response.json();
    return data.results
        .slice(1, 20)
        .map(result => result.img_src);
}

const registerIpcHandlers = (views: {gameView: WebContentsView, sidebar: WebContentsView}) => {
   ipcMainHandle("getWordList", (wordLength: number) => {
        const records: CSVRow[] = parse(
            readFileSync(csvPath, "utf-8"),
            { columns: true, skip_empty_lines: true, cast: true }
        );
        const wordList = records
            .filter(row => row.count === wordLength)
            .map(row => row.word);

        return wordList;
    });

    ipcMainHandle("getImages", async (searchQuery) => {
        console.log("Triggered searchImages in main")
        return await getImages(searchQuery);    
    });

    ipcMainOn("drawImage", (imageUrl) => {
        ipcWebContentsSend(
            "drawImage",
            views.gameView.webContents,
            imageUrl
        );
    });

    ipcMainOn("cancelProcess", (proccess) => {
        ipcWebContentsSend(
            "cancelProcess",
            views.gameView.webContents,
            proccess
        );
    });

    ipcMainOn("resumeProcess", (proccess) => {
        ipcWebContentsSend(
            "resumeProcess",
            views.gameView.webContents,
            proccess
        );
    });

    ipcMainOn("guessWord", (word) => {
        ipcWebContentsSend(
            "guessWord",
            views.gameView.webContents,
            word
        );
    });

    ipcMainOn("wordGuesserUpdate", (update) => {
        ipcWebContentsSend(
            "wordGuesserUpdate",
            views.sidebar.webContents,
            update
        )
    });

    ipcMainOn("imageDrawerUpdate", (update) => {
        ipcWebContentsSend(
            "imageDrawerUpdate",
            views.sidebar.webContents,
            update
        );
    });

    ipcMainOn("roundPhase", (phase) => {
        ipcWebContentsSend(
            "roundPhase",
            views.sidebar.webContents,
            phase
        );
    });

    ipcMainOn("currentWord", async (currentWord) => {
        if (currentWord === "") {
            console.log(`Received empty word to draw from skribbl`);
            return;
        }
        
        console.log(`Received current word from skribbl: ${currentWord}`);
        const imageUrls = await getImages(currentWord + " piktogramm");
        ipcWebContentsSend(
            "imageDrawerUpdate",
            views.sidebar.webContents,
            {imageUrls: imageUrls}
        )
    });
}

app.on("ready", () => {
    const mainWindow = new BaseWindow({
        width: 1200,
        height: 800,
    });

    const views = loadWebContents(mainWindow);
    registerIpcHandlers(views);
})