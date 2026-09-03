import { useEffect, useState } from 'react';
import './App.css'
import { Button } from './components/ui/button'
import { PanelLeft, Search } from 'lucide-react'
import { Input } from './components/ui/input';

const SIDEBAR_WIDTH = 500;

function App() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          onClick={() => {window.electron.searchImages(searchQuery)}}
        >
          <Search/>
        </Button> 
      </div>
    </>
  )
}

export default App
