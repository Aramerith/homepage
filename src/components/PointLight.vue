<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import * as THREE from 'three/webgpu'
import { onBeforeUnmount, onMounted } from 'vue';

const { scene } = useThree();

const light = new THREE.PointLight(0x8800ff, 100000, 1000000);
light.position.set(0, 0, 0);
light.castShadow = false;

onMounted((): void => {
    scene.add(light);
});

onBeforeUnmount((): void => {
    scene.remove(light);
    light.dispose();
});

</script>

<template>
    <span />
</template>

<style scoped></style>