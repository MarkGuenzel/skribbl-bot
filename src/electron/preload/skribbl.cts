import {ipcRendererInvoke, ipcRendererSend, ipcRendererOn} from "./ipc.js"
import WordGuesser from "./skribbl-util/wordGuesser.js"
import ImageDrawer from "./skribbl-util/imageDrawer.js"

enum RoundDescription {
  WAITING = "WAITING",
  GUESS_THIS = "GUESS THIS",
  DRAW_THIS = "DRAW THIS",
}

let currentWordDiv: HTMLElement;
let wordGuesser: WordGuesser;
let imageDrawer: ImageDrawer;
let currentRoundDescription = RoundDescription.WAITING;
const currentWordObserver = new MutationObserver(async () => {
    const hintDivs = currentWordDiv?.querySelectorAll<HTMLDivElement>(".hint");
    const description = currentWordDiv?.querySelectorAll<HTMLDivElement>(".description")[0].innerHTML;

    let currentWord = "";
    for (const letterDiv of hintDivs) {
        currentWord += letterDiv.innerText;
    }

    if (description === RoundDescription.WAITING) {
        currentRoundDescription = RoundDescription.WAITING;
        ipcRendererSend("roundPhase", "WAITING");
        await wordGuesser.reset();
    }

    if (description === RoundDescription.GUESS_THIS) {
        currentRoundDescription = RoundDescription.GUESS_THIS;
        ipcRendererSend("roundPhase", "GUESS THIS");
        await wordGuesser.update(currentWord);
    }

    if (description === RoundDescription.DRAW_THIS) {
        currentRoundDescription = RoundDescription.DRAW_THIS;
        ipcRendererSend("roundPhase", "DRAW THIS");
        currentWord = currentWordDiv?.querySelector<HTMLDivElement>(".word")?.innerHTML || "";
        ipcRendererSend("currentWord", currentWord);
    }
});

const observerTargets = [
    { id: "game-canvas" },
    { id: "game-toolbar" },
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
    let gameCanvas: HTMLCanvasElement ;
    let gameColors: NodeListOf<HTMLDivElement>;
    
    const watcher = new MutationObserver(() => {
        for (const [id, target] of pending) {
            const element = document.getElementById(id);
            if (!element) continue;

            if (id === "game-canvas") {
                const canvas = element.querySelector<HTMLCanvasElement>("canvas");
                if (!canvas) continue;

                console.log("Canvas found");
                gameCanvas = canvas;
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
            if (id === "game-toolbar") {
                const colors = element.querySelectorAll<HTMLDivElement>(".color");
                if (!colors) continue;

                console.log("Colors found");
                gameColors = colors;
                pending.delete(id);
            }
        }

        if (pending.size === 0) {
            console.log("All elements found. Disconnecting body observer");
            imageDrawer = new ImageDrawer(gameCanvas, gameColors);
            watcher.disconnect()
        }
    });

    watcher.observe(document.body, { childList: true, subtree: true })
});

// Handle draw request
ipcRendererOn("drawImage", (imageUrl) => {
    if (currentRoundDescription !== RoundDescription.DRAW_THIS) {
        console.log(`Current round phase is ${currentRoundDescription}. Unable to draw`);
        return;
    }
    
    imageDrawer.draw(imageUrl);
});

ipcRendererOn("cancelProcess", (process) => {
    switch (process) {
        case "wordGuesser":
            wordGuesser.stop();
            break;
        case "imageDrawer":
            imageDrawer.reset();
            break;
        default:
            console.log(`Process [${process}] not found`)
    }
});

ipcRendererOn("resumeProcess", (process) => {
    switch (process) {
        case "wordGuesser":
            wordGuesser.resume();
            break;
        case "imageDrawer":
            break
        default:
            console.log(`Process [${process}] not found`)
    }
});

ipcRendererOn("guessWord", (word) => {
    wordGuesser.guessWordUser(word);
});