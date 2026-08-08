import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (channel: string, size: number) => {
        ipcRenderer.send(channel, size)
    },
});

function ipcRendererSend() {

}

function ipcRendererOn() {

}