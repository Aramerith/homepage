<script setup lang="ts"></script>

<template>
    <div class="popUpContainer hidden">
        <slot/>
    </div>
</template>

<style scoped>
    .popUpContainer {
        position: absolute;
        max-width: 90vw;
        max-height: 90vh;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: #000021dc;
        color: #EEE;
        padding: 20px;
        border-radius: 0 10px 0 10px;
        border: 1px solid #8800FF;
    }

    .hidden {
        display: none;
    }
</style>