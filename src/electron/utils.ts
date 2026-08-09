import path from 'path';
import { app } from 'electron';

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