import { contextBridge } from "electron";
import { ipcRendererSend, ipcRendererInvoke, ipcRendererOn } from "./ipc.js";
import { SidebarElectronApi } from "../../shared/electron-api.js"

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
    getImages: (searchQuery) => {return ipcRendererInvoke("getImages", searchQuery)},
    drawImage: (imageUrl) => {ipcRendererSend("drawImage", imageUrl)},
    cancelProcess: (process) => {ipcRendererSend("cancelProcess", process)},
    resumeProcess: (process) => {ipcRendererSend("resumeProcess", process)},
    onImageUrls: (callback) => {ipcRendererOn("imageUrls", callback)}
} satisfies SidebarElectronApi);

