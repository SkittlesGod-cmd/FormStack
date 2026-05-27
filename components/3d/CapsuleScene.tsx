"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Capsule mesh — two halves with clipping planes for the pharma split look
// ---------------------------------------------------------------------------
function TopHalf({ clipPlane }: { clipPlane: THREE.Plane }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Set clipping on the underlying Three.js material (MeshTransmissionMaterial
  // is a React component, so we reach through the mesh to its material instance)
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.Material;
    mat.clippingPlanes = [clipPlane];
    mat.needsUpdate = true;
  }, [clipPlane]);

  return (
    <mesh ref={meshRef}>
      <capsuleGeometry args={[0.4, 1.2, 8, 24]} />
      <MeshTransmissionMaterial
        color="#AFA9EC"
        thickness={0.3}
        roughness={0}
        transmission={0.9}
        chromaticAberration={0.1}
        backside
        samples={6}
      />
    </mesh>
  );
}

function BottomHalf({ clipPlane }: { clipPlane: THREE.Plane }) {
  return (
    <mesh>
      <capsuleGeometry args={[0.4, 1.2, 8, 24]} />
      <meshStandardMaterial
        color="#7F77DD"
        metalness={0.2}
        roughness={0.1}
        clippingPlanes={[clipPlane]}
      />
    </mesh>
  );
}

function Capsule() {
  const groupRef = useRef<THREE.Group>(null);

  // Clipping planes: top keeps y ≥ 0, bottom keeps y ≤ 0
  const topClip = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    []
  );
  const bottomClip = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  );

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.45}>
      <group ref={groupRef}>
        <TopHalf clipPlane={topClip} />
        <BottomHalf clipPlane={bottomClip} />
      </group>
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Scene export — dynamically imported in page (no SSR)
// ---------------------------------------------------------------------------
export default function CapsuleScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      gl={{ localClippingEnabled: true, antialias: true, alpha: true }}
      style={{ height: "100%", width: "100%", background: "transparent" }}
      dpr={[1, 2]}
    >
      <Capsule />
      <Environment preset="studio" />
    </Canvas>
  );
}
