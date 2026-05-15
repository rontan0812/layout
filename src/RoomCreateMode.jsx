import { useEffect, useMemo, useRef, useState } from 'react'
import {
    ROOM_SHAPE_OPTIONS,
    getRoomPolygonPoints,
    normalizeRoomInset,
    normalizeRoomInsetPair,
    normalizeRoomShape,
} from './roomShape'

const MIN_ROOM_SIZE = 1
const MAX_ROOM_SIZE = 100
const HANDLE_RADIUS = 0.3
const LEGACY_PREVIEW_SCALE = 3
const LEGACY_THRESHOLD = 20
const MIN_PREVIEW_SCALE = 1.2
const EPS = 1e-6

export default function RoomCreateMode({
    width = 10,
    height = 10,
    shape = 'rectangle',
    inset = 0.35,
    onShapeChange = () => {},
    onSizeChange = () => {},
    onInsetChange = () => {},
}) {
    const currentShape = normalizeRoomShape(shape)
    const currentInset = normalizeRoomInsetPair(inset)
    const [widthInput, setWidthInput] = useState(String(width))
    const [heightInput, setHeightInput] = useState(String(height))
    const [dragState, setDragState] = useState(null)
    const svgRef = useRef(null)

    useEffect(() => {
        setWidthInput(String(width))
    }, [width])

    useEffect(() => {
        setHeightInput(String(height))
    }, [height])

    const safeWidth = Math.max(1, Number(width) || 1)
    const safeHeight = Math.max(1, Number(height) || 1)
    const baseWidthForView = dragState?.startWidth ?? safeWidth
    const baseHeightForView = dragState?.startHeight ?? safeHeight
    const maxSide = Math.max(baseWidthForView, baseHeightForView)
    const dynamicScale = maxSide <= LEGACY_THRESHOLD
        ? LEGACY_PREVIEW_SCALE
        : Math.max(MIN_PREVIEW_SCALE, LEGACY_PREVIEW_SCALE * (LEGACY_THRESHOLD / maxSide))
    const viewWidth = baseWidthForView * dynamicScale
    const viewHeight = baseHeightForView * dynamicScale
    const isDragging = dragState != null
    const offsetX = isDragging
        ? (viewWidth - baseWidthForView) / 2
        : (viewWidth - safeWidth) / 2
    const offsetY = isDragging
        ? (viewHeight - baseHeightForView) / 2
        : (viewHeight - safeHeight) / 2
    const dragShiftX = isDragging && dragState?.type === 'size' && dragState?.affectsX && dragState?.sideX === 'left'
        ? (dragState.startWidth - safeWidth)
        : 0
    const dragShiftY = isDragging && dragState?.type === 'size' && dragState?.affectsY && dragState?.sideY === 'top'
        ? (dragState.startHeight - safeHeight)
        : 0
    const polygonPoints = useMemo(() => getRoomPolygonPoints(currentShape, safeWidth, safeHeight, currentInset), [currentShape, safeWidth, safeHeight, currentInset])
    const points = useMemo(() => polygonPoints.map((p) => `${p.x},${p.y}`).join(' '), [polygonPoints])
    const edgeHandles = useMemo(() => {
        const centerX = safeWidth / 2
        const centerY = safeHeight / 2
        const minX = 0
        const maxX = safeWidth
        const minY = 0
        const maxY = safeHeight

        return polygonPoints.map((start, i) => {
            const end = polygonPoints[(i + 1) % polygonPoints.length]
            const dx = end.x - start.x
            const dy = end.y - start.y
            const absDx = Math.abs(dx)
            const absDy = Math.abs(dy)
            const vertical = absDx < EPS
            const horizontal = absDy < EPS
            const mx = (start.x + end.x) / 2
            const my = (start.y + end.y) / 2
            const sideX = mx < centerX ? 'left' : 'right'
            const sideY = my < centerY ? 'top' : 'bottom'
            const affectsX = !horizontal
            const affectsY = !vertical

            const isOnOuterVertical = vertical && (Math.abs(start.x - minX) < EPS || Math.abs(start.x - maxX) < EPS)
            const isOnOuterHorizontal = horizontal && (Math.abs(start.y - minY) < EPS || Math.abs(start.y - maxY) < EPS)
            const isOuterEdge = (!vertical && !horizontal) || isOnOuterVertical || isOnOuterHorizontal
            const type = isOuterEdge ? 'size' : 'inset'

            const insetAxis = vertical ? 'x' : horizontal ? 'y' : null
            const insetDirection = insetAxis === 'x'
                ? (sideX === 'left' ? 1 : -1)
                : insetAxis === 'y'
                    ? (sideY === 'top' ? 1 : -1)
                    : 0

            let handleClassName = 'room-drag-handle'
            if (horizontal) handleClassName += ' room-drag-handle-vertical'
            if (!horizontal && !vertical) handleClassName += ' room-drag-handle-diagonal'
            if (type === 'inset') handleClassName += ' room-drag-handle-inset'

            return {
                key: `edge-${i}`,
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                mx,
                my,
                sideX,
                sideY,
                affectsX,
                affectsY,
                type,
                insetAxis,
                insetDirection,
                handleClassName,
            }
        })
    }, [polygonPoints, safeWidth, safeHeight])
    const vLines = useMemo(() => Array.from({ length: Math.ceil(viewWidth) + 1 }, (_, i) => i), [viewWidth])
    const hLines = useMemo(() => Array.from({ length: Math.ceil(viewHeight) + 1 }, (_, i) => i), [viewHeight])

    const clampRoomSize = (value) => Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, value))

    const commitSizeChange = (nextWidthText, nextHeightText) => {
        const nextWidth = clampRoomSize(parseInt(nextWidthText, 10) || MIN_ROOM_SIZE)
        const nextHeight = clampRoomSize(parseInt(nextHeightText, 10) || MIN_ROOM_SIZE)
        onSizeChange(nextWidth, nextHeight)
    }

    const startDrag = (handle, event) => {
        const point = getLocalPoint(event.clientX, event.clientY)
        setDragState({
            type: handle.type,
            sideX: handle.sideX,
            sideY: handle.sideY,
            affectsX: handle.affectsX,
            affectsY: handle.affectsY,
            insetAxis: handle.insetAxis,
            insetDirection: handle.insetDirection,
            startWidth: safeWidth,
            startHeight: safeHeight,
            startInset: currentInset,
            startX: point?.x ?? (safeWidth / 2),
            startY: point?.y ?? (safeHeight / 2),
        })
    }

    const getLocalPoint = (clientX, clientY) => {
        const svg = svgRef.current
        if (!svg) return null
        const rect = svg.getBoundingClientRect()
        if (!rect.width || !rect.height) return null

        const xInView = ((clientX - rect.left) / rect.width) * viewWidth
        const yInView = ((clientY - rect.top) / rect.height) * viewHeight

        return {
            x: xInView - offsetX,
            y: yInView - offsetY,
        }
    }

    useEffect(() => {
        if (!dragState) return

        const onPointerMove = (event) => {
            const point = getLocalPoint(event.clientX, event.clientY)
            if (!point) return

            const deltaX = point.x - dragState.startX
            const deltaY = point.y - dragState.startY

            if (dragState.type === 'inset') {
                let deltaInset = 0
                if (dragState.insetAxis === 'x') {
                    deltaInset = (dragState.insetDirection * deltaX) / Math.max(1, dragState.startWidth)
                } else if (dragState.insetAxis === 'y') {
                    deltaInset = (dragState.insetDirection * deltaY) / Math.max(1, dragState.startHeight)
                }
                const nextInset = dragState.insetAxis === 'x'
                    ? {
                        x: normalizeRoomInset(dragState.startInset.x + deltaInset),
                        y: dragState.startInset.y,
                    }
                    : {
                        x: dragState.startInset.x,
                        y: normalizeRoomInset(dragState.startInset.y + deltaInset),
                    }
                onInsetChange(nextInset)
                return
            }

            let nextWidth = dragState.startWidth
            let nextHeight = dragState.startHeight

            if (dragState.affectsX) {
                const widthSign = dragState.sideX === 'left' ? -1 : 1
                nextWidth = clampRoomSize(Math.round(dragState.startWidth + widthSign * deltaX))
            }

            if (dragState.affectsY) {
                const heightSign = dragState.sideY === 'top' ? -1 : 1
                nextHeight = clampRoomSize(Math.round(dragState.startHeight + heightSign * deltaY))
            }

            setWidthInput(String(nextWidth))
            setHeightInput(String(nextHeight))
            onSizeChange(nextWidth, nextHeight)
        }

        const onPointerUp = () => {
            setDragState(null)
        }

        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [dragState, onSizeChange, viewWidth, viewHeight, offsetX, offsetY])

    return (
        <div className="room room-create-mode">
            <aside className="room-create-sidebar">
                <h3>部屋形状</h3>
                <p className="room-create-help">左で形状を選び、右の図でドラッグしてサイズを直感的に編集できます。</p>
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
                <svg ref={svgRef} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="部屋形状" preserveAspectRatio="xMidYMid meet">
                    <rect x="0" y="0" width={viewWidth} height={viewHeight} fill="#ffffff" />
                    <g stroke="#000000" strokeWidth="0.03" opacity="0.45">
                        {hLines.map((y) => (
                            <line key={`h-${y}`} x1="0" y1={y} x2={viewWidth} y2={y} />
                        ))}
                        {vLines.map((x) => (
                            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2={viewHeight} />
                        ))}
                    </g>
                    <g transform={`translate(${offsetX + dragShiftX} ${offsetY + dragShiftY})`}>
                        <polygon points={points} fill="#ffffff" stroke="#000000" strokeWidth="0.15" />
                        {edgeHandles.map((edge) => (
                            <line
                                key={`${edge.key}-line`}
                                x1={edge.x1}
                                y1={edge.y1}
                                x2={edge.x2}
                                y2={edge.y2}
                                stroke="#3772ff"
                                strokeDasharray="0.25 0.2"
                                strokeWidth="0.06"
                                opacity="0.7"
                            />
                        ))}

                        {edgeHandles.map((edge) => (
                            <circle
                                key={`${edge.key}-handle`}
                                className={edge.handleClassName}
                                cx={edge.mx}
                                cy={edge.my}
                                r={HANDLE_RADIUS}
                                onPointerDown={(e) => {
                                    e.preventDefault()
                                    startDrag(edge, e)
                                }}
                            />
                        ))}
                    </g>
                </svg>
                <p className="room-create-caption">外周辺: 部屋サイズ変更 / 内側辺: へこみ量を調整</p>
            </section>
        </div>
    )
}
