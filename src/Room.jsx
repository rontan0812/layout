import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef, useEffect } from 'react'
import { PerspectiveCamera } from '@react-three/drei'

export default function Room({ width = 10, height = 10, scale = 1, furnitureList = [], selectedIndex = null, onSelectFurniture = () => {}, switchDim = false }) {
    const aspect = (height === 0) ? 1 : (width / height)

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

    const CameraController = () => {
        const { camera } = useThree()
        
        useEffect(() => {
            camera.position.z = 10
            camera.lookAt(0, 0, 0)
            camera.updateProjectionMatrix()
        })
        
        return null
    }

    const wall3DMesh = (size, position, rotation) => {
        return (
            <group position={position} rotation={rotation}>
                <mesh renderOrder={0}>
                    <planeGeometry args={size} />
                    <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
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
                <Canvas style={{ width: '100%', height: '100%', background: '#ffffcc' }}>
                    <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
                    <CameraController />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 5, 5]} intensity={0.6} />
                    {wall3DMesh([planeWidth, roomHeight], [0, 0, -planeHeight / 2], [0, 0, 0])}
                    {wall3DMesh([planeHeight, roomHeight], [-planeWidth / 2, 0, 0], [0, Math.PI / 2, 0])}
                    {wall3DMesh([planeWidth, planeHeight], [0, -roomHeight / 2, 0], [-Math.PI / 2, 0, 0])}
                </Canvas>
            ) : (
                <Canvas style={{ width: '100%', height: '100%' }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />

                    <group ref={roomGroup} position={[0, 0, 0]} scale={[planeWidth, planeHeight, 1]} onPointerDown={() => onSelectFurniture(null)}>
                        <lineSegments>
                            <edgesGeometry args={[new THREE.PlaneGeometry(1, 1)]} />
                            <lineBasicMaterial color="#000000" />
                        </lineSegments>

                        {Array.isArray(furnitureList) && furnitureList.map((f, i) => {
                            const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5' }
                            const color = colorMap[f.type] || '#999'
                            const posX = (f.x || 0)
                            const posY = (f.y || 0)
                            const rot = f.r || 0
                            return (
                                <group key={i} position={[posX, posY, 0]} rotation={[0, 0, rot]} onPointerDown={(e) => { e.stopPropagation(); onSelectFurniture(i); }}>
                                    <mesh scale={[f.w || 0.1, f.h || 0.1, 1]}>
                                        <planeGeometry args={[1, 1]} />
                                        <meshStandardMaterial color={selectedIndex === i ? SELECTED_COLOR : color} />
                                    </mesh>
                                </group>
                            )
                        })}
                    </group>
                </Canvas>
            )}
        </div>
    )
}