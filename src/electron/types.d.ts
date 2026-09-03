type PreloadFile = "sidebar.cjs" | "skribbl.cjs"

type EventPayloadMapping = {
    sidebarResize: { args: [size: number], return: void},
    getWordList: {args: [wordLength: number], return: string[]}
    currentWord:{args: [currentWod: string], return: void}
    searchImages: {args: [searchQuery: string], return: void}
}

type UnsubscribeFunction = () => void;