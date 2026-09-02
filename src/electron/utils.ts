import path from 'path';
import { app, ipcMain, WebContents } from 'electron';

export function isDev(): boolean {
    return process.env.NODE_ENV ===  "development";
}

export function getPreloadPath(fileName: PreloadFile) {
  return path.join(
    app.getAppPath(),
    isDev() ? '.' : '..',
    `/dist-electron/preload/${fileName}`
  );
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    channel: Key,
    handler: (...args: EventPayloadMapping[Key]["args"]) => EventPayloadMapping[Key]["return"]
): void {
    ipcMain.handle(channel, (_event, ...args: EventPayloadMapping[Key]["args"]) => handler(...args));
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
    channel: Key,
    handler: (...args: EventPayloadMapping[Key]["args"]) => void
): void {
    ipcMain.on(channel, (_event, ...args: EventPayloadMapping[Key]["args"]) => handler(...args))
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
    channel: Key,
    webContents: WebContents,
    ...args: EventPayloadMapping[Key]["args"]
): void {
    webContents.send(channel, ...args);
}