import { SidebarElectronApi } from "../shared/electron-api"

declare global {
    interface Window {
        electron: SidebarElectronApi
    }
}