import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    sendSidebarResize: (size) => {ipcRendererSend("sidebarResize", size)},
    getWordList: (wordLength: number) => {return ipcRendererInvoke("getWordList", wordLength)}
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

function ipcRendererInvoke<Key extends keyof EventPayloadMapping>(
    key: Key
): Promise<EventPayloadMapping[Key]> {
    return ipcRenderer.invoke(key);
}