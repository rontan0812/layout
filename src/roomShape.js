export const ROOM_SHAPE_OPTIONS = [
    { id: 'rectangle', label: '長方形' },
    { id: 'l-left', label: 'L字' },
    { id: 'l-right', label: '逆L字' },
    { id: 'cut-top-right', label: '右上カット' },
]

const isKnownShape = (shapeId) => ROOM_SHAPE_OPTIONS.some((option) => option.id === shapeId)

export const normalizeRoomShape = (shapeId) => {
    if (isKnownShape(shapeId)) return shapeId
    return 'rectangle'
}

export const getNormalizedRoomPolygon = (shapeId) => {
    const shape = normalizeRoomShape(shapeId)
    const cut = 0.35

    if (shape === 'l-left') {
        return [
            { x: 0, y: 0 },
            { x: 1 - cut, y: 0 },
            { x: 1 - cut, y: cut },
            { x: 1, y: cut },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]
    }

    if (shape === 'l-right') {
        return [
            { x: 0, y: cut },
            { x: cut, y: cut },
            { x: cut, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]
    }

    if (shape === 'cut-top-right') {
        return [
            { x: 0, y: 0 },
            { x: 1 - cut, y: 0 },
            { x: 1, y: cut },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]
    }

    return [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
    ]
}

export const getRoomPolygonPoints = (shapeId, width, height) => {
    const w = Math.max(1, Number(width) || 1)
    const h = Math.max(1, Number(height) || 1)
    const normalized = getNormalizedRoomPolygon(shapeId)

    return normalized.map((p) => ({
        x: p.x * w,
        y: p.y * h,
    }))
}
