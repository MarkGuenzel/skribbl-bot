export type SidebarElectronApi = {
    sendSidebarResize: (size: number) => void
    getImages: (searchQuery: string) => Promise<string[]>
    drawImage: (imageUrl: string) => void
}