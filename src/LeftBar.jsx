import { useEffect, useState } from "react";

export default function LeftBar(props) {
    const {
        onCreate,
        initialWidth = 10,
        initialHeight = 10,
        onStart,
        making = false,
        onDelete,
        onAddFurniture,
        onRemoveFurniture,
        onClearFurniture,
        furnitureList = [],
        selectedIndex = null,
        onSelectFurniture = null,
        onUpdateFurniture = null,
        switchDim = false,
        onSwitchDim = null
    } = props;
    const [widthInput, setWidthInput] = useState(initialWidth);
    const [heightInput, setHeightInput] = useState(initialHeight);

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
    }

    function handleUpdateRoom() {
        const width = parseInt(widthInput, 10) || 0;
        const height = parseInt(heightInput, 10) || 0;

        if (typeof onCreate === "function") onCreate(width, height);
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
            r: 0,
        }
        if (typeof onAddFurniture === 'function') onAddFurniture(furniture)
    }

    function handleRemoveFurniture() {
        if (typeof onClearFurniture === 'function') onClearFurniture()
    }

    const [selX, setSelX] = useState(0)
    const [selY, setSelY] = useState(0)

    useEffect(() => {
        if (selectedIndex == null || !Array.isArray(furnitureList)) return
        const f = furnitureList[selectedIndex]
        if (!f) return
        setSelX(Math.round((f.x || 0) * 100))
        setSelY(Math.round((f.y || 0) * 100))
    }, [selectedIndex, furnitureList])

    function updateSelected(newX, newY) {
        if (selectedIndex == null) return
        const x = (typeof newX === 'number') ? newX / 100 : (parseFloat(selX) || 0) / 100
        const y = (typeof newY === 'number') ? newY / 100 : (parseFloat(selY) || 0) / 100
        if (typeof onUpdateFurniture === 'function') onUpdateFurniture(selectedIndex, { x, y })
    }

    function moveSelected(dx, dy) {
        if (selectedIndex == null) return
        const f = furnitureList[selectedIndex]
        if (!f) return
        const curX = (f.x || 0)
        const curY = (f.y || 0)
        const nx = Math.max(0, Math.min(1, curX + dx))
        const ny = Math.max(0, Math.min(1, curY + dy))
        setSelX(Math.round(nx * 100))
        setSelY(Math.round(ny * 100))
        if (typeof onUpdateFurniture === 'function') onUpdateFurniture(selectedIndex, { x: nx, y: ny })
    }

    return <>
        <div className="leftbar">
            <details className="leftbarContents makeRoom">
                <summary className="summary">{making ? '間取りを修正' : '間取りを作成'}</summary>
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
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                    {making ? (
                        <>
                            <button id="updateRoomButton" onClick={handleUpdateRoom}>修正を保存</button>
                        </>
                    ) : (
                        <button id="makeRoomButton" onClick={handleMakeRoom}>作成</button>
                    )}
                </div>
            </details>
            <details className="leftbarContents furniture">
                <summary className="summary">家具を配置</summary>
                <div className="input_flex">
                    <p>種類：</p>
                    <select value={fType} onChange={e => setFType(e.target.value)}>
                        <option value="sofa">ソファ</option>
                        <option value="table">テーブル</option>
                        <option value="chair">チェア</option>
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
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                    <button id="addFurnitureButton" onClick={handleAddFurniture}>家具を追加</button>
                    <button id="removeFurnitureButton" onClick={handleRemoveFurniture} style={{ background:'#f66', color:'#fff' }}>全削除</button>
                </div>
                {selectedIndex != null && (
                    <div style={{ marginTop: 12 }}>
                        <h4>選択中の家具 (#{selectedIndex})</h4>
                        <div className="input_flex" style={{ gap: 8 }}>
                            <p>X (%)</p>
                            <input type="number" min="0" max="100" value={selX} onChange={e => setSelX(e.target.value)} onBlur={() => updateSelected()} />
                            <p>Y (%)</p>
                            <input type="number" min="0" max="100" value={selY} onChange={e => setSelY(e.target.value)} onBlur={() => updateSelected()} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={() => moveSelected(-0.01, 0)}>左</button>
                            <button onClick={() => moveSelected(0.01, 0)}>右</button>
                            <button onClick={() => moveSelected(0, -0.01)}>下</button>
                            <button onClick={() => moveSelected(0, 0.01)}>上</button>
                        </div>
                    </div>
                )}
                {Array.isArray(furnitureList) && furnitureList.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        <h4>配置済み家具</h4>
                        <ul>
                            {furnitureList.map((it, idx) => (
                                <li key={idx} style={{ marginBottom: 6 }}>
                                    <strong>{it.type}</strong> — X:{Math.round((it.x||0)*100)}% Y:{Math.round((it.y||0)*100)}% W:{Math.round((it.w||0)*100)}% H:{Math.round((it.h||0)*100)}%
                                    <button style={{ marginLeft: 8 }} onClick={() => { if (typeof onRemoveFurniture === 'function') onRemoveFurniture(idx) }}>削除</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </details>
            <details className="leftbarContents reset">
                <summary className="summary">リセット</summary>
                <button id="resetButton" onClick={handleDeleteRoom} style={{ background:'#f33', color:'#fff', width:'100%' }}>リセット</button>             
            </details>
            <details className="leftbarContents">
                <summary className="summary">表示</summary>
                <button onClick={() => { 
                    console.log('Button clicked, current switchDim:', switchDim);
                    if (typeof onSwitchDim === 'function') {
                        onSwitchDim(!switchDim);
                        console.log('Switched to:', !switchDim);
                    }
                }} style={{ background: switchDim ? '#33f' : '#999', color:'#fff', width:'100%' }}>
                    {switchDim ? '2D表示' : '3D化'}
                </button>
            </details>
        </div>
    </>
}