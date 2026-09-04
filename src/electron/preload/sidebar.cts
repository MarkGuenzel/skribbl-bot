import { contextBridge } from "electron";
import { ipcRendererSend, ipcRendererInvoke } from "./ipc.js";
import { SidebarElectronApi } from "../../shared/electron-api.js"

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
    getImages: (searchQuery) => {return ipcRendererInvoke("getImages", searchQuery)}
} satisfies SidebarElectronApi);

