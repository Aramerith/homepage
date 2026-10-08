<script setup lang="ts">
import { provide } from 'vue';
import BaseScene from './components/BaseScene.vue';
import MenuCube from './components/MenuCube.vue';
import PointLight from './components/PointLight.vue';
import Sphere from './components/Sphere.vue';
import SurroundingObjects from './components/SurroundingObjects.vue';
import { createTour, TourKey, TourTarget } from './composables/useTour.ts';
import NavButton from './components/NavButton.vue';
import Navbar from './components/Navbar.vue';
import PopUpContainer from './components/PopUpContainer.vue';
import { ref } from 'vue';
import { type LoadError } from './composables/useSceneLoad.ts';
import Loader from './components/Loader.vue';
import { SurroundingObjectShape } from './constants/objectParams.ts';

provide(TourKey, createTour());

const loading = ref(true);
const errors = ref<LoadError[]>([]);

function onReady(): void {
  loading.value = false;
};

function onError(e: LoadError[]): void {
  errors.value = e;
  loading.value = false;
}

</script>

<template>
  <BaseScene @ready="onReady" @error="onError">
    <PointLight />
    <Sphere />
    <SurroundingObjects :count="1000" :min-distance="60" :max-distance="900" :gap="20"
      :shape="SurroundingObjectShape.TORUS" :radius="6" />
    <SurroundingObjects :count="500" :min-distance="250" :max-distance="900" :gap="50"
      :shape="SurroundingObjectShape.SPHERE" :radius="5" />
    <MenuCube :vertical-angle="15" :horizontal-angle="90" :distance="40" :size="5" :target-name="TourTarget.ABOUT" />
    <MenuCube :vertical-angle="0" :horizontal-angle="270" :distance="40" :size="3" :target-name="TourTarget.CONTACT" />
    <MenuCube :vertical-angle="25" :horizontal-angle="180" :distance="40" :size="5" :target-name="TourTarget.SHADERS" />
    <MenuCube :vertical-angle="-5" :horizontal-angle="0" :distance="40" :size="4" :target-name="TourTarget.SKILLS" />
    <Loader v-show="loading" />
  </BaseScene>
  <Navbar>
    <NavButton :menu-target="TourTarget.ABOUT" text="About" />
    <NavButton :menu-target="TourTarget.SKILLS" text="Skills" />
    <NavButton :menu-target="TourTarget.SHADERS" text="Shader playground" />
    <NavButton :menu-target="TourTarget.CONTACT" text="Contact" />
  </Navbar>
  <PopUpContainer>
    <span>Want to have something to do? What about someone to do?</span>
  </PopUpContainer>
</template>
<style scoped></style>
