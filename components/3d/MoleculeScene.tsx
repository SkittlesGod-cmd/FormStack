"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Atom + Bond primitives
// ---------------------------------------------------------------------------
type Vec3 = [number, number, number];

const ATOMS: { pos: Vec3; color: string; r: number }[] = [
  { pos: [0, 0, 0],          color: "#7F77DD", r: 0.22 },
  { pos: [1.15, 0.7, 0.2],   color: "#ffffff", r: 0.17 },
  { pos: [-1.1, 0.65, -0.2], color: "#AFA9EC", r: 0.17 },
  { pos: [0.55, -0.85, 0.75],color: "#ffffff", r: 0.16 },
  { pos: [-0.5, -0.8, -0.65],color: "#7F77DD", r: 0.15 },
];

// Each pair is an index into ATOMS
const BONDS: [number, number][] = [[0, 1], [0, 2], [0, 3], [0, 4]];

// Pre-calculate bond transforms once at module load (static structure)
const BOND_TRANSFORMS = BONDS.map(([ai, bi]) => {
  const a = new THREE.Vector3(...ATOMS[ai].pos);
  const b = new THREE.Vector3(...ATOMS[bi].pos);
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.normalize()
  );
  const euler = new THREE.Euler().setFromQuaternion(q);
  return {
    position: mid.toArray() as Vec3,
    rotation: [euler.x, euler.y, euler.z] as Vec3,
    length,
  };
});

function Molecule() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.004;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Atoms */}
        {ATOMS.map(({ pos, color, r }, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[r, 24, 24]} />
            <meshStandardMaterial
              color={color}
              roughness={0.15}
              metalness={color === "#ffffff" ? 0.05 : 0.25}
              transparent={color === "#ffffff"}
              opacity={color === "#ffffff" ? 0.9 : 1}
            />
          </mesh>
        ))}

        {/* Bonds */}
        {BOND_TRANSFORMS.map(({ position, rotation, length }, i) => (
          <mesh key={i} position={position} rotation={rotation}>
            <cylinderGeometry args={[0.045, 0.045, length, 8]} />
            <meshStandardMaterial
              color="#4A4A5A"
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={0.55}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Scene export — dynamically imported in page (no SSR)
// ---------------------------------------------------------------------------
export default function MoleculeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ height: "100%", width: "100%", background: "transparent" }}
      dpr={[1, 2]}
    >
      <Molecule />
      <Environment preset="studio" />
    </Canvas>
  );
}
