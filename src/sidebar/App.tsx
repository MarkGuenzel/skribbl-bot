import { useEffect, useState } from 'react';
import './App.css'
import { Button } from './components/ui/button'
import { PanelLeft } from 'lucide-react'

const SIDEBAR_WIDTH = 320;

function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.electron.sendSidebarResize(
      "sidebarResize",
      open ? SIDEBAR_WIDTH : 40
    )
  }, [open])

  return (
    <>
      <Button
        onClick={() => {setOpen(prev => !prev)}}
      >
        <PanelLeft/>
      </Button>
    </>
  )
}

export default App
