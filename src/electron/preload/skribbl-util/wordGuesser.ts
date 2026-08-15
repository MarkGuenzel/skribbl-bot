import { Mutex } from "async-mutex";
import { ipcRendererInvoke } from "../ipc.js";

export default class WordGuesser {
    private readonly chatInput: HTMLInputElement;
    private readonly currentWordList: string[] = [];
    private readonly wordListMutex = new Mutex();
    private wordGuesserId!: NodeJS.Timeout;

    constructor(chatInput: HTMLInputElement) {
        this.chatInput = chatInput;
    }

    public async reset() {
        console.log("Resetting Word Guesser");
        clearInterval(this.wordGuesserId);
        await this.wordListMutex.runExclusive(() => {
            this.currentWordList.splice(0);
        });
    }

    public async update(currentWord: string) {
        // Beginning of guessing round
        if (this.currentWordList.length === 0 && currentWord.includes("_")) {
            await this.wordListMutex.runExclusive(async () => {
                this.currentWordList.push(...(await ipcRendererInvoke("getWordList", currentWord.length)));
            });

            console.log("Spawning Word Guesser");
            this.wordGuesserId = setInterval(this.guessWord, 2_000);
            return;
        }

        // Word revealed - round ended
        if (!currentWord.includes("_")) {
            await this.reset();
            return;
        }

        // Hint unlocked
        const regex = this.createRegExp(currentWord);
        await this.wordListMutex.runExclusive(async () => {
            const newItems = [...this.currentWordList].filter(word => regex.test(word));
            console.log(`New items: ${newItems.slice(0, 10)}`)

            if (newItems.length === 0) {
                console.log("Word not in database");
                await this.reset();
            }
            else {
                this.currentWordList.splice(0);
                this.currentWordList.push(...newItems);
            }
        });
    }

    private guessWord = async () => {
        await this.wordListMutex.runExclusive(() => {
            console.log(`Word list length: ${this.currentWordList.length}`)
            const word = this.currentWordList.length === 1 ? this.currentWordList[0] : this.currentWordList.pop();

            if (word) {
                this.chatInput.value = word;
                this.chatInput.form?.requestSubmit();
            }
        });
    }

    private createRegExp(word: string): RegExp {
        const pattern = word
            .split("")
            .map(char => (char === "_"  ? "." : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
            .join("");
        
        return new RegExp(`^${pattern}$`, "i");
    }
}