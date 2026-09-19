type SkribblProcess = "imageDrawer" | "wordGuesser";
export type RoundPhase = "WAITING" | "GUESS THIS" | "DRAW THIS";
type UnsubscribeFunction = () => void;

type WordGuesserUpdate = {
    isRunning?: boolean
    currentWordList?: string[]
}

type ImageDrawerUpdate = {
    isRunning?: boolean
    imageUrls?: string[]
    imageToDraw?: string
    totalAmountStrokes?: number
    strokesDrawn?: number
}
export type SidebarElectronApi = {
    sendSidebarResize: (size: number) => void
    guessWord: (word: string) => void
    getImages: (searchQuery: string) => Promise<string[]>
    drawImage: (imageUrl: string) => void
    cancelProcess: (process: SkribblProcess) => void
    resumeProcess: (process: SkribblProcess) => void
    onWordGuesserUpdate: (callback: (update: WordGuesserUpdate) => void) => void
    onImageDrawerUpdate:  (callback: (update: ImageDrawerUpdate) => void) => void
    onRoundPhaseUpdate: (callback: (phase: RoundPhase) => void) => void
}