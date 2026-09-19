import { Mutex } from "async-mutex";
import { ipcRendererInvoke, ipcRendererSend } from "../ipc.js";

/**
 * Automates guessing the secret word during skribbl.io's guessing rounds.
 *
 * `update()` is meant to be called every time the current word's hint text changes (e.g.
 * "_ _ _" → "c _ t"). It builds a candidate word list from the main process's bundled
 * word-frequency database on the first hint of a round, then narrows that list down as
 * more letters are revealed, matching each candidate against the hint pattern. While
 * running, a candidate is submitted through the chat input on a fixed interval.
 *
 * `currentWordList` is shared between the interval-driven guesser and `update()`'s
 * narrowing logic, both of which run asynchronously, so all reads/writes to it go through
 * `wordListMutex` to avoid a guess being submitted mid-narrowing.
 */
export default class WordGuesser {
    private readonly chatInput: HTMLInputElement;
    private readonly currentWordList: string[] = [];
    private readonly wordListMutex = new Mutex();
    private wordGuesserId!: NodeJS.Timeout;
    private isRunning = false;

    /** @param chatInput The skribbl.io chat `<input>` that guesses are submitted through. */
    constructor(chatInput: HTMLInputElement) {
        this.chatInput = chatInput;
    }

    /** Clears the candidate word list and stops guessing — called once a round ends. */
    public async reset() {
        console.log("Resetting Word Guesser");
        clearInterval(this.wordGuesserId);
        await this.wordListMutex.runExclusive(() => {
            this.currentWordList.splice(0);
        });
        this.stop();
    }

    /** Pauses automatic guessing without discarding the current candidate word list. */
    public stop() {
        this.isRunning = false;
        this.sendUpdate({isRunning: this.isRunning});
        console.log("Pausing Word Guesser");
    }

    /** Resumes automatic guessing after a {@link stop}. */
    public resume() {
        this.isRunning = true;
        this.sendUpdate({isRunning: this.isRunning});
        console.log("Resuming Image Drawer");
    }

    /** Submits a user-supplied word as a manual guess, bypassing the automatic candidate list. */
    public async guessWordUser(word: string) {
        await this.wordListMutex.runExclusive(() => {
            if (word.trim() === "") return;

            this.chatInput.value = word;
            this.chatInput.form?.requestSubmit();
        });
    }

    /**
     * Reacts to a change in the current word's hint text (skribbl.io renders unrevealed
     * letters as `_`). Handles three cases:
     * - First hint of a round (empty candidate list): fetches a fresh candidate list from
     *   the main process, sized to the word's length, and starts the guessing interval.
     * - Word fully revealed (no more `_`): the round ended, so resets and stops.
     * - A new letter was revealed: narrows the candidate list to words matching the
     *   updated hint pattern; if nothing matches (the real word isn't in the local
     *   database), gives up and resets rather than guessing blindly.
     *
     * @param currentWord The word's current hint text, e.g. `"c_t"`.
     */
    public async update(currentWord: string) {
        // Beginning of guessing round
        if (this.currentWordList.length === 0 && currentWord.includes("_")) {
            await this.wordListMutex.runExclusive(async () => {
                this.currentWordList.push(...(await ipcRendererInvoke("getWordList", currentWord.length)));
            });

            console.log("Spawning Word Guesser");
            this.isRunning = true;
            this.wordGuesserId = setInterval(this.guessWord, 2_000);
            this.sendUpdate({isRunning: this.isRunning, currentWordList: this.currentWordList});
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
            this.sendUpdate({currentWordList: this.currentWordList})
        });
    }

    private sendUpdate(update: WordGuesserUpdate) {
        ipcRendererSend("wordGuesserUpdate", update);
    }

    /**
     * Interval tick: submits one candidate word as a guess. Candidates are popped off the
     * end of the list so each guess is only tried once, except when a single candidate
     * remains — then it's resubmitted every tick since it's presumably the answer.
     */
    private guessWord = async () => {
        await this.wordListMutex.runExclusive(() => {
            if (!this.isRunning) return;

            console.log(`Word list length: ${this.currentWordList.length}`)
            const word = this.currentWordList.length === 1 ? this.currentWordList[0] : this.currentWordList.pop();

            if (word) {
                this.chatInput.value = word;
                this.chatInput.form?.requestSubmit();
            }
        });
    }

    /**
     * Turns a hint like `"c_t"` into a case-insensitive regex (`/^c.t$/i`) that matches
     * candidate words of the right shape: `_` becomes a wildcard, revealed letters are
     * escaped and matched literally.
     */
    private createRegExp(word: string): RegExp {
        const pattern = word
            .split("")
            .map(char => (char === "_"  ? "." : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
            .join("");
        
        return new RegExp(`^${pattern}$`, "i");
    }
}