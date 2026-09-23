<script setup lang="ts">
import BaseScene from './components/BaseScene.vue';
import MenuCube from './components/MenuCube.vue';
import PointLight from './components/PointLight.vue';
import Sphere from './components/Sphere.vue';
import SurroundingObjects from './components/SurroundingObjects.vue';
</script>

<template>
  <BaseScene>
    <PointLight />
    <Sphere />
    <SurroundingObjects :count="2000" :min-distance="60" :max-distance="900" :gap="20" />
    <MenuCube :vertical-angle="15" :horizontal-angle="90" :distance="40" :size="5" />
    <MenuCube :vertical-angle="0" :horizontal-angle="270" :distance="40" :size="3" />
    <MenuCube :vertical-angle="25" :horizontal-angle="180" :distance="40" :size="5" />
    <MenuCube :vertical-angle="-5" :horizontal-angle="0" :distance="40" :size="4" />
  </BaseScene>
</template>
<style scoped></style>
