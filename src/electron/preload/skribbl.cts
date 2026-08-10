// Draw the word
let gameCanvas: HTMLCanvasElement;
const canvasObserver = new MutationObserver(() => {
    console.log("Canvas changed");
});

// Gues the word
let chatInput: HTMLInputElement;
let currentWordDiv: HTMLElement;
const currentWordObserver = new MutationObserver(() => {
    const hintDivs = currentWordDiv?.querySelectorAll<HTMLDivElement>(".hint");

    let currentWord = "";
    for (const letterDiv of hintDivs) {
        currentWord += letterDiv.innerText;
    }
    console.log(`Current Word: ${currentWord}`);
});

const observerTargets = [
    { id: "game-canvas", observer: canvasObserver, options: { childList: true, subtree: true, attributes: true} },
    { id: "game-chat" },
    { id: "game-word", observer: currentWordObserver, options: { characterData: true, childList: true, subtree: true, attributes: true } },
];

function whenBodyLoaded(callback: () => void) {
    if (document.body) {
        callback();
    }
    else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

// Append Observers and get HTMLElements
whenBodyLoaded(() => {
    const pending = new Map(observerTargets.map(t => [t.id, t]));
    const watcher = new MutationObserver(() => {
        for (const [id, target] of pending) {
            const element = document.getElementById(id);
            if (!element) continue;

            if (id === "game-canvas") {
                const canvas = element.querySelector<HTMLCanvasElement>("canvas");
                if (!canvas) continue;

                console.log("Canvas found");
                gameCanvas = canvas;
                target.observer?.observe(canvas, target.options);
                pending.delete(id);
            }
            if (id === "game-chat") {
                const chat = element.querySelector<HTMLInputElement>("input");
                if (!chat) continue;
                
                chatInput = chat;
                console.log("Game chat found");
                pending.delete(id);
            }
            if (id === "game-word") {
                console.log("Game word found");
                currentWordDiv = element;
                target.observer?.observe(element, target.options);
                pending.delete(id);
            }
        }

        if (pending.size === 0) {
            watcher.disconnect()
        }
    });

    watcher.observe(document.body, { childList: true, subtree: true })
});