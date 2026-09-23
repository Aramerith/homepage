import { computed, inject, ref, type InjectionKey, type Ref } from "vue";

export const TourPhase = Object.freeze({
    IDLE: "idle",
    ANIMATING: "animating",
    DONE: "done"
} as const);

export type TourPhase = typeof TourPhase[keyof typeof TourPhase];

export const TourTarget = Object.freeze({
    ABOUT: "about"
} as const);

export type TourTarget = typeof TourTarget[keyof typeof TourTarget];

export interface TourState {
    requestedTarget: Ref<TourTarget | null>,
    phase: Ref<TourPhase>,
    request: (target: TourTarget) => void,
    animationFinished: () => void,
    reset: () => void
}

export const TourKey: InjectionKey<TourState> = Symbol("tour");

export function createTour(): TourState {
    const requestedTarget = ref<TourTarget | null>(null);
    const phase = ref<TourPhase>(TourPhase.IDLE);
    const isAnimating = computed(() => phase.value === TourPhase.ANIMATING);

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

    return { requestedTarget, phase, request, animationFinished, reset };
}

export function useTour(): TourState {
    const tour = inject(TourKey);
    if (!tour) throw new Error("useTour() called without providing TourKey");
    return tour
}