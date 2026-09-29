<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import { createRiftMaterial } from '@/three/riftEffect';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

const { scene, onFrame } = useThree();

let unsubscribe: (() => void) | undefined;

const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
const material = new THREE.MeshStandardNodeMaterial({
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
    depthTest: false,
    premultipliedAlpha: true
});

const { uniforms: RiftUniforms, fragmentNode } = createRiftMaterial();

material.fragmentNode = fragmentNode;

const mesh = new THREE.Mesh(geometry, material);
mesh.frustumCulled = false;

mesh.position.set(0, 10, 20);
mesh.rotateZ(2.3);

scene.add(mesh);

onMounted(() => {
    unsubscribe = onFrame((delta: number): void => {

    });
});

onBeforeUnmount(() => {
    unsubscribe?.();
    scene.remove(mesh);
    mesh.dispose();
});

</script>

<template>
    <span/>
</template>

<style scoped></style>