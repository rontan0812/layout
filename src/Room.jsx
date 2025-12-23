import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

export default function Room({ width = 10, height = 10, scale = 1, furnitureList = [], selectedIndex = null, onSelectFurniture = () => {} }) {
    const aspect = (height === 0) ? 1 : (width / height)

    const longSide = 5
    let planeWidth, planeHeight
    if (aspect >= 1) {
        planeWidth = longSide
        planeHeight = longSide / aspect
    } else {
        planeHeight = longSide
        planeWidth = longSide * aspect
    }

    const roomGroup = useRef()
    const SELECTED_COLOR = '#ff0000'

    return (
        <div className="room">
                <Canvas style={{ width: '100%', height: '100%' }}>
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
        </div>
    )
}