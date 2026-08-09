type PreloadFile = "sidebar.cjs" | "skribbl.cjs"

type EventPayloadMapping = {
    sidebarResize: number
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        sendSidebarResize: (size: EventPayloadMapping["sidebarResize"]) => void,
    }
}