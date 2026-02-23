"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGame, ParcelData } from '@/context/GameContext';
import { useContract } from '@/context/ContractContext';

const GRID = 500;

// ═══════════════════════════════════════════════════
//  COORDINATE HELPERS
// ═══════════════════════════════════════════════════

function gridToSphere(gx: number, gy: number, radius: number): THREE.Vector3 {
    const u = gx / GRID;
    const v = gy / GRID;
    const phi = (1 - v) * Math.PI;
    const theta = u * Math.PI * 2 - Math.PI;
    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function sphereToGrid(point: THREE.Vector3): { gx: number; gy: number } {
    const p = point.clone().normalize();
    const phi = Math.acos(p.y);
    const theta = Math.atan2(p.z, p.x);
    const u = (theta + Math.PI) / (2 * Math.PI);
    const v = 1 - phi / Math.PI;
    return {
        gx: Math.floor(u * GRID) % GRID,
        gy: Math.floor(v * GRID) % GRID,
    };
}

// ═══════════════════════════════════════════════════
//  PLANET SPHERE
// ═══════════════════════════════════════════════════

type ParcelInfo = {
    gx: number; gy: number;
    owned: boolean;
    owner?: string;
    color?: string;
    pos: THREE.Vector3;
};

function Planet({ onParcelHover, onParcelSelect, selectedParcel }: {
    onParcelHover: (info: ParcelInfo | null) => void;
    onParcelSelect: (info: ParcelInfo) => void;
    selectedParcel: ParcelInfo | null;
}) {
    const { state } = useGame();
    const meshRef = useRef<THREE.Mesh>(null);
    const radius = 2;

    // Optimized texture with TERRITORY LOGOS visible from space
    const planetTexture = useMemo(() => {
        const size = 2048;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Ocean base
        ctx.fillStyle = '#060d18';
        ctx.fillRect(0, 0, size, size);

        // Subtle grid (fewer lines)
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.02)';
        ctx.lineWidth = 0.5;
        const step = size / 25;
        for (let i = 0; i <= 25; i++) {
            ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
        }

        const cellW = size / GRID;
        const cellH = size / GRID;

        // ── 1. Draw parcels using fast ImageData ──
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        state.parcels.forEach((parcel) => {
            const px = Math.floor(parcel.x * cellW);
            const py = Math.floor((GRID - 1 - parcel.y) * cellH);
            const hex = parcel.color;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            // Fill 2x2 pixels for visibility
            for (let dy = 0; dy < 2 && py + dy < size; dy++) {
                for (let dx = 0; dx < 2 && px + dx < size; dx++) {
                    const idx = ((py + dy) * size + (px + dx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 220;
                }
            }
        });

        ctx.putImageData(imageData, 0, 0);

        // ── 2. TERRITORY DETECTION & LOGOS FROM SPACE ──
        // Group parcels by owner
        const territories = new Map<string, { parcels: ParcelData[]; color: string }>();
        state.parcels.forEach((parcel) => {
            const existing = territories.get(parcel.owner);
            if (existing) {
                existing.parcels.push(parcel);
            } else {
                territories.set(parcel.owner, { parcels: [parcel], color: parcel.color });
            }
        });

        // For each territory with enough parcels, draw logo visible from space
        territories.forEach((territory, owner) => {
            const count = territory.parcels.length;
            if (count < 30) return; // Need at least 30 parcels for a visible logo

            // Calculate centroid
            let sumX = 0, sumY = 0;
            territory.parcels.forEach(p => { sumX += p.x; sumY += p.y; });
            const cx = (sumX / count) * cellW;
            const cy = ((GRID - 1) - (sumY / count)) * cellH;

            // Logo size scales with territory size
            const logoScale = Math.min(3, Math.max(0.8, Math.sqrt(count) / 12));

            // Glow behind text
            const glowRadius = 30 * logoScale;
            const hex = territory.color;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
            glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

            // Territory border (subtle outline around cluster)
            let minX = GRID, maxX = 0, minY = GRID, maxY = 0;
            territory.parcels.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
            });
            const bx = minX * cellW;
            const by = (GRID - 1 - maxY) * cellH;
            const bw = (maxX - minX + 1) * cellW;
            const bh = (maxY - minY + 1) * cellH;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.lineWidth = 1.5 * logoScale;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);

            // Owner name as LARGE TEXT visible from space
            // Identify if it's an ON-CHAIN IDENTIFIER (usually 4 chars, not 0x...)
            const isCustom = owner.length <= 4 && !owner.startsWith('0x');
            const label = isCustom ? owner : (owner.length > 10 ? owner.slice(0, 6) + '...' : owner);

            const fontSize = isCustom ? Math.round(18 * logoScale) : Math.round(12 * logoScale);
            ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text shadow for readability
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
            ctx.shadowBlur = 8 * logoScale;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Black outline for contrast
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeText(label, cx, cy - fontSize * 0.6);

            // Colored text (Brighter if custom)
            ctx.fillStyle = isCustom
                ? `rgb(255, 255, 255)`
                : `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
            ctx.fillText(label, cx, cy - fontSize * 0.6);

            // Parcel count badge
            ctx.font = `bold ${Math.round(7 * logoScale)}px Arial, sans-serif`;
            ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.fillText(`🏴 ${count} parcelas`, cx, cy + fontSize * 0.4);

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        });

        // ── 3. Highlight selected parcel ──
        if (selectedParcel) {
            const sx = selectedParcel.gx * cellW;
            const sy = (GRID - 1 - selectedParcel.gy) * cellH;
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx - 2, sy - 2, cellW + 4, cellH + 4);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
            ctx.fillRect(sx, sy, cellW, cellH);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }, [state.parcels]); // No dependency on selectedParcel — avoids full texture rebuild on click

    // Atmospheric glow shader
    const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color('#00f3ff') } },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
        fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 color;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, intensity * 0.35);
      }`,
        transparent: true,
        side: THREE.BackSide,
    }), []);

    const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const { gx, gy } = sphereToGrid(e.point);
        const key = `${gx},${gy}`;
        const parcel = state.parcels.get(key);
        onParcelHover({
            gx, gy,
            owned: !!parcel,
            owner: parcel?.owner,
            color: parcel?.color,
            pos: e.point.clone(),
        });
    }, [state.parcels, onParcelHover]);

    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const { gx, gy } = sphereToGrid(e.point);
        const key = `${gx},${gy}`;
        const parcel = state.parcels.get(key);
        onParcelSelect({
            gx, gy,
            owned: !!parcel,
            owner: parcel?.owner,
            color: parcel?.color,
            pos: e.point.clone(),
        });
    }, [state.parcels, onParcelSelect]);

    // Slow idle rotation (stop when parcel selected)
    useFrame((_, delta) => {
        if (meshRef.current && !selectedParcel) {
            meshRef.current.rotation.y += delta * 0.03;
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => onParcelHover(null)}
                onClick={handleClick}
            >
                <sphereGeometry args={[radius, 64, 32]} />
                <meshStandardMaterial
                    map={planetTexture}
                    roughness={0.7}
                    metalness={0.1}
                    emissive="#001020"
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Atmospheric glow */}
            <mesh>
                <sphereGeometry args={[radius * 1.12, 32, 16]} />
                <primitive object={glowMaterial} attach="material" />
            </mesh>

            {/* Hot Zone marker */}
            {state.hotZone && (
                <HotZoneMarker
                    gx={state.hotZone.x + state.hotZone.size / 2}
                    gy={state.hotZone.y + state.hotZone.size / 2}
                    radius={radius}
                />
            )}
        </group>
    );
}

// ═══════════════════════════════════════════════════
//  HOT ZONE MARKER
// ═══════════════════════════════════════════════════

function HotZoneMarker({ gx, gy, radius }: { gx: number; gy: number; radius: number }) {
    const ref = useRef<THREE.Mesh>(null);
    const pos = useMemo(() => gridToSphere(gx, gy, radius * 1.06), [gx, gy, radius]);
    useFrame((s) => {
        if (ref.current) ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 3) * 0.15);
    });
    return (
        <mesh ref={ref} position={pos}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.7} />
        </mesh>
    );
}

// ═══════════════════════════════════════════════════
//  HOVER TOOLTIP (small, unobtrusive)
// ═══════════════════════════════════════════════════

function Tooltip({ info }: { info: ParcelInfo | null }) {
    if (!info) return null;
    return (
        <Html position={[info.pos.x * 1.08, info.pos.y * 1.08, info.pos.z * 1.08]} center>
            <div className="bg-black/90 border border-white/20 rounded-lg px-3 py-2 text-[10px] pointer-events-none whitespace-nowrap shadow-2xl backdrop-blur-md">
                <div className={info.owned ? 'text-orange-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {info.owned ? '🔒 Ocupada' : '✨ Disponible'}
                </div>
                <div className="text-white/40">[{info.gx}, {info.gy}]</div>
            </div>
        </Html>
    );
}

// ═══════════════════════════════════════════════════
//  CAMERA FLY-TO CONTROLLER
// ═══════════════════════════════════════════════════

function CameraController({ flyTarget, zoomDelta }: {
    flyTarget: THREE.Vector3 | null;
    zoomDelta: number;
}) {
    const { camera } = useThree();
    const flyRef = useRef<{ target: THREE.Vector3; progress: number } | null>(null);

    // Button zoom
    useEffect(() => {
        if (zoomDelta === 0) return;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const newPos = camera.position.clone().addScaledVector(dir, zoomDelta * 0.5);
        const dist = newPos.length();
        if (dist >= 2.05 && dist <= 10) camera.position.copy(newPos);
    }, [zoomDelta, camera]);

    // Fly to parcel
    useEffect(() => {
        if (flyTarget) {
            flyRef.current = {
                target: flyTarget.clone().normalize().multiplyScalar(2.15),
                progress: 0,
            };
        }
    }, [flyTarget]);

    useFrame((_, delta) => {
        if (!flyRef.current) return;
        flyRef.current.progress += delta * 2;
        const t = Math.min(flyRef.current.progress, 1);
        camera.position.lerp(flyRef.current.target, 0.06);
        camera.lookAt(0, 0, 0);
        if (t >= 1) flyRef.current = null;
    });

    return null;
}

// ═══════════════════════════════════════════════════
//  PARCEL DETAIL CARD (Google Earth-style info window)
// ═══════════════════════════════════════════════════

function ParcelDetailCard({ parcel, onBuy, onClose, buying }: {
    parcel: ParcelInfo;
    onBuy: () => void;
    onClose: () => void;
    buying?: boolean;
}) {
    const { state } = useGame();
    const ownerData = parcel.owned ? state.parcels.get(`${parcel.gx},${parcel.gy}`) : null;

    return (
        <div className="absolute right-4 top-4 w-72 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-right-5"
            style={{ animation: 'slideIn 0.3s ease-out' }}
        >
            {/* Parcel preview */}
            <div
                className="w-full h-44 relative flex items-center justify-center"
                style={{ background: parcel.owned ? (parcel.color || '#1a1a2e') : 'linear-gradient(135deg, #0a0a1a, #1a1a3e)' }}
            >
                {parcel.owned && ownerData ? (
                    <div className="text-center">
                        <div className="text-4xl mb-2">🏴</div>
                        <div className="text-white/90 font-black text-sm">{ownerData.owner}</div>
                        <div className="text-white/30 text-[10px] mt-1">CONQUISTADOR</div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-5xl mb-3 opacity-30">🌍</div>
                        <div className="text-cyan-400/60 text-xs font-bold uppercase tracking-wider">Territorio Libre</div>
                        <div className="text-white/20 text-[10px] mt-1">Esperando un conquistador</div>
                    </div>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white/40 hover:text-white text-sm flex items-center justify-center transition-colors"
                >✕</button>

                {/* Coordinate badge */}
                <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-2 py-1 text-[9px] font-mono text-white/50">
                    📍 [{parcel.gx}, {parcel.gy}]
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Parcela</div>
                        <div className="text-white font-black text-lg">#{parcel.gx * GRID + parcel.gy}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Precio</div>
                        <div className="text-cyan-400 font-black text-lg">$5 <span className="text-[10px] text-white/30">USDC</span></div>
                    </div>
                </div>

                {parcel.owned ? (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2 text-center">
                        <div className="text-orange-400 font-bold text-xs">🔒 PARCELA OCUPADA</div>
                        <div className="text-white/40 text-[10px] mt-1">Pertenece a {ownerData?.owner}</div>
                    </div>
                ) : (
                    <button
                        onClick={onBuy}
                        disabled={buying}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-black text-sm uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                    >
                        {buying ? '⏳ PROCESANDO...' : '⚔️ CONQUISTAR ESTA PARCELA'}
                    </button>
                )}

                {/* Neighbors info */}
                <div className="border-t border-white/5 pt-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/20 font-bold mb-2">Vecinos</div>
                    <div className="grid grid-cols-3 gap-1">
                        {[[-1, -1], [0, -1], [1, -1], [-1, 0], null, [1, 0], [-1, 1], [0, 1], [1, 1]].map((offset, i) => {
                            if (!offset) return <div key={i} className="h-6 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-[8px] text-cyan-400">TÚ</div>;
                            const nx = parcel.gx + offset[0];
                            const ny = parcel.gy + offset[1];
                            const neighbor = state.parcels.get(`${nx},${ny}`);
                            return (
                                <div
                                    key={i}
                                    className={`h-6 rounded text-[7px] flex items-center justify-center ${neighbor
                                        ? 'bg-white/5 text-white/30'
                                        : 'bg-white/[0.02] text-white/10'
                                        }`}
                                    style={neighbor ? { backgroundColor: neighbor.color + '30' } : {}}
                                >
                                    {neighbor ? '🏴' : '·'}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function PlanetMap() {
    const { state, buyParcel } = useGame();
    const { isContractReady, approveUsdt, buyParcels, state: contractState } = useContract();
    const [hoverInfo, setHoverInfo] = useState<ParcelInfo | null>(null);
    const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
    const [flyTarget, setFlyTarget] = useState<THREE.Vector3 | null>(null);
    const [zoomDelta, setZoomDelta] = useState(0);
    const [buying, setBuying] = useState(false);

    const handleSelect = useCallback((info: ParcelInfo) => {
        setSelectedParcel(info);
        setFlyTarget(info.pos);
    }, []);

    const handleBuy = useCallback(async () => {
        if (!isContractReady) {
            alert("Por favor, conecta tu wallet primero usando el botón de arriba.");
            return;
        }

        if (selectedParcel && !selectedParcel.owned) {
            setBuying(true);
            try {
                // Check allowance
                const priceUSDT = 5;
                const isApprovalNeeded = parseFloat(contractState.usdtAllowance || '0') < priceUSDT;

                if (isApprovalNeeded) {
                    await approveUsdt(priceUSDT.toString());
                }

                // Default color & identifier since this modal doesn't have the customization panel
                const defaultColorUint = parseInt('00f3ff', 16);
                const defaultIdentifier = "0x00000000";

                // Execute on-chain purchase
                const hash = await buyParcels(
                    [selectedParcel.gx],
                    [selectedParcel.gy],
                    undefined,
                    defaultColorUint,
                    defaultIdentifier
                );

                if (hash) {
                    // Transaction succeeded, update UI optimistically until sync catches up
                    setSelectedParcel(prev => prev ? { ...prev, owned: true, owner: 'TÚ' } : null);
                }
            } catch (err) {
                console.error("Purchase failed or rejected in the map modal", err);
            } finally {
                setBuying(false);
            }
        }
    }, [selectedParcel, isContractReady, approveUsdt, buyParcels, contractState.usdtAllowance]);

    const handleClose = useCallback(() => {
        setSelectedParcel(null);
        setFlyTarget(null);
    }, []);

    const handleZoom = (dir: number) => setZoomDelta(prev => prev + dir);
    const pct = ((state.pixelsSold / state.totalPixels) * 100).toFixed(1);

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-black text-white/30">
                        PLANETA • {state.pixelsSold.toLocaleString()} / {state.totalPixels.toLocaleString()}
                    </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] font-black text-cyan-400">
                    {pct}% CONQUISTADO
                </span>
            </div>

            {/* 3D Canvas */}
            <div className="glass-panel neon-border rounded-xl overflow-hidden relative" style={{ height: '600px' }}>
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                >
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
                    <directionalLight position={[-3, -2, -3]} intensity={0.3} color="#00f3ff" />
                    <pointLight position={[0, 0, 4]} intensity={0.5} color="#00f3ff" />

                    <Stars radius={50} depth={40} count={3000} factor={3} saturation={0.2} fade speed={0.5} />

                    <Planet onParcelHover={setHoverInfo} onParcelSelect={handleSelect} selectedParcel={selectedParcel} />
                    <Tooltip info={hoverInfo} />
                    <CameraController flyTarget={flyTarget} zoomDelta={zoomDelta} />

                    <OrbitControls
                        enablePan={false}
                        minDistance={2.05}
                        maxDistance={10}
                        autoRotate={!selectedParcel}
                        autoRotateSpeed={0.3}
                        enableDamping
                        dampingFactor={0.05}
                        rotateSpeed={0.5}
                    />
                </Canvas>

                {/* Zoom Buttons */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <button onClick={() => handleZoom(1)} className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl text-white font-bold text-xl hover:bg-cyan-400/20 hover:border-cyan-400/40 hover:text-cyan-400 transition-all active:scale-90 shadow-lg">+</button>
                    <button onClick={() => handleZoom(-1)} className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl text-white font-bold text-xl hover:bg-cyan-400/20 hover:border-cyan-400/40 hover:text-cyan-400 transition-all active:scale-90 shadow-lg">−</button>
                    {selectedParcel && (
                        <button onClick={handleClose} className="w-10 h-10 bg-black/80 backdrop-blur-md border border-orange-400/30 rounded-xl text-orange-400 font-bold text-xs hover:bg-orange-400/20 transition-all active:scale-90 shadow-lg mt-2" title="Volver al planeta">🌍</button>
                    )}
                </div>

                {/* Parcel Detail Card (Google Earth-style) */}
                {selectedParcel && (
                    <ParcelDetailCard
                        parcel={selectedParcel}
                        onBuy={handleBuy}
                        onClose={handleClose}
                        buying={buying}
                    />
                )}

                {/* Instructions */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 text-[9px] text-white/30 font-bold uppercase tracking-wider border border-white/5">
                        {selectedParcel
                            ? '🔍 Parcela seleccionada • Gira para explorar • 🌍 para volver'
                            : '🖱️ Girar • Scroll = Zoom • Clic = Seleccionar parcela'}
                    </div>
                </div>

                {/* Hot Zone */}
                {state.hotZone && !selectedParcel && (
                    <div className="absolute top-4 right-4 bg-orange-500/20 border border-orange-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2 animate-pulse">
                        <span className="text-orange-400 text-xs">🔥</span>
                        <span className="text-[9px] font-black uppercase text-orange-400 tracking-wider">HOT ZONE</span>
                    </div>
                )}
            </div>
        </div>
    );
}
