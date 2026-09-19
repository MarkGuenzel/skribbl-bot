import { contextBridge } from "electron";
import { ipcRendererSend, ipcRendererInvoke, ipcRendererOn } from "./ipc.js";
import { SidebarElectronApi } from "../../shared/electron-api.js"

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
    guessWord: (word) => {ipcRendererSend("guessWord", word)},
    getImages: (searchQuery) => {return ipcRendererInvoke("getImages", searchQuery)},
    drawImage: (imageUrl) => {ipcRendererSend("drawImage", imageUrl)},
    cancelProcess: (process) => {ipcRendererSend("cancelProcess", process)},
    resumeProcess: (process) => {ipcRendererSend("resumeProcess", process)},
    onWordGuesserUpdate: (callback) => {ipcRendererOn("wordGuesserUpdate", callback)},
    onImageDrawerUpdate: (callback) => {ipcRendererOn("imageDrawerUpdate", callback)},
} satisfies SidebarElectronApi);

