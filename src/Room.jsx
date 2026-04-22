import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { PerspectiveCamera, TransformControls } from '@react-three/drei'

const normalizeRightAngle = (angle) => {
    const twoPi = Math.PI * 2
    let value = angle % twoPi
    if (value < 0) value += twoPi
    return value
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

const Furniture3DItem = ({ furniture, index, planeWidth, planeHeight, roomHeight, selected, onSelect, onUpdate }) => {
    const groupRef = useRef()
    const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
    const color = furniture.color || colorMap[furniture.type] || '#999'

    const w = (furniture.w || 0.1) * planeWidth
    const d = (furniture.h || 0.1) * planeHeight 
    const h = (furniture.t || 0.1)
    
    const posX = (furniture.x + 0.5) * planeWidth
    const posY = h / 2 + (furniture.ty || 0)
    const posZ = (0.5 - furniture.y) * planeHeight
    const rot = furniture.r || 0

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
    }

    return (
        <>
            <group 
                ref={groupRef} 
                position={[posX, posY, posZ]} 
                rotation={[0, rot, 0]} 
                onPointerDown={(e) => {
                    e.stopPropagation()
                    if (!selected) onSelect(index)
                }}
            >
                <group scale={[w, h, d]}>
                    <FurnitureMesh type={furniture.type} color={color} selected={selected} isOpen={furniture.isOpen} />
                </group>
            </group>
            {selected && (
                <TransformControls 
                    object={groupRef} 
                    mode="translate"
                    showY={false}
                    onChange={() => { clampPosition() }}
                    onMouseUp={() => {
                        clampPosition()
                        if (groupRef.current) {
                            const { x, z } = groupRef.current.position
                            const newX = x / planeWidth - 0.5
                            const newY = 0.5 - z / planeHeight
                            if (typeof onUpdate === 'function') onUpdate(index, { x: newX, y: newY })
                        }
                    }}
                />
            )}
        </>
    )
}

const Furniture2DItem = ({ furniture, index, planeWidth, planeHeight, selected, onSelect, onUpdate }) => {
    const groupRef = useRef()
    const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
    const color = furniture.color || colorMap[furniture.type] || '#999'
    const posX = (furniture.x + 0.5) * planeWidth
    const posY = (0.5 - furniture.y) * planeHeight
    const rot = furniture.r || 0

    const getLocalFootprint2D = () => {
        if (furniture.type === 'chair') {
            return { minX: -0.5, maxX: 0.5, minY: -0.5, maxY: 0.5 }
        }
        if (furniture.type === 'chest' && furniture.isOpen) {
            return { minX: -0.5, maxX: 0.5, minY: -0.8, maxY: 0.5 }
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
            const rx = x * cosR - y * sinR
            const ry = x * sinR + y * cosR
            minOffsetX = Math.min(minOffsetX, rx)
            maxOffsetX = Math.max(maxOffsetX, rx)
            minOffsetY = Math.min(minOffsetY, ry)
            maxOffsetY = Math.max(maxOffsetY, ry)
        }

        return { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY }
    }

    const clampCenter2D = (x, y) => {
        const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getBounds2D()
        // Keep a tiny inset to avoid visual spill caused by line width / float precision.
        const inset = 0.03
        const minCenterX = -minOffsetX + inset
        const maxCenterX = planeWidth - maxOffsetX - inset
        const minCenterY = -minOffsetY + inset
        const maxCenterY = planeHeight - maxOffsetY - inset
        return {
            x: Math.max(minCenterX, Math.min(maxCenterX, x)),
            y: Math.max(minCenterY, Math.min(maxCenterY, y)),
        }
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
                rotation={[0, 0, rot]}
                onPointerDown={(e) => {
                    e.stopPropagation()
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
                    onChange={() => { clampPosition2D() }}
                    onMouseUp={() => {
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

export default function Room({ width = 10, height = 10, scale = 1, furnitureList = [], selectedIndex = null, onSelectFurniture = () => {}, onUpdateFurniture = () => {}, switchDim = false, wallColor = '#ffffff', floorColor = '#ffffff', isMakingMode = false }) {
    const aspect = (height === 0) ? 1 : (width / height)

    if (isMakingMode) {
        return (
            <div className="room" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', color: '#333' }}>
                <h2>作成モード</h2>
            </div>
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
    const roomHeight = 2.4 //一般的な部屋の高さ(m)

    const roomGroup = useRef()

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

    const CameraController = ({ is3D = false }) => {
        const { camera } = useThree()
        
        useEffect(() => {
            if (is3D) {
                camera.position.set(10, 10, 10)
                camera.lookAt(planeWidth / 2, 0, planeHeight / 2)
            } else {
                camera.position.set(planeWidth / 2, planeHeight / 2, 10)
                camera.lookAt(planeWidth / 2, planeHeight / 2, 0)
            }
            camera.updateProjectionMatrix()
        }, [is3D, camera])
        
        return null
    }

    const wall3DMesh = (size, position, rotation, color = wallColor) => {
        return (
            <group position={position} rotation={rotation} onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(null) }}>
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

    return (
        <div className="room">
            {switchDim ? (
                <Canvas className="canvas-3d">
                    <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={40} />
                    <CameraController is3D={true} />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={0.6} />
                    {wall3DMesh([planeWidth, roomHeight], [planeWidth / 2, roomHeight / 2, 0], [0, 0, 0])}
                    {wall3DMesh([planeHeight, roomHeight], [0, roomHeight / 2, planeHeight / 2], [0, Math.PI / 2, 0])}
                    {wall3DMesh([planeWidth, planeHeight], [planeWidth / 2, 0, planeHeight / 2], [-Math.PI / 2, 0, 0], floorColor)}

                    {Array.isArray(furnitureList) && furnitureList.map((f, i) => (
                        <Furniture3DItem
                            key={i}
                            index={i}
                            furniture={f}
                            planeWidth={planeWidth}
                            planeHeight={planeHeight}
                            roomHeight={roomHeight}
                            selected={selectedIndex === i}
                            onSelect={onSelectFurniture}
                            onUpdate={onUpdateFurniture}
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
                        <mesh
                            renderOrder={-1}
                            position={[planeWidth / 2, planeHeight / 2, -0.1]}
                            onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(null) }}
                        >
                             <planeGeometry args={[planeWidth, planeHeight]} />
                             <meshBasicMaterial color={floorColor} toneMapped={false} />
                        </mesh>
                        <lineSegments position={[planeWidth / 2, planeHeight / 2, -0.05]}>
                            <edgesGeometry args={[new THREE.PlaneGeometry(planeWidth, planeHeight)]} />
                            <lineBasicMaterial color="#000000" />
                        </lineSegments>

                        {Array.isArray(furnitureList) && furnitureList.map((f, i) => (
                            <Furniture2DItem
                                key={i}
                                index={i}
                                furniture={f}
                                planeWidth={planeWidth}
                                planeHeight={planeHeight}
                                selected={selectedIndex === i}
                                onSelect={onSelectFurniture}
                                onUpdate={onUpdateFurniture}
                            />
                        ))}
                    </group>
                </Canvas>
            )}
        </div>
    )
}