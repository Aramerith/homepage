<script setup lang="ts">
import { type FrameCallback, provideThree } from '@/composables/useThree';
import { TourTarget, useTour } from '@/composables/useTour';
import { CameraSettings } from '@/constants/objectParams';
import { createCameraArc, type CameraArc } from '@/three/cameraArc';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

let stats = undefined;
let activeArc: CameraArc | null = null;
let shouldAnimate = true;

const tour = useTour();

const textureLoader = new THREE.TextureLoader();

// dev stats
if (window.location.toString().includes("localhost")) {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
}

const ascpectRatio = window.innerWidth / window.innerHeight;
const containerRef = useTemplateRef<HTMLDivElement>('sphereContainer')
const callbacks = new Set<FrameCallback>();

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    CameraSettings.FOV,
    ascpectRatio,
    CameraSettings.NEAR,
    CameraSettings.FAR
);
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
    camera.position.set(CameraSettings.POSITION_X, CameraSettings.POSITION_Y, CameraSettings.POSITION_Z);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    await renderer.init();

    resolveReady();
    textureLoader.load("/multi_nebulae_1k.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
    });
    // Room environment for reflections
    // const environment = new RoomEnvironment();
    // const pmremGenerator = new THREE.PMREMGenerator(renderer);
    // const envRT = pmremGenerator.fromScene(environment, 0.04);
    // const envMap = envRT.texture;


    //scene.environment = envMap;

    let t = 0;

    renderer.setAnimationLoop((): void => {
        stats?.begin();
        clock.update();
        const delta = clock.getDelta();
        t += delta;
        const elapsed = clock.getElapsed();
        for (const cb of callbacks) cb(t, elapsed);

        if (activeArc) {
            const finished = activeArc.tick(delta);
            if (finished) activeArc = null;
        } else if (shouldAnimate) {
            const theta = t * CameraSettings.ROTATION_SPEED * Math.PI * 2;
            const x = CameraSettings.DISTANCE * Math.cos(theta);
            const z = CameraSettings.DISTANCE * Math.sin(theta);
            camera.lookAt(0, 0, 0);
            camera.position.set(x, CameraSettings.POSITION_Y, z);
        }

        renderer.render(scene, camera);
        stats?.end();
    });

    cleanup = (): void => {
        renderer?.setAnimationLoop(null);
        callbacks.clear();
        renderer?.dispose();
    }
});

watch(
    () => tour.requestedTarget.value,
    (targetId) => {
        if (!targetId) {
            shouldAnimate = true;
            return;
        };
        shouldAnimate = false;
        const pos = tour.getTargetPosition(targetId);
        if (!pos) {
            tour.animationFinished();
            return;
        }

        activeArc?.cancel();
        activeArc = createCameraArc(camera, pos, {
            onDone: () => tour.animationFinished(),
        });

    }
)

onBeforeUnmount(() => {
    cleanup?.();
});

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

</script>

<template>
    <div ref="sphereContainer">
        <slot />
    </div>
</template>

<style scoped></style>