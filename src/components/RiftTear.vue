<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import { createRiftAnimation, type RiftAnimOptions, type RiftAnim } from '@/three/riftAnim';
import { createRiftMaterial } from '@/three/riftEffect';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

const { scene, onFrame, camera } = useThree();

let unsubscribe: (() => void) | undefined;
let riftAnimation: RiftAnim | null = null;

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

scene.add(mesh);

let elapsed = 0;
let openingDirection = 0;

onMounted(() => {
    //RiftUniforms.uPower.value = 0.0;
    unsubscribe = onFrame((delta: number): void => {
        if (riftAnimation) {
            elapsed += delta;
            const finished = riftAnimation.tick(delta);
            if (finished) {
                console.log(mesh.rotation);
                riftAnimation = null;
            }
        }
    });
});

onBeforeUnmount(() => {
    unsubscribe?.();
    scene.remove(mesh);
    mesh.dispose();
});

// Animation handles

function openRift(opts: RiftAnimOptions): void {
    mesh.position.set(opts.position.x, opts.position.y, opts.position.z);
    elapsed = 0;
    RiftUniforms.uPower.value = 0;
    riftAnimation = createRiftAnimation(mesh, { ...opts, uniforms: RiftUniforms, duration: 1 });
    mesh.lookAt(camera.position);
    mesh.rotateZ(Math.random() * Math.PI);
}

function closeRift(): void {

}

defineExpose({ openRift, closeRift });

</script>

<template>
    <span/>
</template>

<style scoped></style>