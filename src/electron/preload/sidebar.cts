import { contextBridge } from "electron";
import { ipcRendererSend } from "./ipc.js";

type SidebarElectronApi = {
    sendSidebarResize: (size: number) => void
}

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
} satisfies SidebarElectronApi);

