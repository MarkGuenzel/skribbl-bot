type PreloadFile = "sidebar.cjs" | "skribbl.cjs";
type SkribblProcess = "imageDrawer" | "wordGuesser";
type RoundPhase = "WAITING" | "GUESS THIS" | "DRAW THIS";

type EventPayloadMapping = {
    sidebarResize: { args: [size: number], return: void}
    guessWord: {args: [word: string], return: void}
    getWordList: {args: [wordLength: number], return: string[]}
    currentWord:{args: [currentWod: string], return: void}
    roundPhase: {args: [phase: RoundPhase], return: void}
    getImages: {args: [searchQuery: string], return: string[]}
    drawImage: {args: [imageUrl: string], return: void}
    cancelProcess: {args: [process: SkribblProcess], return: void}
    resumeProcess: {args: [process: SkribblProcess], return: void}
    wordGuesserUpdate: {args: [update: WordGuesserUpdate], return: void}
    imageDrawerUpdate: {args: [update: ImageDrawerUpdate], return: void}
}

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

interface SearchResult {
    template: string;
    url: string;
    title: string;
    content: string;
    img_src: string;
    img_format?: string;
    engine: string;
    parsed_url: string[];
    thumbnail: string;
    priority: string;
    engines: string[];
    positions: number[];
    score: number;
    category: string;
    publishedDate: string | null;
    iframe_src: string | null;
    thumbnail_src?: string; // only present on some results (e.g. unsplash)
}

interface SearchResponse {
    query: string;
    results: SearchResult[];
    // ...any other top-level fields you care about (e.g. suggestions, answers, etc.)
}