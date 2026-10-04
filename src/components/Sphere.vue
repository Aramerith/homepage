<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { color, mx_noise_float, normalLocal, pmremTexture, positionLocal, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

const { mainGroup, renderer, onFrame, ready } = useThree();
let unsubscribe: (() => void) | undefined;

// Sphere material
const uTime = uniform(0);
const uAmplitude = uniform(4);
const uFrequency = uniform(1.5);
const uSpeed = uniform(0.6);

const rotationSpeedX = Math.max(Math.random() / 2, 0.05);
const rotationSpeedY = Math.max(Math.random() / 2, 0.05);
const rotationSpeedZ = Math.max(Math.random() / 2, 0.05);

function displace(p: any) {
    const noisePos = p.mul(uFrequency).add(vec3(0, 0, uTime.mul(uSpeed)));
    const noiseValue = mx_noise_float(noisePos).abs().pow(2.2);
    return p.add(normalLocal.mul(noiseValue.mul(uAmplitude)));
}

const material = new THREE.MeshStandardNodeMaterial({
    color: 0x111111,
    roughness: 0.05,
    metalness: 0.85,
});

material.positionNode = displace(positionLocal);

// Material Normals
const eps = 0.01;
const n = positionLocal.normalize();
const t1 = n.cross(vec3(0, 0, 1)).normalize();
const t2 = n.cross(t1).normalize();

const p0 = displace(positionLocal);
const p1 = displace(positionLocal.add(t1.mul(eps)));
const p2 = displace(positionLocal.add(t2.mul(eps)));

material.normalNode = p1.sub(p0).cross(p2.sub(p0)).normalize();

// Sphere geometry and mesh

const geometry = new THREE.IcosahedronGeometry(10, 32);
const mesh = new THREE.Mesh(geometry, material);

onMounted(async () => { 
    await ready;
    // Room environment for reflections
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(environment, 0.04);
    const envMap = envRT.texture;

    const tintColor = color(0x990044);

    material.envNode = pmremTexture(envMap).mul(tintColor);
    mainGroup.add(mesh);
    unsubscribe = onFrame((time): void => {
        uTime.value = time;
        uFrequency.value = 0.25 + Math.sin(time * 0.5) * 0.1;
        mesh.rotation.x = time * rotationSpeedX;
        mesh.rotation.y = time * rotationSpeedY;
        mesh.rotation.z = time * rotationSpeedZ;
    });
});

onBeforeUnmount(() => {
    unsubscribe?.();
    mainGroup.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
});

</script>
<template>
    <span></span>
</template>

<style scoped></style>