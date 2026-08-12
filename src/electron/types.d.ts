type PreloadFile = "sidebar.cjs" | "skribbl.cjs"

type EventPayloadMapping = {
    sidebarResize: { args: [size: number], return: void},
    getWordList: {args: [wordLength: number], return: string[]}
}

type UnsubscribeFunction = () => void;