"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useContract } from '@/context/ContractContext';

export default function PixelMap() {
    const { state, isParcelOwned } = useGame();
    const { isContractReady, approveUsdt, buyParcels, state: contractState } = useContract();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const gridSize = 500;
    const canvasRes = 1200; // internal resolution

    // Camera state
    const [zoom, setZoom] = useState(8); // start zoomed in so parcels are visible
    const [camX, setCamX] = useState(220); // center on hot zone area
    const [camY, setCamY] = useState(180);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, camX: 0, camY: 0 });

    // How many grid cells fit on screen
    const viewCells = gridSize / zoom;

    const drawMap = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cellSize = w / viewCells; // pixel size of each cell on screen

        // Visible range
        const startX = Math.floor(camX - viewCells / 2);
        const startY = Math.floor(camY - viewCells / 2);
        const endX = Math.ceil(camX + viewCells / 2) + 1;
        const endY = Math.ceil(camY + viewCells / 2) + 1;

        // Clear
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, w, h);

        // Draw visible cells
        for (let gx = Math.max(0, startX); gx < Math.min(gridSize, endX); gx++) {
            for (let gy = Math.max(0, startY); gy < Math.min(gridSize, endY); gy++) {
                const screenX = (gx - startX) * cellSize;
                const screenY = (gy - startY) * cellSize;

                const key = `${gx},${gy}`;
                const parcel = state.parcels.get(key);

                if (parcel) {
                    // Owned parcel
                    ctx.fillStyle = parcel.color;
                    ctx.fillRect(screenX, screenY, cellSize - 0.5, cellSize - 0.5);

                    // Show owner when zoomed in enough
                    if (cellSize >= 24) {
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.fillRect(screenX, screenY + cellSize - 14, cellSize - 0.5, 14);
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                        ctx.font = `bold ${Math.min(9, cellSize / 4)}px monospace`;
                        ctx.textAlign = 'center';
                        ctx.fillText(parcel.owner.slice(0, 8), screenX + cellSize / 2, screenY + cellSize - 4);
                    }
                } else {
                    // Empty parcel
                    ctx.fillStyle = '#0c0c18';
                    ctx.fillRect(screenX, screenY, cellSize - 0.5, cellSize - 0.5);
                }

                // Grid lines when zoomed in
                if (cellSize >= 6) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(screenX, screenY, cellSize, cellSize);
                }

                // Coordinate labels when very zoomed
                if (cellSize >= 40) {
                    ctx.fillStyle = parcel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
                    ctx.font = `${Math.min(8, cellSize / 6)}px monospace`;
                    ctx.textAlign = 'left';
                    ctx.fillText(`${gx},${gy}`, screenX + 2, screenY + 10);
                }
            }
        }

        // Hot Zone highlight
        if (state.hotZone) {
            const hz = state.hotZone;
            const hzScreenX = (hz.x - startX) * cellSize;
            const hzScreenY = (hz.y - startY) * cellSize;
            const hzScreenW = hz.size * cellSize;
            const hzScreenH = hz.size * cellSize;

            ctx.save();
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ff660080';
            ctx.shadowBlur = 15;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(hzScreenX, hzScreenY, hzScreenW, hzScreenH);
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Draw minimap in corner
        const miniSize = 120;
        const miniX = w - miniSize - 10;
        const miniY = h - miniSize - 10;
        const miniCell = miniSize / gridSize;

        // Minimap background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(miniX - 1, miniY - 1, miniSize + 2, miniSize + 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(miniX - 1, miniY - 1, miniSize + 2, miniSize + 2);

        // Minimap parcels (batch with ImageData)
        const miniImageData = ctx.getImageData(miniX, miniY, miniSize, miniSize);
        const miniData = miniImageData.data;

        state.parcels.forEach((parcel) => {
            const px = Math.floor(parcel.x * miniCell);
            const py = Math.floor(parcel.y * miniCell);
            if (px >= 0 && px < miniSize && py >= 0 && py < miniSize) {
                const idx = (py * miniSize + px) * 4;
                const hex = parcel.color;
                miniData[idx] = parseInt(hex.slice(1, 3), 16);
                miniData[idx + 1] = parseInt(hex.slice(3, 5), 16);
                miniData[idx + 2] = parseInt(hex.slice(5, 7), 16);
                miniData[idx + 3] = 200;
            }
        });
        ctx.putImageData(miniImageData, miniX, miniY);

        // Minimap viewport indicator
        const vpX = miniX + ((camX - viewCells / 2) / gridSize) * miniSize;
        const vpY = miniY + ((camY - viewCells / 2) / gridSize) * miniSize;
        const vpW = (viewCells / gridSize) * miniSize;
        const vpH = (viewCells / gridSize) * miniSize;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(vpX, vpY, vpW, vpH);

    }, [state.parcels, state.hotZone, camX, camY, zoom, viewCells]);

    useEffect(() => {
        drawMap();
    }, [drawMap]);

    // ── Mouse handlers ──

    const screenToGrid = useCallback((clientX: number, clientY: number): { gx: number; gy: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { gx: -1, gy: -1 };
        const rect = canvas.getBoundingClientRect();
        const mx = ((clientX - rect.left) / rect.width) * canvas.width;
        const my = ((clientY - rect.top) / rect.height) * canvas.height;

        const startX = camX - viewCells / 2;
        const startY = camY - viewCells / 2;
        const cellSize = canvas.width / viewCells;

        const gx = Math.floor(startX + mx / cellSize);
        const gy = Math.floor(startY + my / cellSize);
        return { gx, gy };
    }, [camX, camY, viewCells]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const cellsPerPixel = viewCells / rect.width;

            setCamX(Math.max(viewCells / 2, Math.min(gridSize - viewCells / 2, dragStart.current.camX - dx * cellsPerPixel)));
            setCamY(Math.max(viewCells / 2, Math.min(gridSize - viewCells / 2, dragStart.current.camY - dy * cellsPerPixel)));
            return;
        }

        // Tooltip
        const tooltip = tooltipRef.current;
        if (!tooltip) return;
        const { gx, gy } = screenToGrid(e.clientX, e.clientY);
        if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) {
            tooltip.style.opacity = '0';
            return;
        }

        const owned = isParcelOwned(gx, gy);
        const parcel = state.parcels.get(`${gx},${gy}`);
        const container = containerRef.current;
        if (!container) return;
        const cRect = container.getBoundingClientRect();

        tooltip.style.left = `${e.clientX - cRect.left + 15}px`;
        tooltip.style.top = `${e.clientY - cRect.top - 10}px`;
        tooltip.style.opacity = '1';
        tooltip.innerHTML = owned
            ? `<div class="text-red-400 font-bold">🔒 OCUPADA</div>
         <div class="text-white/60">Dueño: ${parcel?.owner || '?'}</div>
         <div class="text-white/30">[${gx}, ${gy}]</div>`
            : `<div class="text-cyan-400 font-bold">✨ DISPONIBLE</div>
         <div class="text-white/40">[${gx}, ${gy}] — $5 USDC</div>
         <div class="text-cyan-400/50 text-[9px] mt-1">Clic para conquistar</div>`;
    }, [isDragging, screenToGrid, isParcelOwned, state.parcels, viewCells]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY, camX, camY };
    }, [camX, camY]);

    const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
        if (isDragging) {
            const dx = Math.abs(e.clientX - dragStart.current.x);
            const dy = Math.abs(e.clientY - dragStart.current.y);
            // If barely moved, treat as click
            if (dx < 4 && dy < 4) {
                const { gx, gy } = screenToGrid(e.clientX, e.clientY);
                if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
                    if (!isParcelOwned(gx, gy)) {
                        if (!isContractReady) {
                            alert("Por favor conecta tu wallet primero.");
                        } else {
                            try {
                                const priceUSDT = 5;
                                const isApprovalNeeded = parseFloat(contractState.usdtAllowance || '0') < priceUSDT;
                                if (isApprovalNeeded) {
                                    await approveUsdt(priceUSDT.toString());
                                }
                                await buyParcels([gx], [gy], undefined, parseInt('00f3ff', 16), "0x00000000");
                            } catch (err) {
                                console.error("Error al comprar parcela desde el mapa", err);
                            }
                        }
                    }
                }
            }
        }
        setIsDragging(false);
    }, [isDragging, screenToGrid, isParcelOwned, isContractReady, approveUsdt, buyParcels, contractState.usdtAllowance]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => {
            const factor = e.deltaY < 0 ? 1.3 : 0.77;
            return Math.max(1, Math.min(50, prev * factor));
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        const tooltip = tooltipRef.current;
        if (tooltip) tooltip.style.opacity = '0';
    }, []);

    // Zoom presets
    const zoomPresets = [
        { label: 'Global', zoom: 1 },
        { label: 'Zona', zoom: 5 },
        { label: 'Barrio', zoom: 15 },
        { label: 'Parcela', zoom: 35 },
    ];

    const pct = ((state.pixelsSold / state.totalPixels) * 100).toFixed(1);
    const cellSizeDisplay = (canvasRes / viewCells);

    return (
        <div ref={containerRef} className="relative group">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black text-white/30">
                        {state.pixelsSold.toLocaleString()} / {state.totalPixels.toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {zoomPresets.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setZoom(p.zoom)}
                            className={`text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider transition-all ${Math.abs(zoom - p.zoom) < 1
                                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                                : 'bg-white/5 text-white/30 border border-white/5 hover:text-white/50'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="relative glass-panel p-1 neon-border overflow-hidden rounded-xl">
                <canvas
                    ref={canvasRef}
                    width={canvasRes}
                    height={canvasRes}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    className={`w-full aspect-square block rounded-lg ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                />

                {/* Tooltip */}
                <div
                    ref={tooltipRef}
                    className="absolute z-50 bg-black/95 border border-white/20 px-3 py-2 text-[11px] rounded-lg pointer-events-none transition-opacity duration-100 opacity-0 backdrop-blur-md"
                    style={{ lineHeight: '1.4' }}
                />

                {/* Zoom info */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="bg-black/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-[9px] font-black text-white/40 uppercase tracking-wider border border-white/10">
                        🔍 {zoom.toFixed(1)}x • {cellSizeDisplay >= 20 ? 'Detalle' : cellSizeDisplay >= 6 ? 'Zona' : 'Satélite'}
                    </div>
                </div>

                {/* Hot Zone Badge */}
                {state.hotZone && (
                    <div className="absolute top-3 right-3 bg-orange-500/20 border border-orange-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2 animate-pulse">
                        <span className="text-orange-400 text-xs">🔥</span>
                        <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider">
                            HOT ZONE
                        </span>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <button onClick={() => setZoom(prev => Math.min(50, prev * 1.5))} className="w-7 h-7 bg-black/80 border border-white/10 rounded-md text-white/60 font-bold text-sm hover:bg-white/10 transition-colors backdrop-blur-md">+</button>
                    <button onClick={() => setZoom(prev => Math.max(1, prev / 1.5))} className="w-7 h-7 bg-black/80 border border-white/10 rounded-md text-white/60 font-bold text-sm hover:bg-white/10 transition-colors backdrop-blur-md">−</button>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-3 right-[140px] bg-black/60 backdrop-blur-md rounded-lg px-3 py-1 text-[8px] text-white/20 font-bold uppercase tracking-wider border border-white/5">
                    Scroll = Zoom • Arrastra = Mover • Clic = Comprar
                </div>
            </div>
        </div>
    );
}
