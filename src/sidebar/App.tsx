import { useEffect, useRef, useState } from 'react';
import './App.css'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { PanelLeft, Search, SendHorizontal, Play, Pause, Loader2 } from 'lucide-react'
import { cn } from './lib/utils'
import type { RoundPhase } from '../shared/electron-api'

const OPEN_WIDTH = 400;
const COLLAPSED_WIDTH = 40;
const MAX_CANDIDATES_SHOWN = 60;

type WordGuesserState = {
  isRunning: boolean
  currentWordList: string[]
}

type ImageDrawerState = {
  isRunning: boolean
  imageToDraw?: string
  totalAmountStrokes: number
  strokesDrawn: number
}

function App() {
  const [open, setOpen] = useState(false);
  const [roundPhase, setRoundPhase] = useState<RoundPhase>("WAITING");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [wordGuesser, setWordGuesser] = useState<WordGuesserState>({
    isRunning: false,
    currentWordList: [],
  });
  const [imageDrawer, setImageDrawer] = useState<ImageDrawerState>({
    isRunning: false,
    totalAmountStrokes: 0,
    strokesDrawn: 0,
  });
  const previousPhase = useRef<RoundPhase>("WAITING");

  useEffect(() => {
    window.electron.sendSidebarResize(open ? OPEN_WIDTH : COLLAPSED_WIDTH)
  }, [open])

  useEffect(() => {
    window.electron.onWordGuesserUpdate((update) => {
      setWordGuesser((prev) => ({ ...prev, ...update }));
    });
    window.electron.onImageDrawerUpdate((update) => {
      setImageDrawer((prev) => ({ ...prev, ...update }));
      if (update.imageUrls) {
        setImageUrls(update.imageUrls);
        setSelectedUrl(null);
      }
    });
    window.electron.onRoundPhaseUpdate((phase) => {
      // Entering a fresh drawing phase: clear the previous round's preview/selection
      // so a stale image doesn't flash before the new one is picked.
      if (phase === "DRAW THIS" && previousPhase.current !== "DRAW THIS") {
        setSelectedUrl(null);
        setImageDrawer((prev) => ({ ...prev, imageToDraw: undefined }));
      }
      previousPhase.current = phase;
      setRoundPhase(phase);
    });
  }, []);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query || searchLoading) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const urls = await window.electron.getImages(query);
      setImageUrls(urls);
      setSelectedUrl(null);
    }
    catch (error) {
      console.error("Error fetching images: ", error);
      setSearchError("Couldn't reach image search. Check that SearXNG is running, then try again.");
    }
    finally {
      setSearchLoading(false);
    }
  };

  const handleSelectImage = (url: string) => {
    setSelectedUrl(url);
    window.electron.drawImage(url);
  };

  const handleSendGuess = () => {
    if (!chatInput.trim()) return;

    window.electron.guessWord(chatInput);
    setChatInput("");
  };

  if (!open) {
    return (
      <div className="flex h-screen w-full flex-col items-center gap-2 bg-background pt-2">
        <Button size="icon" variant="outline" onClick={() => setOpen(true)} aria-label="Open bot panel">
          <PanelLeft />
        </Button>
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            wordGuesser.isRunning || imageDrawer.isRunning ? "bg-go status-dot--running" : "bg-muted-foreground/40"
          )}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h1 className="text-sm font-semibold tracking-tight">skribbl-bot</h1>
        <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Collapse bot panel">
          <PanelLeft />
        </Button>
      </header>

      {roundPhase === "WAITING" && <WaitingPanel />}

      {roundPhase === "GUESS THIS" && (
        <GuessingPanel
          wordGuesser={wordGuesser}
          onPause={() => window.electron.cancelProcess("wordGuesser")}
          onResume={() => window.electron.resumeProcess("wordGuesser")}
        />
      )}

      {roundPhase === "DRAW THIS" && (
        <DrawingPanel
          imageDrawer={imageDrawer}
          imageUrls={imageUrls}
          selectedUrl={selectedUrl}
          onSelectImage={handleSelectImage}
          onCancel={() => window.electron.cancelProcess("imageDrawer")}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          searchLoading={searchLoading}
          searchError={searchError}
        />
      )}

      {roundPhase !== "DRAW THIS" && (
        <div className="mt-auto flex gap-1.5 border-t border-border p-3">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendGuess()}
            placeholder="Type a guess…"
            aria-label="Manual guess"
          />
          <Button size="icon" onClick={handleSendGuess} aria-label="Send guess">
            <SendHorizontal />
          </Button>
        </div>
      )}
    </div>
  )
}

function WaitingPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
      <p className="text-sm text-muted-foreground">Waiting for the round to start…</p>
    </div>
  );
}

function GuessingPanel({
  wordGuesser,
  onPause,
  onResume,
}: {
  wordGuesser: WordGuesserState
  onPause: () => void
  onResume: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
      <StatusRow
        label="Word Guesser"
        isRunning={wordGuesser.isRunning}
        detail={
          wordGuesser.isRunning
            ? wordGuesser.currentWordList.length > 0
              ? `${wordGuesser.currentWordList.length} candidate${wordGuesser.currentWordList.length === 1 ? "" : "s"} left`
              : "guessing…"
            : "paused"
        }
        onPause={onPause}
        onResume={onResume}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-md border border-border bg-secondary/20 p-2">
        <CandidateWords words={wordGuesser.currentWordList} />
      </div>
    </div>
  );
}

function CandidateWords({ words }: { words: string[] }) {
  if (words.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No candidates match the hint yet.
      </p>
    );
  }

  const shown = words.slice(0, MAX_CANDIDATES_SHOWN);
  const remaining = words.length - shown.length;

  return (
    <div className="flex flex-wrap content-start gap-1">
      {shown.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {word}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-1.5 py-0.5 text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  );
}

function DrawingPanel({
  imageDrawer,
  imageUrls,
  selectedUrl,
  onSelectImage,
  onCancel,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchLoading,
  searchError,
}: {
  imageDrawer: ImageDrawerState
  imageUrls: string[]
  selectedUrl: string | null
  onSelectImage: (url: string) => void
  onCancel: () => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  searchLoading: boolean
  searchError: string | null
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
      <StatusRow
        label="Image Drawer"
        isRunning={imageDrawer.isRunning}
        detail={
          imageDrawer.isRunning
            ? imageDrawer.totalAmountStrokes > 0
              ? `${imageDrawer.strokesDrawn}/${imageDrawer.totalAmountStrokes} strokes`
              : "drawing…"
            : "idle"
        }
        onPause={onCancel}
      />

      {imageDrawer.isRunning && imageDrawer.totalAmountStrokes > 0 && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-sm bg-muted"
          role="progressbar"
          aria-valuenow={imageDrawer.strokesDrawn}
          aria-valuemin={0}
          aria-valuemax={imageDrawer.totalAmountStrokes}
        >
          <div
            className="h-full bg-go transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, (imageDrawer.strokesDrawn / imageDrawer.totalAmountStrokes) * 100)}%` }}
          />
        </div>
      )}

      {imageDrawer.imageToDraw && (
        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-medium text-muted-foreground">Drawing this</span>
          <div className="overflow-hidden rounded-md border border-panel-border">
            <img
              src={imageDrawer.imageToDraw}
              alt="Palette-converted preview of what's being drawn"
              className="max-h-32 w-full object-contain bg-muted"
            />
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search a reference image…"
          aria-label="Search reference images"
          disabled={searchLoading}
        />
        <Button
          size="icon"
          onClick={onSearch}
          disabled={searchLoading || !searchQuery.trim()}
          aria-label="Search"
        >
          {searchLoading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </div>

      {searchError && (
        <p role="alert" className="text-xs text-stop-active">
          {searchError}
        </p>
      )}

      <div className="grid min-h-0 auto-rows-min grid-cols-3 gap-1.5 overflow-y-auto">
        {imageUrls.length === 0 && (
          <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">
            No reference images yet. They appear here automatically on your turn, or search for your own.
          </p>
        )}
        {imageUrls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onSelectImage(url)}
            aria-pressed={selectedUrl === url}
            className={cn(
              "overflow-hidden rounded-md border-2 border-border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              selectedUrl === url && "border-select"
            )}
          >
            <img src={url} alt="Search result" className="h-16 w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusRow({
  label,
  isRunning,
  detail,
  onPause,
  onResume,
}: {
  label: string
  isRunning: boolean
  detail: string
  onPause: () => void
  onResume?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            isRunning ? "bg-go status-dot--running" : "bg-muted-foreground/40"
          )}
          aria-hidden
        />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-semibold">{label}</span>
          <span className="truncate text-[0.7rem] text-muted-foreground">{detail}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {isRunning ? (
          <Button
            size="icon-sm"
            className="bg-stop text-stop-foreground hover:bg-stop-active"
            onClick={onPause}
            aria-label={`Pause ${label}`}
          >
            <Pause />
          </Button>
        ) : (
          onResume && (
            <Button
              size="icon-sm"
              className="bg-go text-go-foreground hover:bg-go-active"
              onClick={onResume}
              aria-label={`Resume ${label}`}
            >
              <Play />
            </Button>
          )
        )}
      </div>
    </div>
  )
}

export default App
