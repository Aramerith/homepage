<script setup lang="ts"></script>

<template>
    <Transition name="fade">
        <div class="loading">
            <div class="fade-in">
                <span class="loading-text">Loading...</span>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.loading {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #000010;
    display: grid;
    align-items: center;
    justify-items: center;
    z-index: 10;
}

.fade-in {
    opacity: 1;
    animation: opacity-fade-in 0.5s ease-in 1;
}

@keyframes opacity-fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.loading-text {
    background: linear-gradient(135deg, #eee 0%, #eee 40%, #cb007c 50%, #eee 60%, #eee 100%);
    background-size: 300% 300%;
    font-size: 32pt;
    font-family:'Courier New', Courier, monospace;
    background-clip: text;
    color: transparent;
    animation: font-loading 3s linear 1s infinite;
    filter: drop-shadow(3px 3px 5px #0044ff);
    text-transform: uppercase;
}

@keyframes font-loading {
    0% {
        background-position: 100% 0%;
    }
    10% {
        background-position: 100% 0%;
    }
    90% {
        background-position: 0% 0%;
    }
    100% {
        background-position: 0% 0%;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
