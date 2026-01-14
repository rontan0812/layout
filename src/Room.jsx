import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { PerspectiveCamera } from '@react-three/drei'

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

export default function Room({ width = 10, height = 10, scale = 1, furnitureList = [], selectedIndex = null, onSelectFurniture = () => {}, switchDim = false, wallColor = '#ffffff', floorColor = '#ffffff', isMakingMode = false }) {
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
    const SELECTED_COLOR = '#ff0000'

    const CameraController = ({ is3D = false }) => {
        const { camera } = useThree()
        
        useEffect(() => {
            if (is3D) {
                camera.position.set(10, 10, 10)
                camera.lookAt(planeWidth / 2, 0, planeHeight / 2)
            } else {
                camera.position.set(0, 0, 10)
                camera.lookAt(0, 0, 0)
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

    const furniture3DMesh = (furniture, index) => {
        const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
        const color = furniture.color || colorMap[furniture.type] || '#999'
        const posX = (furniture.x + 0.5) * planeWidth
        const posZ = (0.5 - furniture.y) * planeHeight
        const rot = furniture.r || 0
        const width = (furniture.w || 0.1) * planeWidth
        const depth = (furniture.h || 0.1) * planeHeight
        const height = (furniture.t || 0.1)
        const posY = height / 2
        return (
            <group key={index} position={[posX, posY, posZ]} rotation={[0, rot, 0]} onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(index); }}>
                <group scale={[width, height, depth]}>
                    <FurnitureMesh type={furniture.type} color={color} selected={selectedIndex === index} isOpen={furniture.isOpen} />
                </group>
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

                    {Array.isArray(furnitureList) && furnitureList.map((f, i) => {
                        return furniture3DMesh(f, i)
                    })}
                </Canvas>
            ) : (
                <Canvas className="canvas-2d">
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                    <CameraController is3D={false} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />

                    <group ref={roomGroup} position={[0, 0, 0]} scale={[planeWidth, planeHeight, 1]} onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(null) }}>
                        <mesh renderOrder={-1} position={[0, 0, -0.1]}>
                             <planeGeometry args={[1, 1]} />
                             <meshBasicMaterial color={floorColor} toneMapped={false} />
                        </mesh>
                        <lineSegments position={[0, 0, -0.05]}>
                            <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                            <lineBasicMaterial color="#000000" />
                        </lineSegments>

                        {Array.isArray(furnitureList) && furnitureList.map((f, i) => {
                            const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
                            const color = f.color || colorMap[f.type] || '#999'
                            const posX = (f.x || 0)
                            const posY = (f.y || 0)
                            const rot = f.r || 0
                            return (
                                <group key={i} position={[posX, posY, 0.05]} rotation={[0, 0, rot]} onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(i); }}>
                                    <mesh scale={[f.w || 0.1, f.h || 0.1, 1]}>
                                        <planeGeometry args={[1, 1]} />
                                        <meshStandardMaterial color={selectedIndex === i ? SELECTED_COLOR : color} />
                                    </mesh>
                                    <lineSegments scale={[f.w || 0.1, f.h || 0.1, 1]}>
                                        <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                                        <lineBasicMaterial color="#ffffff" depthTest={false} />
                                    </lineSegments>
                                    {f.type === 'chest' && (
                                        <group position={[0, -(f.h || 0.1) * 0.65, 0]} scale={[f.w || 0.1, (f.h || 0.1) * 0.3, 1]}>
                                            <mesh>
                                                <planeGeometry args={[1, 1]} />
                                                <meshBasicMaterial color={selectedIndex === i ? SELECTED_COLOR : color} opacity={0.6} transparent />
                                            </mesh>
                                            <lineSegments>
                                                <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                                                <lineBasicMaterial color="#888888" />
                                            </lineSegments>
                                        </group>
                                    )}
                                </group>
                            )
                        })}
                    </group>
                </Canvas>
            )}
        </div>
    )
}