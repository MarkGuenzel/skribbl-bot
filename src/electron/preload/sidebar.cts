import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
} satisfies Window["electron"]);

function ipcRendererSend<Key extends keyof EventPayloadMapping>(
    channel: Key,
    payload: EventPayloadMapping[Key]
) {
    ipcRenderer.send(channel, payload);
}

function ipcRendererOn<Key extends keyof EventPayloadMapping>(
    channel: Key,
    callback: (payload: EventPayloadMapping[Key]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
    ipcRenderer.on(channel, cb);
    return () => ipcRenderer.off(channel, cb);
}