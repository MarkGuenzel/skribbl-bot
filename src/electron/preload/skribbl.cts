/**
 * Canvas: <div id="game-canvas">
 * Chat: <div id="game-chat">
 * Current Word: <div id="game-round">
 */

const canvasObserver = new MutationObserver(() => {
    console.log("Canvas changed");
});
const chatObserver = new MutationObserver(() => {
    console.log("Chat changed");
});
const currentWordObserver = new MutationObserver(() => {
    console.log("Current Word changed");
});

const observerTargets = [
    { id: "game-canvas", observer: canvasObserver, options: { childList: true, subtree: true, attributes: true} },
    { id: "game-chat", observer: chatObserver, options: { childList: true, subtree: true, attributes: true } },
    { id: "game-round", observer: currentWordObserver, options: { characterData: true, childList: true, subtree: true, attributes: true } },
];

function whenBodyLoaded(callback: () => void) {
    if (document.body) {
        callback();
    }
    else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

// Append Observers
whenBodyLoaded(() => {
    const pending = new Map(observerTargets.map(t => [t.id, t]));
    const watcher = new MutationObserver(() => {
        for (const [id, target] of pending) {
            const element = document.getElementById(id);

            if (element && id === "game-canvas") {
                const canvas = element.querySelector<HTMLCanvasElement>("canvas");
                if (!canvas) continue;
                console.log("Canvas found");
                target.observer.observe(canvas, target.options);
                pending.delete(id);
            }
        }

        if (pending.size === 0) {
            watcher.disconnect()
        }
    });

    watcher.observe(document.body, { childList: true, subtree: true })
});