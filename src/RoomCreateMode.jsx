import { useEffect, useMemo, useState } from 'react'
import { ROOM_SHAPE_OPTIONS, getRoomPolygonPoints, normalizeRoomShape } from './roomShape'

const PREVIEW_SCALE = 3

export default function RoomCreateMode({ width = 10, height = 10, shape = 'rectangle', onShapeChange = () => {}, onSizeChange = () => {} }) {
    const currentShape = normalizeRoomShape(shape)
    const [widthInput, setWidthInput] = useState(String(width))
    const [heightInput, setHeightInput] = useState(String(height))

    useEffect(() => {
        setWidthInput(String(width))
    }, [width])

    useEffect(() => {
        setHeightInput(String(height))
    }, [height])

    const safeWidth = Math.max(1, Number(width) || 1)
    const safeHeight = Math.max(1, Number(height) || 1)
    const viewWidth = safeWidth * PREVIEW_SCALE
    const viewHeight = safeHeight * PREVIEW_SCALE
    const offsetX = (viewWidth - safeWidth) / 2
    const offsetY = (viewHeight - safeHeight) / 2
    const points = useMemo(() => {
        const polygon = getRoomPolygonPoints(currentShape, safeWidth, safeHeight)
        return polygon.map((p) => `${p.x},${p.y}`).join(' ')
    }, [currentShape, safeWidth, safeHeight])
    const vLines = useMemo(() => Array.from({ length: Math.ceil(viewWidth) + 1 }, (_, i) => i), [viewWidth])
    const hLines = useMemo(() => Array.from({ length: Math.ceil(viewHeight) + 1 }, (_, i) => i), [viewHeight])

    const commitSizeChange = (nextWidthText, nextHeightText) => {
        const nextWidth = Math.max(1, parseInt(nextWidthText, 10) || 1)
        const nextHeight = Math.max(1, parseInt(nextHeightText, 10) || 1)
        onSizeChange(nextWidth, nextHeight)
    }

    return (
        <div className="room room-create-mode">
            <aside className="room-create-sidebar">
                <h3>部屋形状</h3>
                <p className="room-create-help">左で形状を選び、右でプレビューを確認できます。</p>
                <div className="room-shape-list">
                    {ROOM_SHAPE_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={`room-shape-button ${currentShape === option.id ? 'is-active' : ''}`}
                            onClick={() => onShapeChange(option.id)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="room-create-meta">
                    <p>
                        横幅:
                        <input
                            type="number"
                            min={1}
                            value={widthInput}
                            onChange={(e) => {
                                const next = e.target.value
                                setWidthInput(next)
                                commitSizeChange(next, heightInput)
                            }}
                        />
                        m
                    </p>
                    <p>
                        縦幅:
                        <input
                            type="number"
                            min={1}
                            value={heightInput}
                            onChange={(e) => {
                                const next = e.target.value
                                setHeightInput(next)
                                commitSizeChange(widthInput, next)
                            }}
                        />
                        m
                    </p>
                </div>
            </aside>

            <section className="room-create-preview" aria-label="部屋形状プレビュー">
                <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="部屋形状" preserveAspectRatio="xMidYMid meet">
                    <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#ffffff" />
                    <g stroke="#000000" strokeWidth="0.03" opacity="0.45">
                        {hLines.map((y) => (
                            <line key={`h-${y}`} x1="0" y1={y} x2={viewWidth} y2={y} />
                        ))}
                        {vLines.map((x) => (
                            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2={viewHeight} />
                        ))}
                    </g>
                    <g transform={`translate(${offsetX} ${offsetY})`}>
                        <polygon points={points} fill="#ffffff" stroke="#000000" strokeWidth="0.15" />
                    </g>
                </svg>
            </section>
        </div>
    )
}
