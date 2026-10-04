<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import { useTour, type TourTarget } from '@/composables/useTour';
import { DOF_EXCLUDE_LAYER, MenuCubeSettings } from '@/constants/objectParams';
import { createGlitchMaterial } from '@/three/glitchEffect';
import getRadialPosition from '@/three/radialPosition';
import { createRiftMaterial } from '@/three/riftEffect';
import { RoomEnvironment } from 'three/examples/jsm/Addons.js';
import { color, pmremTexture } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

const tour = useTour();

const { onFrame, ready, renderer, mainGroup } = useThree();
let unsubscribe: (() => void) | undefined;
let unregister: (() => void) | null = null;

const props = defineProps<{
    size: number,
    distance: number,
    horizontalAngle: number,
    verticalAngle: number,
    targetName: TourTarget
}>();
const rotationX = Math.random() * MenuCubeSettings.ROTATION_SPEED;
const rotationY = Math.random() * MenuCubeSettings.ROTATION_SPEED;
const rotationZ = Math.random() * MenuCubeSettings.ROTATION_SPEED;
const tmp = new THREE.Vector3();

const geometry = new THREE.BoxGeometry(
    props.size,
    props.size,
    props.size,
    MenuCubeSettings.SEGMENT_SIZE,
    MenuCubeSettings.SEGMENT_SIZE,
    MenuCubeSettings.SEGMENT_SIZE
);

const material = new THREE.MeshStandardNodeMaterial({
    color: Math.random() * 0xFFFFFF,
    roughness: 0.3,
    metalness: 0,
});

const { uniforms: glitchUniforms, positionNode: glitchPositionNode, colorNode: glitchColorNode } = createGlitchMaterial();
// const { uniforms: riftUniforms, positionNode: riftPositionNode, colorNode: riftColorNode } = createRiftMaterial();

material.positionNode = glitchPositionNode;
material.colorNode = glitchColorNode;
// riftUniforms.uSize.value = new THREE.Vector3(props.size, props.size, props.size);

// material.positionNode = riftPositionNode;
// material.colorNode = riftColorNode;

const cube = new THREE.Mesh(geometry, material);
cube.layers.set(DOF_EXCLUDE_LAYER);

cube.position.copy(getRadialPosition(props.distance, props.horizontalAngle, props.verticalAngle));
cube.name = props.targetName;

mainGroup.add(cube);

onMounted(async () => {
    await ready;
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(environment, 0.04);
    const envMap = envRT.texture;

    const tintColor = color(Math.random() * 0xffffff);

    material.envNode = pmremTexture(envMap).mul(tintColor);
    unsubscribe = onFrame((time: number): void => {
        if (Math.random() > (1 - MenuCubeSettings.GLITCH_CHANCE_PERCENT * 0.01)) {
            glitchUniforms.glitchStrength.value = Math.max(Math.random(), 0.5) * props.size * MenuCubeSettings.GLITCH_MULTIPLIER;
            glitchUniforms.glitchSeed.value = Math.random() * 1000.0;
        } else {
            glitchUniforms.glitchStrength.value *= MenuCubeSettings.GLITCH_DECAY;
        }

        cube.rotation.x += rotationX;
        cube.rotation.y += rotationY;
        cube.rotation.z += rotationZ;
    });

    unregister = tour.registerTarget(props.targetName, () => {
        if (!cube.parent) return null;
        return cube.getWorldPosition(tmp).clone();
    });

});

onBeforeUnmount(() => {
    mainGroup.remove(cube);
    cube.dispose();
    unsubscribe?.();
    unregister?.();
    unregister = null;
});

</script>

<template>

</template>

<style scoped></style>