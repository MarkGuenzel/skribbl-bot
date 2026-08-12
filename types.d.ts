type PreloadFile = "sidebar.cjs" | "skribbl.cjs"

type EventPayloadMapping = {
    sidebarResize: number
    getWordList: string[]
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        sendSidebarResize: (size: number) => void,
        getWordList: (wordLength: number) => Promise<string[]>
    }
}