type EventPayloadMapping = {
    sidebarResize: number
}

type UnsubscribeFunction = () => void;

interface Window {
    electron: {
        sendSidebarResize
    }
}