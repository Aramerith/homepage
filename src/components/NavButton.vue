<script setup lang="ts">
import { TourPhase, TourTarget, useTour } from '@/composables/useTour';

const props = defineProps<{
    text: string,
    menuTarget: TourTarget
}>();
const tour = useTour();
</script>

<template>
    <button class="abs-pos" :disabled="!tour.hasTarget(props.menuTarget) || tour.phase.value === TourPhase.ANIMATING" @click="tour.request(props.menuTarget)">{{ text }}</button>
</template>

<style scoped>
    .abs-pos {
        margin: auto;
    }
</style>