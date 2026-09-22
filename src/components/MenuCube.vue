<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import getRadialPosition from '@/three/radialPosition';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { Fn, positionLocal, sin, uniform, time, vec3, hash, uv, vec4, floor, step, mix, cameraWorldMatrix, modelWorldMatrixInverse, modelViewMatrix, color, pmremTexture, vec2, varying, materialColor, screenUV } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

// constants
const SEGMENT_SIZE = 16;
const GLITCH_MULTIPLIER = 1.2;
const GLITCH_DECAY = 0.9;
const GLITCH_SPEED = 50000;
const GLITCH_CHANCE_PERCENT = 0.2;



const { scene, onFrame, ready, renderer } = useThree(); 
let unsubscribe: (() => void) | undefined;

const props = defineProps<{
    size: number,
    distance: number,
    horizontalAngle: number,
    verticalAngle: number
}>();
const rotationX = Math.random() * 0.001;
const rotationY = Math.random() * 0.001;
const rotationZ = Math.random() * 0.001;

const geometry = new THREE.BoxGeometry(props.size, props.size, props.size, SEGMENT_SIZE, SEGMENT_SIZE, SEGMENT_SIZE);
const material = new THREE.MeshStandardNodeMaterial({
    color: Math.random() * 0xFFFFFF,
    roughness: 0.5,
    metalness: 1,
});

const vGlitchState = varying(vec2(0.0, 0.0));

const glitchStrength = uniform(0.0);
const bandCount = uniform(3);
const glitchSpeed = uniform(GLITCH_SPEED);
const glitchSeed = uniform(0.0);
const jitterAmount = uniform(0);

const invModelView = modelWorldMatrixInverse.mul(cameraWorldMatrix);

material.positionNode = Fn(() => {
    const posView = modelViewMatrix.mul(vec4(positionLocal, 1.0)).xyz;

    const stepTime = floor(time.mul(10.0));

    const bandRaw = floor(posView.y.mul(bandCount).add(time.mul(glitchSpeed)));
    const bandId = bandRaw.add(glitchSeed).add(stepTime.mul(37.0));

    const h1 = hash(vec2(bandId, 0.0));
    const h2 = hash(vec2(bandId, 1.0));

    const isGlitched = step(h1.oneMinus(), glitchStrength);
    const direction = h2.sub(0.5).mul(2.0);

    const vId = positionLocal.mul(137.0);
    const jY = hash(vec2(vId.x, vId.y)).sub(0.5);
    const jZ = hash(vec2(vId.y, vId.z)).sub(0.5);

    const g = isGlitched.mul(glitchStrength);
    const shiftX = direction.mul(g).mul(0.4);
    const shiftY = jY.mul(g).mul(jitterAmount);
    const shiftZ = jZ.mul(g).mul(jitterAmount);

    vGlitchState.assign(vec2(isGlitched, direction));

    const glitchedView = posView.add(vec3(shiftX, shiftY, shiftZ));
    return invModelView.mul(vec4(glitchedView, 1.0)).xyz;
})();

// Chromatic abberation
material.colorNode = Fn(() => {
    const posView = modelViewMatrix.mul(vec4(positionLocal, 1.0)).xyz;

    const isGlitched = vGlitchState.x;
    const direction = vGlitchState.y;
    const dirSign = step(0.0, direction).mul(2.0).sub(1.0);

    const stepTime = floor(time.mul(10.0));

    const bandRaw = floor(posView.y.mul(bandCount).add(time.mul(glitchSpeed)));
    const bandId = bandRaw.add(glitchSeed).add(stepTime.mul(37.0));

    const bandShift = hash(vec2(bandId, 3.0)).sub(0.5).mul(0.3);

    const ab = isGlitched.mul(glitchStrength).mul(0.04).mul(dirSign);

    const x = screenUV.x.add(bandShift);
    const y = screenUV.y;

    const sample = (dx: THREE.Node<"float"> | number): any => {
        return sin(x.add(dx).mul(50.0).add(y.mul(20.0))).mul(0.5).add(0.5);
    };
    const r = sample(ab);
    const g = sample(0.0);
    const b = sample(ab.negate());

    const glitchColor = vec3(r, g, b);
    const baseColor = materialColor;

    return vec4(mix(baseColor, glitchColor, isGlitched.mul(glitchStrength)), 1.0);
})();

const cube = new THREE.Mesh(geometry, material);

cube.position.copy(getRadialPosition(props.distance, props.horizontalAngle, props.verticalAngle));

scene.add(cube);

onMounted(async () => {
    await ready;
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(environment, 0.04);
    const envMap = envRT.texture;

    const tintColor = color(Math.random() * 0xffffff);

    material.envNode = pmremTexture(envMap).mul(tintColor);
    unsubscribe = onFrame((time: number): void => {
        if (Math.random() > (1 - GLITCH_CHANCE_PERCENT * 0.01)) {
            glitchStrength.value = Math.max(Math.random(), 0.5) * props.size * GLITCH_MULTIPLIER;
            glitchSeed.value = Math.random() * 1000.0;
        } else {
            glitchStrength.value *= GLITCH_DECAY;
        }

        cube.rotation.x += rotationX;
        cube.rotation.y += rotationY;
        cube.rotation.z += rotationZ;
    });
});

onBeforeUnmount(() => {
    scene.remove(cube);
    cube.dispose();
    unsubscribe?.();
});

</script>

<template>

</template>

<style scoped></style>