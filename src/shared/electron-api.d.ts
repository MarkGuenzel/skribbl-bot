export type SidebarElectronApi = {
    sendSidebarResize: (size: number) => void
    searchImages: (searchQuery: string) => void
}