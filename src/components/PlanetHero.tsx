"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

function SpinningPlanet() {
    const meshRef = useRef<THREE.Mesh>(null);
    const radius = 2.2;

    const texture = useMemo(() => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Dark ocean base
        ctx.fillStyle = '#060d18';
        ctx.fillRect(0, 0, size, size);

        // Subtle grid glow
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.03)';
        ctx.lineWidth = 0.5;
        const step = size / 20;
        for (let i = 0; i <= 20; i++) {
            ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
        }

        // Random "parcels" for visual effect
        const colors = ['#ff6b35', '#00d4ff', '#a855f7', '#22d3ee', '#f59e0b', '#ec4899', '#10b981'];
        for (let i = 0; i < 800; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.globalAlpha = 0.3 + Math.random() * 0.5;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
        }

        // Territory labels
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#00f3ff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CONQUISTADOR', size * 0.3, size * 0.35);
        ctx.fillStyle = '#a855f7';
        ctx.fillText('EMPEROR_X', size * 0.7, size * 0.6);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🏆 GANADOR', size * 0.5, size * 0.8);
        ctx.globalAlpha = 1;

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []);

    const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                gl_FragColor = vec4(0.0, 0.8, 1.0, 1.0) * intensity * 0.8;
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
    }), []);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.08;
        }
    });

    return (
        <group>
            <mesh ref={meshRef}>
                <sphereGeometry args={[radius, 48, 24]} />
                <meshStandardMaterial
                    map={texture}
                    roughness={0.7}
                    metalness={0.1}
                    emissive="#001020"
                    emissiveIntensity={0.3}
                />
            </mesh>
            <mesh>
                <sphereGeometry args={[radius * 1.12, 32, 16]} />
                <primitive object={glowMaterial} attach="material" />
            </mesh>
        </group>
    );
}

export default function PlanetHero() {
    return (
        <Canvas
            camera={{ position: [0, 0, 5.5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
        >
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 3, 5]} intensity={1.2} />
            <pointLight position={[-5, -3, -5]} intensity={0.3} color="#9d00ff" />
            <Stars radius={100} depth={50} count={800} factor={3} saturation={0.3} fade />
            <SpinningPlanet />
        </Canvas>
    );
}
