import { useEffect, useState } from "react";

export default function LeftBar(props) {
    const {
        onCreate,
        initialWidth = 10,
        initialHeight = 10,
        onStart,
        onMode,
        making = false,
        isMakingMode = false,
        onDelete,
        onAddFurniture,
        onRemoveFurniture,
        onClearFurniture,
        furnitureList = [],
        selectedIndex = null,
        onSelectFurniture = null,
        onUpdateFurniture = null,
        switchDim = false,
        onSwitchDim = null,
        onUpdateWallColor = null,
        initialWallColor = '#ffffff',
        onUpdateFloorColor = null,
        initialFloorColor = '#ffffff'
    } = props;
    const [widthInput, setWidthInput] = useState(initialWidth);
    const [heightInput, setHeightInput] = useState(initialHeight);
    const [wallColor, setWallColor] = useState(initialWallColor);
    const [floorColor, setFloorColor] = useState(initialFloorColor);
    const [createMode, setCreateMode] = useState('numeric');

    const [fType, setFType] = useState('sofa')
    const [fX, setFX] = useState(5)
    const [fY, setFY] = useState(5)
    const [fW, setFW] = useState(2)
    const [fH, setFH] = useState(2)
    const [fT, setFT] = useState(0)

    useEffect(() => {
        setWidthInput(initialWidth);
    }, [initialWidth]);
    useEffect(() => {
        setHeightInput(initialHeight);
    }, [initialHeight]);

    useEffect(() => {
        try {
            localStorage.setItem('roomWidth', String(widthInput));
        } catch (e) {
        }
    }, [widthInput]);
    useEffect(() => {
        try {
            localStorage.setItem('roomHeight', String(heightInput));
        } catch (e) {
        }
    }, [heightInput]);

    function handleMakeRoom() {
        const width = parseInt(widthInput, 10) || 0;
        const height = parseInt(heightInput, 10) || 0;

        if (typeof onCreate === "function") onCreate(width, height);
        if (typeof onStart === "function") onStart(true);
        if (createMode === 'drawing' && isMakingMode) {
            if (typeof onMode === "function") onMode(true);
        }
    }

    function handleUpdateRoom() {
        const width = parseInt(widthInput, 10) || 0;
        const height = parseInt(heightInput, 10) || 0;

        if (typeof onCreate === "function") onCreate(width, height);
        if (typeof onClearFurniture === "function") onClearFurniture();
    }

    function changeToMakeRoom() {
        if (typeof onMode === "function") onMode(isMakingMode);
    }

    function handleDeleteRoom() {
        try {
            localStorage.removeItem('roomWidth');
            localStorage.removeItem('roomHeight');
        } catch (e) {}
        setWidthInput(10);
        setHeightInput(10);
        if (typeof onDelete === "function") onDelete();
        else {
            if (typeof onCreate === "function") onCreate(10, 10);
            if (typeof onStart === "function") onStart(false);
        }
    }

    function handleAddFurniture() {
        const width = parseFloat(widthInput)
        const height = parseFloat(heightInput)
        const ad_fx = parseFloat(fX)+parseFloat(fW)/2
        const ad_fy = parseFloat(fY)+parseFloat(fH)/2
        const furniture = {
            type: fType,
            x: (ad_fx || 0) / width - 0.5,
            y: 0.5 - (ad_fy || 0) / height,
            w: (parseFloat(fW) || 0) / width,
            h: (parseFloat(fH) || 0) / height,
            t: (parseFloat(fT) || 0) / 2.4,
            r: 0,
        }
        if (typeof onAddFurniture === 'function') onAddFurniture(furniture)
    }

    function handleFixFurniture() {
        if (typeof onUpdateWallColor === "function") onUpdateWallColor(wallColor);
        if (typeof onUpdateFloorColor === "function") onUpdateFloorColor(floorColor);
    }

    function handleRemoveFurniture() {

        if (typeof onClearFurniture === 'function') onClearFurniture()
    }

    const [selX, setSelX] = useState(0)
    const [selY, setSelY] = useState(0)
    const [selColor, setSelColor] = useState('#000000')

    useEffect(() => {
        if (selectedIndex == null || !Array.isArray(furnitureList)) return
        const f = furnitureList[selectedIndex]
        if (!f) return
        
        const width = parseFloat(widthInput) || 10
        const height = parseFloat(heightInput) || 10

        const realX = ((f.x || 0) + 0.5) * width
        const realY = (0.5 - (f.y || 0)) * height

        setSelX(realX.toFixed(2))
        setSelY(realY.toFixed(2))

        const colorMap = { sofa: '#7a4f2f', table: '#8b8b8b', chair: '#4a6fa5', chest: '#5d4037' }
        setSelColor(f.color || colorMap[f.type] || '#999999')
    }, [selectedIndex, furnitureList, widthInput, heightInput])

    function updateSelected(newX, newY, newColor) {
        if (selectedIndex == null) return
        
        const width = parseFloat(widthInput) || 10
        const height = parseFloat(heightInput) || 10

        const inputX = (typeof newX === 'number') ? newX : parseFloat(selX)
        const inputY = (typeof newY === 'number') ? newY : parseFloat(selY)
        const color = (typeof newColor === 'string') ? newColor : selColor

        if (isNaN(inputX) || isNaN(inputY)) return

        const x = (inputX / width) - 0.5
        const y = 0.5 - (inputY / height)

        if (typeof onUpdateFurniture === 'function') onUpdateFurniture(selectedIndex, { x, y, color })
    }

    function toggleChestOpen() {
        if (selectedIndex == null) return
        const f = furnitureList[selectedIndex]
        if (!f) return
        
        const isOpen = !f.isOpen
        if (typeof onUpdateFurniture === 'function') onUpdateFurniture(selectedIndex, { isOpen })
    }

    return <>
        <div className="leftbar">
            <details className="leftbarContents makeRoom">
                <summary className="summary">{making ? '間取りを修正' : '間取りを作成'}</summary>
                <div className="input_flex">
                    <p>作成方法：</p>
                    <select value={createMode} onChange={(e) => {
                        const val = e.target.value;
                        setCreateMode(val);
                        if (val === 'drawing') {
                            if (!isMakingMode && typeof onMode === 'function') onMode(false);
                        } else {
                            if (isMakingMode && typeof onMode === 'function') onMode(true);
                        }
                    }} disabled={making}>
                        <option value="numeric">数値入力</option>
                        <option value="drawing">図で作成</option>
                    </select>
                </div>
                {createMode === 'numeric' && (
                    <>
                        <div className="input_flex">
                            <p>横：</p>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={widthInput}
                                onChange={(e) => setWidthInput(e.target.value)}
                                id="widthInput"
                            />
                        </div>
                        <div className="input_flex">
                            <p>縦：</p>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={heightInput}
                                onChange={(e) => setHeightInput(e.target.value)}
                                id="heightInput"
                            />
                        </div>
                    </>
                )}
                <div className="button-group">
                    {making ? (
                        <>
                            <button id="updateRoomButton" onClick={handleUpdateRoom}>修正を保存</button>
                            <button id="makeRoomModeChangeButton" onClick={changeToMakeRoom}>{isMakingMode ? "戻る" : "作成モード"}</button>
                        </>
                    ) : (
                        <button id="makeRoomButton" onClick={handleMakeRoom}>作成</button>
                    )}
                </div>
            </details>
            {!isMakingMode && making && (
                <div>
                <details className="leftbarContents furniture">
                    <summary className="summary">家具を配置</summary>
                    <div className="input_flex">
                        <p>家具：</p>
                        <select value={fType} onChange={e => setFType(e.target.value)}>
                            <option value="sofa">ソファ</option>
                            <option value="table">テーブル</option>
                            <option value="chair">チェア</option>
                            <option value="chest">タンス</option>
                        </select>
                    </div>
                    <div className="input_flex">
                        <p>横 ：</p>
                        <input type="number" min="0" max="100" value={fW} onChange={e => setFW(e.target.value)} />
                    </div>
                    <div className="input_flex">
                        <p>縦 ：</p>
                        <input type="number" min="0" max="100" value={fH} onChange={e => setFH(e.target.value)} />
                    </div>
                    <div className="input_flex">
                        <p>高さ：</p>
                        <input type="number" min="0" max="100" value={fT} onChange={e => setFT(e.target.value)} />
                    </div>
                    <div className="input_flex">
                        <p>X ：</p>
                        <input type="number" min="0" max="100" value={fX} onChange={e => setFX(e.target.value)} />
                    </div>
                    <div className="input_flex">
                        <p>Y ：</p>
                        <input type="number" min="0" max="100" value={fY} onChange={e => setFY(e.target.value)} />
                    </div>
                    <div className="button-group">
                        <button id="addFurnitureButton" onClick={handleAddFurniture}>家具を追加</button>
                        <button id="removeFurnitureButton" onClick={handleRemoveFurniture} className="button-danger">全削除</button>
                    </div>
                    {selectedIndex != null && (
                        <div className="selected-furniture">
                            {(furnitureList[selectedIndex] && furnitureList[selectedIndex].type === 'chest') ? (
                                <button onClick={toggleChestOpen}>
                                    引き出しを{furnitureList[selectedIndex].isOpen ? '閉める' : '開ける'}
                                </button>
                            ) : (
                                <h4>選択中の家具 (#{selectedIndex})</h4>
                            )}
                            <div className="selected-furniture input-row">
                                <p>色</p>
                                <input type="color" value={selColor} onChange={e => {
                                    setSelColor(e.target.value);
                                    updateSelected(undefined, undefined, e.target.value);
                                }} />
                            </div>
                        </div>
                    )}
                    {Array.isArray(furnitureList) && furnitureList.length > 0 && (
                        <div className="furniture-list">
                            <h4>配置済み家具</h4>
                            <ul>
                                {furnitureList.map((it, idx) => {
                                    const width = parseFloat(widthInput)
                                    const height = parseFloat(heightInput)
                                    const realX = ((it.x || 0) + 0.5) * width
                                    const realY = (0.5 - (it.y || 0)) * height
                                    const realW = (it.w || 0) * width
                                    const realH = (it.h || 0) * height
                                    const realT = (it.t || 0) * 2.4
                                    return (
                                        <li key={idx}>
                                            <strong>{it.type}</strong> — X:{realX.toFixed(2)}m Y:{realY.toFixed(2)}m W:{realW.toFixed(2)}m H:{realH.toFixed(2)}m T:{realT.toFixed(2)}m
                                            <button onClick={() => { if (typeof onRemoveFurniture === 'function') onRemoveFurniture(idx) }}>削除</button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </details>
                <details className="leftbarContents fixFurniture">
                    <summary className="summary">家具を修正</summary>
                    {making && (
                        <>
                        <div className="input_flex">
                            <p>壁の色：</p>
                            <input
                                type="color"
                                value={wallColor}
                                onChange={(e) => {
                                    setWallColor(e.target.value);
                                    if (typeof onUpdateWallColor === "function") onUpdateWallColor(e.target.value);
                                }}
                                id="wallColorInput"
                            />
                        </div>
                        <div className="input_flex">
                            <p>床の色：</p>
                            <input
                                type="color"
                                value={floorColor}
                                onChange={(e) => {
                                    setFloorColor(e.target.value);
                                    if (typeof onUpdateFloorColor === "function") onUpdateFloorColor(e.target.value);
                                }}
                                id="floorColorInput"
                            />
                        </div>
                        </>
                    )}
                    <button id="fixFurnitureButton" onClick={handleFixFurniture}>修正</button>
                </details>
                <details className="leftbarContents reset">
                    <summary className="summary">リセット</summary>
                    <button id="resetButton" onClick={handleDeleteRoom} className="button-reset">リセット</button>             
                </details>
                <details className="leftbarContents view">
                    <summary className="summary">表示</summary>
                    <button onClick={() => { 
                        if (typeof onSwitchDim === 'function') {
                            onSwitchDim(!switchDim);
                        }
                    }} className={`button-3d ${switchDim ? 'active' : 'inactive'}`}>
                        {switchDim ? '2D表示' : '3D化'}
                    </button>
                </details>
                </div>
            )}
        </div>
    </>
}