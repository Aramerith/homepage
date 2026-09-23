<script setup lang="ts">
import { useThree } from '@/composables/useThree';
import { generatePlacements } from '@/three/placement';
import { cos, float, Fn, instanceIndex, normalGeometry, positionGeometry, sin, storage, time, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { onBeforeUnmount, onMounted } from 'vue';

const props = defineProps<{
    count: number,
    minDistance: number,
    maxDistance: number,
    gap: number
}>();
let unsubscribe: (() => void) | undefined;

const { scene } = useThree();

let objects: THREE.InstancedMesh | undefined;
const axisSpeedData = new Float32Array(props.count * 4);
const phaseData = new Float32Array(props.count);
const colorData = new Float32Array(props.count * 3);

onMounted((): void => {
    const geometry = new THREE.TorusGeometry(6, 1, 32, 3);

    objects = new THREE.InstancedMesh(geometry, undefined, props.count);
    objects.frustumCulled = false;

    const dummy = new THREE.Object3D();

    const placements = generatePlacements({
        count: props.count,
        rInner: props.minDistance,
        rOuter: props.maxDistance,
        minDistance: props.gap
    });

    for (let i = 0; i < placements.length; i++) {
        const p = placements[i]!;
        // random rotation axis
        const ax = Math.random() * 2 - 1;
        const ay = Math.random() * 2 - 1;
        const az = Math.random() * 2 - 1;
        const len = Math.hypot(ax, ay, az) || 1;

        // random color within a given range
        colorData[i * 3 + 0] = Math.random();
        colorData[i * 3 + 1] = Math.random();
        colorData[i * 3 + 2] = Math.random();

        axisSpeedData[i * 4 + 0] = ax / len;
        axisSpeedData[i * 4 + 1] = ay / len;
        axisSpeedData[i * 4 + 2] = az / len;
        axisSpeedData[i * 4 + 3] = 0.2 + Math.random() * 2.0;
        phaseData[i] = Math.random() * Math.PI * 2;

        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        objects.setMatrixAt(i, dummy.matrix);
    }

    const axisSpeedAttr = new THREE.StorageInstancedBufferAttribute(axisSpeedData, 4);
    const phaseAttr = new THREE.StorageInstancedBufferAttribute(phaseData, 1);
    const colorAttr = new THREE.StorageInstancedBufferAttribute(colorData, 3);

    const axisSpeeStorage = storage(axisSpeedAttr, 'vec4', props.count);
    const phaseStorage = storage(phaseAttr, 'float', props.count);
    const colorStorage = storage(colorAttr, 'vec3', props.count);

    const material = setupMaterialData(axisSpeeStorage, phaseStorage, colorStorage);
    objects.material = material;

    objects.matrixWorldNeedsUpdate = true;
    scene.add(objects);
});

onBeforeUnmount((): void => {
    scene.remove(objects!);
    objects?.dispose();
    unsubscribe?.();
});

function setupMaterialData(axisSpeedStorage: THREE.StorageBufferNode<"vec4">,
    phaseStorage: THREE.StorageBufferNode<"float">,
    colorStorage: THREE.StorageBufferNode<"vec3">): THREE.MeshStandardNodeMaterial {
    const instanceMatrixNode = storage(
        new THREE.StorageInstancedBufferAttribute(
            objects!.instanceMatrix.array,
            16
        ),
        "mat4",
        objects!.count
    )

    const rotateAroundAxis = Fn(([v, axis, angle]: [THREE.Node<"vec3">, THREE.Node<"vec3">, THREE.Node<"float">]): THREE.Node<"vec3"> => {
        const c = cos(angle);
        const s = sin(angle);
        const oneMinusC = float(1).sub(c);

        return v.mul(c).add(axis.cross(v).mul(s)).add(axis.mul(axis.dot(v)).mul(oneMinusC));
    });

    const axisSpeed = axisSpeedStorage.element(instanceIndex).toVar();
    const axis = axisSpeed.xyz;
    const speed = axisSpeed.w;
    const phase = phaseStorage.element(instanceIndex);

    const angle = phase.add(speed.mul(time));

    const instanceMat = instanceMatrixNode.element(instanceIndex).toMat4().toVar();
    const instancePos = instanceMat.mul(vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    const material = new THREE.MeshStandardNodeMaterial({
        roughness: 0,
        metalness: 0
    });

    material.positionNode = rotateAroundAxis(positionGeometry, axis, angle).add(instancePos);
    material.normalNode = rotateAroundAxis(normalGeometry, axis, angle);
    material.colorNode = colorStorage.element(instanceIndex);

    return material;
}

</script>

<template>
    <span />
</template>

<style scoped></style>