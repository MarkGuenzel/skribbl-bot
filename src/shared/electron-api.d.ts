type SkribblProcess = "imageDrawer" | "wordGuesser";

export type SidebarElectronApi = {
    sendSidebarResize: (size: number) => void
    getImages: (searchQuery: string) => Promise<string[]>
    drawImage: (imageUrl: string) => void
    cancelProcess: (process: SkribblProcess) => void
    resumeProcess: (process: SkribblProcess) => void
    onImageUrls:  (callback: (imageUrls: string[]) => void) => void
}