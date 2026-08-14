import {ipcRendererInvoke} from "./ipc.js"
import { Mutex } from "async-mutex";

// Draw the word
let gameCanvas: HTMLCanvasElement;
const canvasObserver = new MutationObserver(() => {
    console.log("Canvas changed");
});

// Gues the word
let chatInput: HTMLInputElement;
let currentWordDiv: HTMLElement;
const currentWordList: string[] = [];
const wordListMutex = new Mutex();
let wordGuesserId: NodeJS.Timeout;

const guessWord = async () => {
    await wordListMutex.runExclusive(() => {
        const word = currentWordList.length === 1 ? currentWordList[0] : currentWordList.pop(); // make sure the list if never empty

        if (word) {
            chatInput.value = word;
            chatInput.form?.requestSubmit();
        }
    });
}

const currentWordObserver = new MutationObserver(async () => {
    const hintDivs = currentWordDiv?.querySelectorAll<HTMLDivElement>(".hint");
    const description = currentWordDiv?.querySelectorAll<HTMLDivElement>(".description")[0].innerHTML;

    let currentWord = "";
    for (const letterDiv of hintDivs) {
        currentWord += letterDiv.innerText;
    }

    if (description === "WAITING") {
        console.log("Round ended");
        console.log("Killing guesser");
        clearInterval(wordGuesserId);
        await wordListMutex.runExclusive(() => {
            currentWordList.length = 0; // clear array in place
        });
        return;
    }

    if (description === "GUESS THIS") {
        // Begining of guessing round
        if (currentWordList.length === 0) {
            console.log("Word list is length is 0")
            await wordListMutex.runExclusive(async () => {
                currentWordList.push(...(await ipcRendererInvoke("getWordList", currentWord.length)));
                console.log(`Current word: ${currentWord}`);
            });

            console.log("Spawning guesser");
            wordGuesserId = setInterval(guessWord, 2_000);
            return;
        }

        // Word revealed
        if (!currentWord.includes("_")) {
            console.log("Killing guesser");
            clearInterval(wordGuesserId);
            return;
        }

        // Hint unlocked
        //TODO Spaces in word bricks the regex
        console.log(currentWord);
        const regexPattern = currentWord
            .split("")
            .map(char => (char === "_"  ? "." : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
            .join("");

        const regexp = new RegExp(`^${regexPattern}$`, "i");

        await wordListMutex.runExclusive(() => {
            let filteredList = [...currentWordList];
            filteredList = filteredList.filter(word => regexp.test(word));

            currentWordList.length = 0;
            currentWordList.push(...filteredList);

            console.log(`List length: ${currentWordList.length}`);
            console.log(`Word List: ${currentWordList.slice(0, 10)}`);
        });
    }

    if (description === "DRAW THIS") {
        // draw code
    }
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