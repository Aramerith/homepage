import { computed, inject, reactive, ref, type InjectionKey, type Ref } from "vue";
import * as THREE from 'three/webgpu';

export const TourPhase = Object.freeze({
    IDLE: "idle",
    ANIMATING: "animating",
    DONE: "done"
} as const);

export type TourPhase = typeof TourPhase[keyof typeof TourPhase];

export const TourTarget = Object.freeze({
    ABOUT: "about",
    CONTACT: "contact",
    SHADERS: "shaders",
    SKILLS: "skills"
} as const);

export type TourTarget = typeof TourTarget[keyof typeof TourTarget];

export type TargetProvider = () => THREE.Vector3 | null

export interface TourState {
    requestedTarget: Ref<TourTarget | null>,
    phase: Ref<TourPhase>,
    hasTarget: (id: TourTarget) => boolean,
    registerTarget: (id: TourTarget, provider: TargetProvider) => () => void,
    getTargetPosition: (id: TourTarget) => THREE.Vector3 | null,
    request: (target: TourTarget) => void,
    animationFinished: () => void,
    reset: () => void
}

export const TourKey: InjectionKey<TourState> = Symbol("tour");

export function createTour(): TourState {
    const requestedTarget = ref<TourTarget | null>(null);
    const phase = ref<TourPhase>(TourPhase.IDLE);

    const targets = reactive(new Map<TourTarget, TargetProvider>());

    const isAnimating = computed(() => phase.value === TourPhase.ANIMATING);
    const shouldPause = computed(() => requestedTarget !== null);

    function registerTarget(id: TourTarget, provider: TargetProvider) {
        targets.set(id, provider);
        return () => {
            if (targets.get(id) === provider) targets.delete(id);
        }
    }

    function hasTarget(id: TourTarget) {
        return targets.has(id);
    }

    function getTargetPosition(id: TourTarget) {
        return targets.get(id)?.() ?? null
    }

    function request(target: TourTarget) {
        if (isAnimating.value) return;
        requestedTarget.value = target;
        phase.value = TourPhase.ANIMATING;
    }

    function animationFinished() {
        if (phase.value === TourPhase.ANIMATING) {
            phase.value = TourPhase.DONE;
        }
    }

    function reset() {
        requestedTarget.value = null;
        phase.value = TourPhase.IDLE;

    }

    return {
        requestedTarget, phase, hasTarget, registerTarget,
        getTargetPosition, request, animationFinished, reset
    };
}

export function useTour(): TourState {
    const tour = inject(TourKey);
    if (!tour) throw new Error("useTour() called without providing TourKey");
    return tour
}