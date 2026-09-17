import * as THREE from 'three/webgpu';
import { inject, provide, type InjectionKey } from 'vue';

export type FrameCallback = (delta: number, elapsed: number) => void;

export interface ThreeContext {
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGPURenderer,
    onFrame: (cb: FrameCallback) => () => void,
    ready: Promise<void>
}

const ThreeKey: InjectionKey<ThreeContext> = Symbol('three');

export function provideThree(ctx: ThreeContext): void {
    provide(ThreeKey, ctx);
}

export function useThree(): ThreeContext {
    const ctx = inject(ThreeKey);
    if (!ctx) throw new Error("useThree() called outside of a <ThreeProvider>")
    return ctx;
}