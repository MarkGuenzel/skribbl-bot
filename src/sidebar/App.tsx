import { useEffect, useState } from 'react';
import './App.css'
import { Button } from './components/ui/button'
import { PanelLeft, Search, SendHorizontal } from 'lucide-react'
import { Input } from './components/ui/input';

const SIDEBAR_WIDTH = 500;

function App() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    window.electron.sendSidebarResize(open ? SIDEBAR_WIDTH : 40)
  }, [open])

  return (
    <>
      <Button
        onClick={() => {setOpen(prev => !prev)}}
      >
        <PanelLeft/>
      </Button>
      <div className='flex'>
        <Input 
          value={searchQuery}
          onChange={(e) => {setSearchQuery(e.target.value)}}
        />
        <Button
          onClick={async () => {
            if (!searchQuery.trim()) return;

            try {
              const urls = await window.electron.getImages(searchQuery);
              setImageUrls(urls);
              console.log(imageUrls)
            }
            catch (error) {
              console.error("Error fetching images: ", error);
            }
          }}
        >
          <Search/>
        </Button> 
      </div>

      <div className='flex'>
        <Input 
          value={chatInput}
          onChange={(e) => {setChatInput(e.target.value)}}
        />
        <Button
          onClick={async () => {
            if (!chatInput.trim()) return;

            window.electron.guessWord(chatInput);
          }}
        >
          <SendHorizontal/>
        </Button> 
      </div>
      <Button
        onClick={() => window.electron.cancelProcess("imageDrawer")}
      >
        Cancel Drawing
      </Button>
      <Button
        onClick={() => window.electron.cancelProcess("wordGuesser")}
      >
        Pause Word Guesser
      </Button>
            <Button
        onClick={() => window.electron.resumeProcess("wordGuesser")}
      >
        Resume Word Guesser
      </Button>
      <div>
          {imageUrls.length > 0 && (
            imageUrls.map((url) => (
              <button
                className={`rounded-lg overflow-hidden border-2 transition-colors`}
                key={url}
                onClick={() => window.electron.drawImage(url)}
              >
                <img src={url} alt="Search result" className="w-full h-24 object-cover" />
              </button>
            ))
          )}
      </div>
    </>
  )
}

export default App
