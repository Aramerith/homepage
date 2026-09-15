<script setup lang="ts">
import * as THREE from 'three';
import { onMounted } from 'vue';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({ antialias: true });

scene.background = new THREE.Color(0x000010);
renderer.setSize(window.innerWidth, window.innerHeight);

onMounted(() => { 
    const container = document.getElementById("sphereContainer");
    container?.appendChild(renderer.domElement);
});

function animate(): void {
    renderer.render(scene, camera);

}

renderer.setAnimationLoop(animate);

</script>
<template>
    <div id="sphereContainer"></div>
</template>

<style scoped></style>