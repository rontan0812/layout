import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useEffect, useState, useMemo } from 'react'
import { PerspectiveCamera, TransformControls, Line } from '@react-three/drei'
import RoomCreateMode from './RoomCreateMode'
import { getRoomPolygonPoints, normalizeRoomShape } from './roomShape'

const normalizeRightAngle = (angle) => {
    const twoPi = Math.PI * 2
    let value = angle % twoPi
    if (value < 0) value += twoPi
    return value
}

const pointInPolygon = (x, y, polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return true

    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x
        const yi = polygon[i].y
        const xj = polygon[j].x
        const yj = polygon[j].y

        const intersects = ((yi > y) !== (yj > y))
            && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi)

        if (intersects) inside = !inside
    }

    return inside
}

const getPolygonBounds = (polygon) => {
    if (!Array.isArray(polygon) || polygon.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const point of polygon) {
        minX = Math.min(minX, point.x)
        maxX = Math.max(maxX, point.x)
        minY = Math.min(minY, point.y)
        maxY = Math.max(maxY, point.y)
    }

    return { minX, maxX, minY, maxY }
}

const getPolygonCentroid = (polygon) => {
    if (!Array.isArray(polygon) || polygon.length === 0) {
        return { x: 0, y: 0 }
    }

    let twiceArea = 0
    let centerX = 0
    let centerY = 0

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const p1 = polygon[j]
        const p2 = polygon[i]
        const cross = p1.x * p2.y - p2.x * p1.y
        twiceArea += cross
        centerX += (p1.x + p2.x) * cross
        centerY += (p1.y + p2.y) * cross
    }

    if (Math.abs(twiceArea) < 1e-9) {
        const fallback = polygon[0]
        return { x: fallback.x, y: fallback.y }
    }

    return {
        x: centerX / (3 * twiceArea),
        y: centerY / (3 * twiceArea),
    }
}

const findNearestValidPoint = (candidate, polygon, isValid) => {
    if (isValid(candidate.x, candidate.y)) return candidate

    const anchor = getPolygonCentroid(polygon)
    if (isValid(anchor.x, anchor.y)) {
        let low = 0
        let high = 1
        let best = { x: anchor.x, y: anchor.y }

        for (let i = 0; i < 18; i += 1) {
            const mid = (low + high) / 2
            const x = candidate.x + (anchor.x - candidate.x) * mid
            const y = candidate.y + (anchor.y - candidate.y) * mid

            if (isValid(x, y)) {
                best = { x, y }
                high = mid
            } else {
                low = mid
            }
        }

        if (isValid(best.x, best.y)) return best
    }

    const bounds = getPolygonBounds(polygon)
    let best = null
    let bestDistance = Infinity
    const steps = 12

    for (let ix = 0; ix <= steps; ix += 1) {
        const x = bounds.minX + ((bounds.maxX - bounds.minX) * ix) / steps
        for (let iy = 0; iy <= steps; iy += 1) {
            const y = bounds.minY + ((bounds.maxY - bounds.minY) * iy) / steps
            if (!isValid(x, y)) continue
            const distance = (x - candidate.x) ** 2 + (y - candidate.y) ** 2
            if (distance < bestDistance) {
                best = { x, y }
                bestDistance = distance
            }
        }
    }

    if (best) return best

    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, candidate.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, candidate.y)),
    }
}

const MeshWithEdges = ({ position, scale, material }) => (
    <group position={position} scale={scale}>
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            {material}
        </mesh>
        <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color="#ffffff" depthTest={false} />
        </lineSegments>
    </group>
)

const ChestDrawer = ({ position, scale, material }) => (
    <group position={position} scale={scale}>
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            {material}
        </mesh>
    
        <group position={[0, 0, 0.5]}>
             <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                <lineBasicMaterial color="#ffffff" depthTest={false} />
            </lineSegments>
        </group>
    </group>
)

const FurnitureMesh = ({ type, color, selected, isOpen }) => {
    const material = <meshStandardMaterial color={selected ? '#ff0000' : color} />

    if (type === 'sofa') {
        const seatHeight = 0.3
        const backHeight = 0.8
        const armHeight = 0.5
        const depth = 1
        const backThickness = 0.2
        const seatDepth = depth - backThickness
        const width = 1
        const armWidth = 0.1
        const seatWidth = width - 2 * armWidth

        return (
            <group>
                <MeshWithEdges 
                    position={[0, -0.5 + backHeight/2, -0.5 + backThickness/2]} 
                    scale={[width, backHeight, backThickness]} 
                    material={material} 
                />
                <MeshWithEdges 
                    position={[0, -0.5 + seatHeight/2, -0.5 + backThickness + seatDepth/2]} 
                    scale={[seatWidth, seatHeight, seatDepth]} 
                    material={material} 
                />
                <MeshWithEdges 
                    position={[-0.5 + armWidth/2, -0.5 + armHeight/2, -0.5 + backThickness + seatDepth/2]} 
                    scale={[armWidth, armHeight, seatDepth]} 
                    material={material} 
                />
                <MeshWithEdges 
                    position={[0.5 - armWidth/2, -0.5 + armHeight/2, -0.5 + backThickness + seatDepth/2]} 
                    scale={[armWidth, armHeight, seatDepth]} 
                    material={material} 
                />
            </group>
        )
    }
    if (type === 'table') {
        const topThick = 0.05
        const legHeight = 0.95
        const legThick = 0.1
        return (
            <group>
                <MeshWithEdges position={[0, 0.5 - topThick/2, 0]} scale={[1, topThick, 1]} material={material} />
                <MeshWithEdges position={[-0.4, 0.5 - topThick - legHeight/2, 0.4]} scale={[legThick, legHeight, legThick]} material={material} />
                <MeshWithEdges position={[0.4, 0.5 - topThick - legHeight/2, 0.4]} scale={[legThick, legHeight, legThick]} material={material} />
                <MeshWithEdges position={[-0.4, 0.5 - topThick - legHeight/2, -0.4]} scale={[legThick, legHeight, legThick]} material={material} />
                <MeshWithEdges position={[0.4, 0.5 - topThick - legHeight/2, -0.4]} scale={[legThick, legHeight, legThick]} material={material} />
            </group>
        )
    }
    if (type === 'chair') {
        const seatThick = 0.05
        const seatY = -0.1
        const legHeight = 0.4
        
        return (
            <group>
                <MeshWithEdges position={[0, -0.1 - seatThick/2, 0]} scale={[0.9, seatThick, 0.9]} material={material} />
                <MeshWithEdges position={[0, -0.1 + 0.6/2, -0.4]} scale={[0.9, 0.6, 0.1]} material={material} />
                <MeshWithEdges position={[-0.4, -0.5 + 0.4/2, 0.4]} scale={[0.05, 0.4, 0.05]} material={material} />
                <MeshWithEdges position={[0.4, -0.5 + 0.4/2, 0.4]} scale={[0.05, 0.4, 0.05]} material={material} />
                <MeshWithEdges position={[-0.4, -0.5 + 0.4/2, -0.4]} scale={[0.05, 0.4, 0.05]} material={material} />
                <MeshWithEdges position={[0.4, -0.5 + 0.4/2, -0.4]} scale={[0.05, 0.4, 0.05]} material={material} />
            </group>
        )
    }
    if (type === 'chest') {
        const drawerHeight = 1.0 / 3;
        const gap = 0.02;
        const h = drawerHeight - gap;
        return (
            <group>
                <ChestDrawer position={[0, -0.5 + drawerHeight/2, 0]} scale={[1, h, 1]} material={material} />
                
                {/* Always render the drawer at the closed position */}
                <ChestDrawer position={[0, 0 , 0]} scale={[1, h, 1]} material={material} />

                {/* Render the open drawer if open */}
                {isOpen && (
                    <ChestDrawer position={[0, 0 , 0.3]} scale={[1, h, 1]} material={material} />
                )}

                <ChestDrawer position={[0, 0.5 - drawerHeight/2, 0]} scale={[1, h, 1]} material={material} />
            </group>
        )
    }
    return (
        <MeshWithEdges material={material} />
    )
}

const Furniture3DItem = ({ furniture, index, planeWidth, planeHeight, roomHeight, roomPolygon, selected, onSelect, onUpdate, interactionLockRef }) => {
    const groupRef = useRef()
    const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
    const color = furniture.color || colorMap[furniture.type] || '#999'

    const w = (furniture.w || 0.1) * planeWidth
    const d = (furniture.h || 0.1) * planeHeight 
    const h = (furniture.t || 0.1)
    
    const posX = (furniture.x + 0.5) * planeWidth
    const posY = h / 2 + (furniture.ty || 0)
    const posZ = (furniture.y + 0.5) * planeHeight
    const rot = furniture.r || 0
    const hitboxDepth = furniture.type === 'chest' && furniture.isOpen ? d * 1.3 : d
    const footprintPolygon = Array.isArray(roomPolygon) ? roomPolygon : []

    const getLocalFootprint = () => {
        if (furniture.type === 'chair') {
            return { minX: -0.45, maxX: 0.45, minZ: -0.45, maxZ: 0.45 }
        }
        if (furniture.type === 'chest' && furniture.isOpen) {
            return { minX: -0.5, maxX: 0.5, minZ: -0.5, maxZ: 0.8 }
        }
        return { minX: -0.5, maxX: 0.5, minZ: -0.5, maxZ: 0.5 }
    }

    const getFootprintBounds = () => {
        const r = furniture.r || 0
        const cosR = Math.cos(r)
        const sinR = Math.sin(r)
        const sx = (furniture.w || 0.1) * planeWidth
        const sz = (furniture.h || 0.1) * planeHeight

        const { minX: localXMin, maxX: localXMax, minZ: localZMin, maxZ: localZMax } = getLocalFootprint()

        const localCorners = [
            [localXMin, localZMin],
            [localXMax, localZMin],
            [localXMin, localZMax],
            [localXMax, localZMax],
        ]

        let minOffsetX = Infinity
        let maxOffsetX = -Infinity
        let minOffsetZ = Infinity
        let maxOffsetZ = -Infinity

        for (const [lx, lz] of localCorners) {
            const x = lx * sx
            const z = lz * sz
            const rx = x * cosR + z * sinR
            const rz = -x * sinR + z * cosR

            minOffsetX = Math.min(minOffsetX, rx)
            maxOffsetX = Math.max(maxOffsetX, rx)
            minOffsetZ = Math.min(minOffsetZ, rz)
            maxOffsetZ = Math.max(maxOffsetZ, rz)
        }

        return { minOffsetX, maxOffsetX, minOffsetZ, maxOffsetZ }
    }

    const isFootprintInsideRoom = (centerX, centerZ) => {
        if (footprintPolygon.length < 3) return true

        const r = furniture.r || 0
        const cosR = Math.cos(r)
        const sinR = Math.sin(r)
        const sx = (furniture.w || 0.1) * planeWidth
        const sz = (furniture.h || 0.1) * planeHeight
        const { minX: localXMin, maxX: localXMax, minZ: localZMin, maxZ: localZMax } = getLocalFootprint()
        const localCorners = [
            [localXMin, localZMin],
            [localXMax, localZMin],
            [localXMin, localZMax],
            [localXMax, localZMax],
        ]

        return localCorners.every(([lx, lz]) => {
            const x = lx * sx
            const z = lz * sz
            const rx = x * cosR + z * sinR
            const rz = -x * sinR + z * cosR
            return pointInPolygon(centerX + rx, centerZ + rz, footprintPolygon)
        })
    }

    const clampPosition = () => {
        if (!groupRef.current) return
        const pos = groupRef.current.position
        const { minOffsetX, maxOffsetX, minOffsetZ, maxOffsetZ } = getFootprintBounds()
        const minCenterX = -minOffsetX
        const maxCenterX = planeWidth - maxOffsetX
        const minCenterZ = -minOffsetZ
        const maxCenterZ = planeHeight - maxOffsetZ

        // Keep vertical position fixed in the right-side 3D interaction area.
        pos.y = posY

        pos.x = Math.max(minCenterX, Math.min(maxCenterX, pos.x))
        pos.z = Math.max(minCenterZ, Math.min(maxCenterZ, pos.z))

        const constrained = findNearestValidPoint(
            { x: pos.x, y: pos.z },
            footprintPolygon,
            isFootprintInsideRoom
        )
        pos.x = constrained.x
        pos.z = constrained.y
    }

    const initialClamped = findNearestValidPoint(
        { x: posX, y: posZ },
        footprintPolygon,
        isFootprintInsideRoom
    )

    return (
        <>
            <group 
                ref={groupRef} 
                position={[initialClamped.x, posY, initialClamped.y]} 
                rotation={[0, rot, 0]} 
                onPointerDown={(e) => {
                    e.stopPropagation()
                    if (interactionLockRef?.current) return
                    if (!selected) onSelect(index)
                }}
            >
                <mesh
                    scale={[w, h, hitboxDepth]}
                    onPointerDown={(e) => {
                        e.stopPropagation()
                        if (interactionLockRef?.current) return
                        if (!selected) onSelect(index)
                    }}
                >
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
                </mesh>
                <group scale={[w, h, d]}>
                    <FurnitureMesh type={furniture.type} color={color} selected={selected} isOpen={furniture.isOpen} />
                </group>
            </group>
            {selected && (
                <TransformControls 
                    object={groupRef} 
                    mode="translate"
                    showY={false}
                    onMouseDown={() => {
                        if (interactionLockRef) interactionLockRef.current = true
                    }}
                    onChange={() => { clampPosition() }}
                    onMouseUp={() => {
                        if (interactionLockRef) interactionLockRef.current = false
                        clampPosition()
                        if (groupRef.current) {
                            const { x, z } = groupRef.current.position
                            const newX = x / planeWidth - 0.5
                            const newY = z / planeHeight - 0.5
                            if (typeof onUpdate === 'function') onUpdate(index, { x: newX, y: newY })
                        }
                    }}
                />
            )}
        </>
    )
}

const Furniture2DItem = ({ furniture, index, planeWidth, planeHeight, roomPolygon, selected, onSelect, onUpdate, interactionLockRef }) => {
    const groupRef = useRef()
    const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
    const color = furniture.color || colorMap[furniture.type] || '#999'
    const posX = (furniture.x + 0.5) * planeWidth
    const posY = (0.5 - furniture.y) * planeHeight
    const rot = furniture.r || 0
    const footprintPolygon = Array.isArray(roomPolygon) ? roomPolygon : []

    const getLocalFootprint2D = () => {
        if (furniture.type === 'chair') {
            return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 }
        }
        if (furniture.type === 'chest' && furniture.isOpen) {
            return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.8 }
        }
        return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 }
    }

    const getBounds2D = () => {
        const r = furniture.r || 0
        const cosR = Math.cos(r)
        const sinR = Math.sin(r)
        const sx = (furniture.w || 0.1) * planeWidth
        const sy = (furniture.h || 0.1) * planeHeight
        const { minX, maxX, minY, maxY } = getLocalFootprint2D()
        const corners = [
            [minX, minY],
            [maxX, minY],
            [minX, maxY],
            [maxX, maxY],
        ]

        let minOffsetX = Infinity
        let maxOffsetX = -Infinity
        let minOffsetY = Infinity
        let maxOffsetY = -Infinity

        for (const [lx, ly] of corners) {
            const x = lx * sx
            const y = ly * sy
            // Match 3D Y-axis rotation projected onto 2D X-Y plane.
            const rx = x * cosR + y * sinR
            const ry = -x * sinR + y * cosR
            minOffsetX = Math.min(minOffsetX, rx)
            maxOffsetX = Math.max(maxOffsetX, rx)
            minOffsetY = Math.min(minOffsetY, ry)
            maxOffsetY = Math.max(maxOffsetY, ry)
        }

        return { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY }
    }

    const clampCenter2D = (x, y) => {
        const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getBounds2D()
        const inset = 0
        const minCenterX = -minOffsetX + inset
        const maxCenterX = planeWidth - maxOffsetX - inset
        const minCenterY = -minOffsetY + inset
        const maxCenterY = planeHeight - maxOffsetY - inset
        const clamped = {
            x: Math.max(minCenterX, Math.min(maxCenterX, x)),
            y: Math.max(minCenterY, Math.min(maxCenterY, y)),
        }

        if (footprintPolygon.length < 3) return clamped

        return findNearestValidPoint(clamped, footprintPolygon, (centerX, centerY) => {
            const { minOffsetX: testMinX, maxOffsetX: testMaxX, minOffsetY: testMinY, maxOffsetY: testMaxY } = getBounds2D()
            const corners = [
                [centerX + testMinX, centerY + testMinY],
                [centerX + testMaxX, centerY + testMinY],
                [centerX + testMinX, centerY + testMaxY],
                [centerX + testMaxX, centerY + testMaxY],
            ]
            return corners.every(([x, y]) => pointInPolygon(x, y, footprintPolygon))
        })
    }

    const clampPosition2D = () => {
        if (!groupRef.current) return
        const pos = groupRef.current.position
        const clamped = clampCenter2D(pos.x, pos.y)
        pos.x = clamped.x
        pos.y = clamped.y
        pos.z = 0.05
    }

    const initialClamped = clampCenter2D(posX, posY)

    return (
        <>
            <group
                ref={groupRef}
                position={[initialClamped.x, initialClamped.y, 0.05]}
                rotation={[0, 0, -rot]}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    if (interactionLockRef?.current) return
                    if (!selected) onSelect(index)
                }}
            >
                <mesh scale={[(furniture.w || 0.1) * planeWidth, (furniture.h || 0.1) * planeHeight, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial color={selected ? '#ff0000' : color} />
                </mesh>
                <lineSegments scale={[(furniture.w || 0.1) * planeWidth, (furniture.h || 0.1) * planeHeight, 1]}>
                    <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                    <lineBasicMaterial color="#ffffff" depthTest={false} />
                </lineSegments>
                {furniture.type === 'chest' && (
                    <group
                        position={[0, -((furniture.h || 0.1) * planeHeight) * 0.65, 0]}
                        scale={[(furniture.w || 0.1) * planeWidth, ((furniture.h || 0.1) * planeHeight) * 0.3, 1]}
                    >
                        <mesh>
                            <planeGeometry args={[1, 1]} />
                            <meshBasicMaterial color={selected ? '#ff0000' : color} opacity={0.6} transparent />
                        </mesh>
                        <lineSegments>
                            <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                            <lineBasicMaterial color="#888888" />
                        </lineSegments>
                    </group>
                )}
            </group>
            {selected && (
                <TransformControls
                    object={groupRef}
                    mode="translate"
                    showZ={false}
                    onMouseDown={() => {
                        if (interactionLockRef) interactionLockRef.current = true
                    }}
                    onChange={() => { clampPosition2D() }}
                    onMouseUp={() => {
                        if (interactionLockRef) interactionLockRef.current = false
                        clampPosition2D()
                        if (groupRef.current) {
                            const { x, y } = groupRef.current.position
                            const newX = x / planeWidth - 0.5
                            const newY = 0.5 - y / planeHeight
                            if (typeof onUpdate === 'function') onUpdate(index, { x: newX, y: newY })
                        }
                    }}
                />
            )}
        </>
    )
}

export default function Room({ width = 10, height = 10, roomShape = 'rectangle', onUpdateRoomShape = () => {}, onUpdateRoomSize = () => {}, scale = 1, furnitureList = [], selectedIndex = null, onSelectFurniture = () => {}, onUpdateFurniture = () => {}, switchDim = false, wallColor = '#ffffff', floorColor = '#ffffff', isMakingMode = false }) {
    const aspect = (height === 0) ? 1 : (width / height)
    const normalizedRoomShape = normalizeRoomShape(roomShape)
    const isRectangularRoom = normalizedRoomShape === 'rectangle'

    if (isMakingMode) {
        return (
            <RoomCreateMode
                width={width}
                height={height}
                shape={normalizedRoomShape}
                onShapeChange={onUpdateRoomShape}
                onSizeChange={onUpdateRoomSize}
            />
        )
    }

    const longSide = 7
    let planeWidth, planeHeight
    if (aspect >= 1) {
        planeWidth = longSide
        planeHeight = longSide / aspect
    } else {
        planeHeight = longSide
        planeWidth = longSide * aspect
    }
    const roomPolygon = useMemo(() => getRoomPolygonPoints(normalizedRoomShape, planeWidth, planeHeight), [normalizedRoomShape, planeWidth, planeHeight])
    const roomPolygon2D = useMemo(() => roomPolygon.map((p) => ({ x: p.x, y: planeHeight - p.y })), [roomPolygon, planeHeight])
    const roomShape2D = useMemo(() => {
        const shape = new THREE.Shape()
        const first = roomPolygon[0]
        shape.moveTo(first.x, planeHeight - first.y)
        for (let i = 1; i < roomPolygon.length; i += 1) {
            shape.lineTo(roomPolygon[i].x, planeHeight - roomPolygon[i].y)
        }
        shape.closePath()
        return shape
    }, [roomPolygon, planeHeight])
    const roomOutline2D = useMemo(() => {
        const outline = roomPolygon.map((p) => [p.x, planeHeight - p.y, -0.05])
        return [...outline, outline[0]]
    }, [roomPolygon, planeHeight])
    const roomShape3D = useMemo(() => {
        const shape = new THREE.Shape()
        const first = roomPolygon[0]
        shape.moveTo(first.x, -first.y)
        for (let i = 1; i < roomPolygon.length; i += 1) {
            shape.lineTo(roomPolygon[i].x, -roomPolygon[i].y)
        }
        shape.closePath()
        return shape
    }, [roomPolygon])
    const roomOutline3D = useMemo(() => {
        const outline = roomPolygon.map((p) => [p.x, 0.01, p.y])
        return [...outline, outline[0]]
    }, [roomPolygon])
    const wallSegments = useMemo(() => {
        return roomPolygon.map((start, i) => {
            const end = roomPolygon[(i + 1) % roomPolygon.length]
            return { start, end, key: `${start.x}-${start.y}-${end.x}-${end.y}` }
        })
    }, [roomPolygon])
    const roomHeight = 2.4 //一般的な部屋の高さ(m)
    const ZOOM_MIN = 0.4
    const ZOOM_MAX = 2.0

    const roomGroup = useRef()
    const interactionLockRef = useRef(false)
    const [zoom, setZoom] = useState(() => {
        const v = parseFloat(localStorage.getItem('roomZoom'))
        if (!Number.isFinite(v)) return 1.0
        return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v))
    })
    const [cameraAngleH, setCameraAngleH] = useState(Math.PI / 4)
    const [cameraAngleV, setCameraAngleV] = useState(Math.PI / 4)

    const updateZoom = (nextZoom) => {
        const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom))
        setZoom(clamped)
        try { localStorage.setItem('roomZoom', String(clamped)) } catch (_) {}
    }

    useEffect(() => {
        const onKeyDown = (event) => {
            if (selectedIndex == null) return
            const key = String(event.key || '').toLowerCase()
            if (key !== 'r') return

            event.preventDefault()
            const selected = Array.isArray(furnitureList) ? furnitureList[selectedIndex] : null
            if (!selected) return

            const current = selected.r || 0
            const delta = event.shiftKey ? -Math.PI / 2 : Math.PI / 2
            const next = normalizeRightAngle(current + delta)
            onUpdateFurniture(selectedIndex, { r: next })
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [selectedIndex, furnitureList, onUpdateFurniture])

    useEffect(() => {
        const step = Math.PI / 36
        const onArrowKey = (event) => {
            const tag = document.activeElement?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault()
                    setCameraAngleH(prev => prev - step)
                    break
                case 'ArrowRight':
                    event.preventDefault()
                    setCameraAngleH(prev => prev + step)
                    break
                case 'ArrowUp':
                    event.preventDefault()
                    setCameraAngleV(prev => Math.min(Math.PI / 2 - 0.05, prev + step))
                    break
                case 'ArrowDown':
                    event.preventDefault()
                    setCameraAngleV(prev => Math.max(0.05, prev - step))
                    break
                default:
                    break
            }
        }
        window.addEventListener('keydown', onArrowKey)
        return () => window.removeEventListener('keydown', onArrowKey)
    }, [])

    const CameraController = ({ is3D = false }) => {
        const { camera } = useThree()
        
        useEffect(() => {
            const dist3D = 20 / zoom
            const dist2D = 10
            if (is3D) {
                const cx = planeWidth / 2
                const cz = planeHeight / 2
                const x = cx + dist3D * Math.sin(cameraAngleH) * Math.cos(cameraAngleV)
                const y = dist3D * Math.sin(cameraAngleV)
                const z = cz + dist3D * Math.cos(cameraAngleH) * Math.cos(cameraAngleV)
                camera.position.set(x, y, z)
                camera.lookAt(cx, 0, cz)
            } else {
                camera.position.set(planeWidth / 2, planeHeight / 2, dist2D)
                camera.lookAt(planeWidth / 2, planeHeight / 2, 0)
            }
            camera.updateProjectionMatrix()
        }, [is3D, camera, zoom, cameraAngleH, cameraAngleV])
        
        return null
    }

    const wall3DMesh = (size, position, rotation, color = wallColor) => {
        return (
            <group position={position} rotation={rotation} onPointerDown={(e) => {
                e.stopPropagation()
                if (interactionLockRef.current) return
                onSelectFurniture(null)
            }}>
                <mesh renderOrder={0}>
                    <planeGeometry args={size} />
                    <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
                </mesh>
                <lineSegments renderOrder={1}>
                    <edgesGeometry args={[new THREE.PlaneGeometry(...size)]} />
                    <lineBasicMaterial color="#ff0000" depthTest={false} />
                </lineSegments>
            </group>
        )
    }

    const wall3DFromEdge = (start, end, color = wallColor, key = '') => {
        const dx = end.x - start.x
        const dz = end.y - start.y
        const wallLength = Math.hypot(dx, dz)
        const midX = (start.x + end.x) / 2
        const midZ = (start.y + end.y) / 2
        const rotY = Math.atan2(dz, dx)

        return (
            <group
                key={key}
                position={[midX, roomHeight / 2, midZ]}
                rotation={[0, rotY, 0]}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    if (interactionLockRef.current) return
                    onSelectFurniture(null)
                }}
            >
                <mesh renderOrder={0}>
                    <planeGeometry args={[wallLength, roomHeight]} />
                    <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
                </mesh>
                <lineSegments renderOrder={1}>
                    <edgesGeometry args={[new THREE.PlaneGeometry(wallLength, roomHeight)]} />
                    <lineBasicMaterial color="#ff0000" depthTest={false} />
                </lineSegments>
            </group>
        )
    }

    return (
        <div className="room" style={{ position: 'relative' }}>
            <div className="zoom-control">
                <label className="zoom-label">表示サイズ</label>
                <input
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step="0.1"
                    value={zoom}
                    disabled={!switchDim}
                    onChange={(e) => updateZoom(parseFloat(e.target.value))}
                    className="zoom-slider"
                />
                <input
                    type="number"
                    min={40}
                    max={200}
                    step={10}
                    value={Math.round(zoom * 100)}
                    disabled={!switchDim}
                    onChange={(e) => {
                        const percent = parseInt(e.target.value, 10)
                        if (!Number.isFinite(percent)) return
                        updateZoom(percent / 100)
                    }}
                    className="zoom-number"
                    aria-label="表示サイズ(%)"
                />
                <span className="zoom-value">%</span>
            </div>
            {switchDim ? (
                <Canvas className="canvas-3d">
                    <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={40} />
                    <CameraController is3D={true} />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={0.6} />
                    {isRectangularRoom ? (
                        <>
                            {wall3DMesh([planeWidth, roomHeight], [planeWidth / 2, roomHeight / 2, 0], [0, 0, 0])}
                            {wall3DMesh([planeHeight, roomHeight], [0, roomHeight / 2, planeHeight / 2], [0, Math.PI / 2, 0])}
                            {wall3DMesh([planeWidth, planeHeight], [planeWidth / 2, 0, planeHeight / 2], [-Math.PI / 2, 0, 0], floorColor)}
                        </>
                    ) : (
                        <>
                            {wallSegments.map((seg) => wall3DFromEdge(seg.start, seg.end, wallColor, seg.key))}
                            <mesh
                                position={[0, 0, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                onPointerDown={(e) => {
                                    e.stopPropagation()
                                    if (interactionLockRef.current) return
                                    onSelectFurniture(null)
                                }}
                            >
                                <shapeGeometry args={[roomShape3D]} />
                                <meshBasicMaterial color={floorColor} side={THREE.DoubleSide} toneMapped={false} />
                            </mesh>
                            <Line points={roomOutline3D} color="#000000" lineWidth={1.2} />
                        </>
                    )}

                    {Array.isArray(furnitureList) && furnitureList.map((f, i) => (
                        <Furniture3DItem
                            key={i}
                            index={i}
                            furniture={f}
                            planeWidth={planeWidth}
                            planeHeight={planeHeight}
                            roomHeight={roomHeight}
                            roomPolygon={roomPolygon}
                            selected={selectedIndex === i}
                            onSelect={onSelectFurniture}
                            onUpdate={onUpdateFurniture}
                            interactionLockRef={interactionLockRef}
                        />
                    ))}
                </Canvas>
            ) : (
                <Canvas className="canvas-2d">
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                    <CameraController is3D={false} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />

                    <group ref={roomGroup} position={[0, 0, 0]}>
                        {isRectangularRoom ? (
                            <>
                                <mesh
                                    renderOrder={-1}
                                    position={[planeWidth / 2, planeHeight / 2, -0.1]}
                                    onPointerDown={(e) => {
                                        e.stopPropagation()
                                        if (interactionLockRef.current) return
                                        onSelectFurniture(null)
                                    }}
                                >
                                     <planeGeometry args={[planeWidth, planeHeight]} />
                                     <meshBasicMaterial color={floorColor} toneMapped={false} />
                                </mesh>
                                <lineSegments position={[planeWidth / 2, planeHeight / 2, -0.05]}>
                                    <edgesGeometry args={[new THREE.PlaneGeometry(planeWidth, planeHeight)]} />
                                    <lineBasicMaterial color="#000000" />
                                </lineSegments>
                            </>
                        ) : (
                            <>
                                <mesh
                                    renderOrder={-1}
                                    position={[0, 0, -0.1]}
                                    onPointerDown={(e) => {
                                        e.stopPropagation()
                                        if (interactionLockRef.current) return
                                        onSelectFurniture(null)
                                    }}
                                >
                                     <shapeGeometry args={[roomShape2D]} />
                                     <meshBasicMaterial color={floorColor} toneMapped={false} />
                                </mesh>
                                <Line points={roomOutline2D} color="#000000" lineWidth={1.2} />
                            </>
                        )}

                        {Array.isArray(furnitureList) && furnitureList.map((f, i) => (
                            <Furniture2DItem
                                key={i}
                                index={i}
                                furniture={f}
                                planeWidth={planeWidth}
                                planeHeight={planeHeight}
                                roomPolygon={roomPolygon2D}
                                selected={selectedIndex === i}
                                onSelect={onSelectFurniture}
                                onUpdate={onUpdateFurniture}
                                interactionLockRef={interactionLockRef}
                            />
                        ))}
                    </group>
                </Canvas>
            )}
        </div>
    )
}