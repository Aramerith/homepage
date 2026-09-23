<script setup lang="ts"></script>

<template>
    <nav class="navbar">
        <slot/>
    </nav>
</template>

<style scoped>
    .navbar {
        position: absolute;
        display: flex;
        top: 10px;
        width: 90vw;
        left: 50%;
        transform: translateX(-50%);
    }
</style>