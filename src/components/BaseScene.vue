<script setup lang="ts">
import { provideSceneLoad, type LoadError } from '@/composables/useSceneLoad';
import { type FrameCallback, provideThree } from '@/composables/useThree';
import { useTour } from '@/composables/useTour';
import { CameraSettings } from '@/constants/objectParams';
import { createCameraArc, type CameraArc } from '@/three/cameraArc';
import { createIntroAnim, type IntroScaleAnim } from '@/three/introScale';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as THREE from 'three/webgpu';
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';


const emit = defineEmits<{
    ready: [],
    error: [errors: LoadError[]]
}>();

let stats = undefined;
let activeArc: CameraArc | null = null;
let shouldAnimate = true;
let cameraTheta = 0;

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
const mainGroup = new THREE.Group();
mainGroup.scale.set(0, 0, 0);

const renderer = new THREE.WebGPURenderer({ antialias: true });

const onFrame = (cb: FrameCallback) => {
    callbacks.add(cb);
    return () => callbacks.delete(cb);
}

let resolveReady!: () => void;
const ready = new Promise<void>((r) => (resolveReady = r));

let cleanup: (() => void) | undefined;

provideThree({ scene, camera, renderer, onFrame, ready, mainGroup });

const load = provideSceneLoad();

const afterPaint = (): Promise<void> =>
    new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

// Intro animation
const introAnim = createIntroAnim(camera, mainGroup, { duration: 4.0, delay: 0.1, cameraSpeedMultiplier: 20 });
let introPlayed = false;

onMounted(async () => {
    containerRef.value!.appendChild(renderer.domElement);
    scene.background = new THREE.Color(0x000010);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.set(CameraSettings.POSITION_X, CameraSettings.POSITION_Y, CameraSettings.POSITION_Z);
    camera.lookAt(0, 0, 0);
    camera.layers.enableAll();
    scene.add(camera);
    scene.add(mainGroup);

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

    await waitforChildren();

    if (typeof renderer.compileAsync === "function") {
        await renderer.compileAsync(scene, camera);
    } else {
        renderer.compile(scene, camera);
    }

    renderer.render(scene, camera);

    await afterPaint();

    if (load.errors.value.length) emit("error", load.errors.value);
    emit("ready");

    let t = 0;
    const clock = new THREE.Timer();

    renderer.setAnimationLoop((): void => {
        stats?.begin();
        clock.update();
        const delta = clock.getDelta();
        t += delta;
        const elapsed = clock.getElapsed();
        for (const cb of callbacks) cb(t, elapsed);
        if (!introPlayed) {
            const { finished, extraTheta } = introAnim.tick(delta);
            cameraTheta = extraTheta;
            if (finished) introPlayed = true;
        } else if (activeArc) {
            const finished = activeArc.tick(delta);
            if (finished) activeArc = null;
        } else if (shouldAnimate) {
            cameraTheta += delta * CameraSettings.ROTATION_SPEED * Math.PI * 2;
            const x = CameraSettings.DISTANCE * Math.cos(cameraTheta);
            const z = CameraSettings.DISTANCE * Math.sin(cameraTheta);
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
    scene.remove(mainGroup);
    mainGroup.dispose();
    cleanup?.();
});

interface WaitOptions {
    settleFrames?: number
}

async function waitforChildren({ settleFrames = 2 }: WaitOptions = {}): Promise<void> {
    await nextTick();
    for (; ;) {
        await load.whenIdle();
        for (let i = 0; i < settleFrames; i++) {
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
        if (load.pending.value === 0) return;
    }
}


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