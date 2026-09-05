type PreloadFile = "sidebar.cjs" | "skribbl.cjs"

type EventPayloadMapping = {
    sidebarResize: { args: [size: number], return: void},
    getWordList: {args: [wordLength: number], return: string[]}
    currentWord:{args: [currentWod: string], return: void}
    getImages: {args: [searchQuery: string], return: string[]}
    drawImage: {args: [imageUrl: string], return: void}
}

type UnsubscribeFunction = () => void;