<script setup lang="ts">
import { type FrameCallback, provideThree } from '@/composables/useThree';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

let stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const ascpectRatio = window.innerWidth / window.innerHeight;
const cameraSpeed = 0.01;
const cameraRadius = 60;
const containerRef = useTemplateRef<HTMLDivElement>('sphereContainer')
const callbacks = new Set<FrameCallback>();

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, ascpectRatio, 0.1, 1000);
const renderer = new THREE.WebGPURenderer({ antialias: true });

const onFrame = (cb: FrameCallback) => {
    callbacks.add(cb);
    return () => callbacks.delete(cb);
}

let resolveReady!: () => void;
const ready = new Promise<void>((r) => (resolveReady = r));

let cleanup: (() => void) | undefined;

provideThree({scene, camera, renderer, onFrame, ready});

onMounted(async () => {
    const clock = new THREE.Timer();
    containerRef.value!.appendChild(renderer.domElement);
    scene.background = new THREE.Color(0x000010);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(10, 15, 70);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    await renderer.init();

    resolveReady();

    // Room environment for reflections
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(environment, 0.04);
    const envMap = envRT.texture;
    // scene.environment = envMap;

    let t = 0;

    renderer.setAnimationLoop((): void => {
        stats.begin();
        clock.update();
        const delta = clock.getDelta();
        t += delta;
        const elapsed = clock.getElapsed();
        for (const cb of callbacks) cb(t, elapsed);

        const theta = t * cameraSpeed * Math.PI * 2;
        const x = cameraRadius * Math.cos(theta);
        const z = cameraRadius * Math.sin(theta);
        camera.lookAt(0, 0, 0);
        camera.position.set(x, 15, z);

        renderer.render(scene, camera);
        stats.end();
    });

    cleanup = (): void => {
        renderer?.setAnimationLoop(null);
        callbacks.clear();
        renderer?.dispose();
    }
});

onBeforeUnmount(() => {
    cleanup?.();
});

</script>

<template>
    <div ref="sphereContainer">
        <slot />
    </div>
</template>

<style scoped></style>