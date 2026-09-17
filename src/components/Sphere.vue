<script setup lang="ts">
import { provideThree } from '@/composables/useThree';
import { OrbitControls, RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { color, mx_noise_float, normalLocal, pmremTexture, positionLocal, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue';

const ascpectRatio = window.innerWidth / window.innerHeight;
const containerRef = useTemplateRef<HTMLDivElement>('sphereContainer')

let cleanup: (() => void) | undefined;

// non-reactive handles
const sceneRef = shallowRef<THREE.Scene>();
const cameraRef = shallowRef<THREE.PerspectiveCamera>();
const rendererRef = shallowRef<THREE.WebGPURenderer>();

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, ascpectRatio, 0.1, 1000);
const renderer = new THREE.WebGPURenderer({ antialias: true });

scene.background = new THREE.Color(0x000010);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 4;
scene.add(camera);

// Orbit controls
new OrbitControls(camera, renderer.domElement);

// Sphere material
const uTime = uniform(0);
const uAmplitude = uniform(1.2);
const uFrequency = uniform(1.5);
const uSpeed = uniform(0.5);

function displace(p: any) {
    const noisePos = p.mul(uFrequency).add(vec3(0, 0, uTime.mul(uSpeed)));
    const noiseValue = mx_noise_float(noisePos).abs().pow(2.2);
    return p.add(normalLocal.mul(noiseValue.mul(uAmplitude)));
}

const material = new THREE.MeshStandardNodeMaterial({
    color: 0x036264,
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

const geometry = new THREE.IcosahedronGeometry(1, 32);
const mesh = new THREE.Mesh(geometry, material);

scene.add(mesh);

onMounted(async () => { 
    containerRef.value!.appendChild(renderer.domElement);
    await renderer.init();

    // Room environment for reflections
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(environment, 0.04);
    const envMap = envRT.texture;
    scene.environment = envMap;

    const tintColor = color(0xe0829d);

    material.envNode = pmremTexture(envMap).mul(tintColor);

    sceneRef.value = scene;
    cameraRef.value = camera;
    rendererRef.value = renderer;

    provideThree({ scene: scene, camera: camera, renderer: renderer });

    renderer.setAnimationLoop((time: number): void => {
        uTime.value = time * 0.001;
        uFrequency.value = 2.0 + Math.sin(time * 0.001) * 0.5;
        mesh.rotation.x = time * 0.0003;
        mesh.rotation.y = time * 0.0002;
        mesh.rotation.z = time * 0.0001;
        renderer.render(scene, camera);
    });

    cleanup = (): void => {
        renderer?.setAnimationLoop(null);
        geometry.dispose();
        material.dispose();
        renderer?.dispose();
    }
});

onBeforeUnmount(() => cleanup?.());

</script>
<template>
    <div ref="sphereContainer"></div>
    <slot />
</template>

<style scoped></style>