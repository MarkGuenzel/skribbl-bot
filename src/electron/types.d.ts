type PreloadFile = "sidebar.cjs" | "skribbl.cjs";
type SkribblProcess = "imageDrawer" | "wordGuesser";

type EventPayloadMapping = {
    sidebarResize: { args: [size: number], return: void},
    getWordList: {args: [wordLength: number], return: string[]}
    currentWord:{args: [currentWod: string], return: void}
    getImages: {args: [searchQuery: string], return: string[]}
    imageUrls: {args: [imageUrls: string[]], return: void}
    drawImage: {args: [imageUrl: string], return: void}
    cancelProcess: {args: [process: SkribblProcess], return: void}
    resumeProcess: {args: [process: SkribblProcess], return: void}
}

type UnsubscribeFunction = () => void;

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