<script setup lang="ts">
import BaseScene from './components/BaseScene.vue';
import PointLight from './components/PointLight.vue';
import Sphere from './components/Sphere.vue';
import SurroundingObjects from './components/SurroundingObjects.vue';
</script>

<template>
  <BaseScene>
    <PointLight />
    <Sphere />
    <SurroundingObjects :count="1000" />
  </BaseScene>
</template>
<style scoped></style>
