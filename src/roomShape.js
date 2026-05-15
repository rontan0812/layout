export const ROOM_SHAPE_OPTIONS = [
    { id: 'rectangle', label: '長方形' },
    { id: 'l-left', label: 'L字' },
    { id: 'l-right', label: '逆L字' },
]

export const DEFAULT_ROOM_INSET = 0.35
export const MIN_ROOM_INSET = 0.1
export const MAX_ROOM_INSET = 0.8
export const MIN_CUSTOM_POLYGON_VERTICES = 3
export const DEFAULT_CUSTOM_POLYGON = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
]

const isKnownShape = (shapeId) => ROOM_SHAPE_OPTIONS.some((option) => option.id === shapeId)

export const normalizeRoomShape = (shapeId) => {
    if (shapeId === 'custom-polygon') return shapeId
    if (isKnownShape(shapeId)) return shapeId
    return 'rectangle'
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

export const normalizeCustomPolygon = (value) => {
    let points = value
    if (typeof value === 'string') {
        try {
            points = JSON.parse(value)
        } catch (_) {
            points = null
        }
    }

    if (!Array.isArray(points)) {
        return DEFAULT_CUSTOM_POLYGON.map((p) => ({ ...p }))
    }

    const normalized = points
        .map((p) => ({ x: clamp01(Number(p?.x)), y: clamp01(Number(p?.y)) }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))

    if (normalized.length < MIN_CUSTOM_POLYGON_VERTICES) {
        return DEFAULT_CUSTOM_POLYGON.map((p) => ({ ...p }))
    }

    return normalized
}

export const normalizeRoomInset = (insetValue) => {
    const n = Number(insetValue)
    if (!Number.isFinite(n)) return DEFAULT_ROOM_INSET
    return Math.max(MIN_ROOM_INSET, Math.min(MAX_ROOM_INSET, n))
}

export const normalizeRoomInsetPair = (insetValue) => {
    if (insetValue && typeof insetValue === 'object') {
        return {
            x: normalizeRoomInset(insetValue.x),
            y: normalizeRoomInset(insetValue.y),
        }
    }

    if (typeof insetValue === 'string') {
        try {
            const parsed = JSON.parse(insetValue)
            if (parsed && typeof parsed === 'object') {
                return {
                    x: normalizeRoomInset(parsed.x),
                    y: normalizeRoomInset(parsed.y),
                }
            }
        } catch (_) {
            const n = normalizeRoomInset(insetValue)
            return { x: n, y: n }
        }
    }

    const n = normalizeRoomInset(insetValue)
    return { x: n, y: n }
}

export const getNormalizedRoomPolygon = (shapeId, insetValue = DEFAULT_ROOM_INSET, customPolygon = DEFAULT_CUSTOM_POLYGON) => {
    const shape = normalizeRoomShape(shapeId)
    const inset = normalizeRoomInsetPair(insetValue)
    const cutX = inset.x
    const cutY = inset.y

    if (shape === 'custom-polygon') {
        return normalizeCustomPolygon(customPolygon)
    }

    if (shape === 'l-left') {
        return [
            { x: 0, y: 0 },
            { x: 1 - cutX, y: 0 },
            { x: 1 - cutX, y: cutY },
            { x: 1, y: cutY },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]
    }

    if (shape === 'l-right') {
        return [
            { x: 0, y: cutY },
            { x: cutX, y: cutY },
            { x: cutX, y: 0 },
            { x: 1, y: 0 },
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

export const getRoomPolygonPoints = (shapeId, width, height, insetValue = DEFAULT_ROOM_INSET, customPolygon = DEFAULT_CUSTOM_POLYGON) => {
    const w = Math.max(1, Number(width) || 1)
    const h = Math.max(1, Number(height) || 1)
    const normalized = getNormalizedRoomPolygon(shapeId, insetValue, customPolygon)

    return normalized.map((p) => ({
        x: p.x * w,
        y: p.y * h,
    }))
}
