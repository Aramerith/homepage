import * as THREE from 'three/webgpu';
import type { RiftUniforms } from './riftEffect';
import { easeInCubic, easeOutCirc, easeSlowRiseBounce } from '@/utils/easings';

const DURATION = 1.0;

export interface Vec3 {x: number, y: number, z: number};

export interface RiftAnimOptions {
    position: Vec3,
    duration?: number,
    uniforms?: RiftUniforms,
    onDone?: () => void
}

export interface RiftAnim {
    tick(delta: number): boolean
}

export function createRiftAnimation(rift: THREE.Mesh, opts: RiftAnimOptions): RiftAnim {
    const duration = opts.duration ?? DURATION;
    
    let elapsed = 0;

    return {
        tick(delta: number) {
            elapsed += delta;
            const raw = Math.min(elapsed / duration, 1);
            
            if (opts.uniforms) {
                opts.uniforms.uPower.value = easeSlowRiseBounce(raw) * 0.85;
                opts.uniforms.uGlowWidth.value = 0.1 - easeInCubic(raw) * 0.06;
                opts.uniforms.uRaySpeed.value = 0.2 - easeOutCirc(raw) * 0.1;
            }

            if (raw >= 1) {
                opts.onDone?.();
                return true;
            }
            return false;
        }
    }
}