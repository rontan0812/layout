import './style.css'
import ReactDOM from 'react-dom/client'
import { useState } from 'react'

import LeftBar from './LeftBar'
import Room from './Room'

const root = ReactDOM.createRoot(document.querySelector('#root'))


export default function App() {

    // about Room
    const [roomWidth, setRoomWidth] = useState(() => {
        const v = parseInt(localStorage.getItem('roomWidth'), 10)
        return Number.isFinite(v) ? v : 10
    })
    const [roomHeight, setRoomHeight] = useState(() => {
        const v = parseInt(localStorage.getItem('roomHeight'), 10)
        return Number.isFinite(v) ? v : 10
    })

    const [isMakingRoom, setIsMakingRoom] = useState(() => {
        const w = localStorage.getItem('roomWidth');
        const h = localStorage.getItem('roomHeight');
        return (w && h);
    });

    const [roomVisible, setRoomVisible] = useState(() => {
        const w = localStorage.getItem('roomWidth')
        const h = localStorage.getItem('roomHeight')
        return Boolean(w && h)
    })

    const handleCreate = (width, height) => {
        setRoomWidth(width)
        setRoomHeight(height)
        setRoomVisible(true)
        try {
            localStorage.setItem('roomWidth', String(width))
            localStorage.setItem('roomHeight', String(height))
        } catch (e) {
        }
    }

    const handleStart = (making) => {
        setIsMakingRoom(Boolean(making))
    }

    const handleDelete = () => {
        try {
            localStorage.removeItem('roomWidth')
            localStorage.removeItem('roomHeight')
        } catch (e) {}
        setRoomVisible(false)
        setRoomWidth(10)
        setRoomHeight(10)
        setIsMakingRoom(false)
    }




    // about Furniture
    const [furnitureList, setFurnitureList] = useState(() => {
        try {
            const raw = localStorage.getItem('furnitureList')
            if (!raw) return []
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
        } catch (e) {
            return []
        }
    })

    const persistFurniture = (list) => {
        try { localStorage.setItem('furnitureList', JSON.stringify(list)) } catch (e) {}
    }

    const handleAddFurniture = (f) => {
        if (!f) return
        setFurnitureList(prev => {
            const next = [...prev, f]
            persistFurniture(next)
            return next
        })
    }

    const handleRemoveFurniture = (index) => {
        setFurnitureList(prev => {
            const next = prev.filter((_, i) => i !== index)
            persistFurniture(next)
            return next
        })
    }

    const [selectedIndex, setSelectedIndex] = useState(null)

    const handleClearFurniture = () => {
        setFurnitureList([])
        persistFurniture([])
        setSelectedIndex(null)
    }
    

    const handleSelectFurniture = (index) => {
        setSelectedIndex(index)
    }

    const handleUpdateFurniture = (index, updated) => {
        setFurnitureList(prev => {
            const next = prev.map((it, i) => i === index ? { ...it, ...updated } : it)
            persistFurniture(next)
            return next
        })
    }



    

    return (
        <div className="appContainer">
            <LeftBar
                onCreate={handleCreate}
                onStart={handleStart}
                onDelete={handleDelete}
                onAddFurniture={handleAddFurniture}
                onRemoveFurniture={handleRemoveFurniture}
                onClearFurniture={handleClearFurniture}
                onUpdateFurniture={handleUpdateFurniture}
                selectedIndex={selectedIndex}
                onSelectFurniture={handleSelectFurniture}
                furnitureList={furnitureList}
                making={isMakingRoom}
                initialWidth={roomWidth}
                initialHeight={roomHeight}
            />
            {roomVisible ? (
                <Room width={roomWidth} height={roomHeight} furnitureList={furnitureList} selectedIndex={selectedIndex} onSelectFurniture={handleSelectFurniture} />
            ) : (
                <div className="room" />
            )}
        </div>
    )
}

root.render(<App />)