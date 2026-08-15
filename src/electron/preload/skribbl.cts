import {ipcRendererInvoke} from "./ipc.js"
import WordGuesser from "./skribbl-util/wordGuesser.js"
import ImageDrawer from "./skribbl-util/imageDrawer.js"


let currentWordDiv: HTMLElement;
let wordGuesser: WordGuesser;
let imageDrawer: ImageDrawer;
const currentWordObserver = new MutationObserver(async () => {
    const hintDivs = currentWordDiv?.querySelectorAll<HTMLDivElement>(".hint");
    const description = currentWordDiv?.querySelectorAll<HTMLDivElement>(".description")[0].innerHTML;

    let currentWord = "";
    for (const letterDiv of hintDivs) {
        currentWord += letterDiv.innerText;
    }

    // if (description === "WAITING") {
    //     await wordGuesser.reset();
    // }

    // if (description === "GUESS THIS") {
    //     await wordGuesser.update(currentWord);
    // }

    if (description === "DRAW THIS") {
        // draw code
        imageDrawer.draw();
    }
});

const observerTargets = [
    { id: "game-canvas" },
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
                imageDrawer = new ImageDrawer(canvas)
                pending.delete(id);
            }
            if (id === "game-chat") {
                const chatInput = element.querySelector<HTMLInputElement>("input");
                if (!chatInput) continue;
                
                wordGuesser = new WordGuesser(chatInput);
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
            console.log("All elements found. Disconnecting body observer");
            watcher.disconnect()
        }
    });

    watcher.observe(document.body, { childList: true, subtree: true })
});