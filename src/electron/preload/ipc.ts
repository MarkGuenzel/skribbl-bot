import { ipcRenderer } from "electron";

export function ipcRendererSend<Key extends keyof EventPayloadMapping>(
    channel: Key,
    ...args: EventPayloadMapping[Key]["args"]
) {
    ipcRenderer.send(channel, ...args);
}

export function ipcRendererOn<Key extends keyof EventPayloadMapping>(
    channel: Key,
    callback: (...args: EventPayloadMapping[Key]["args"]) => void
) {
    const cb = (_: Electron.IpcRendererEvent, ...args: EventPayloadMapping[Key]["args"]) => callback(...args);
    ipcRenderer.on(channel, cb);
    return () => ipcRenderer.off(channel, cb);
}

export function ipcRendererInvoke<Key extends keyof EventPayloadMapping>(
    channel: Key,
    ...args: EventPayloadMapping[Key]["args"]
): Promise<EventPayloadMapping[Key]["return"]> {
    return ipcRenderer.invoke(channel, ...args);
}