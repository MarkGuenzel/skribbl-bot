import { contextBridge } from "electron";
import { ipcRendererSend } from "./ipc.js";
import { SidebarElectronApi } from "../../shared/electron-api.js"

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
} satisfies SidebarElectronApi);

