import { easeImplode } from '@/utils/easings';
import * as THREE from 'three/webgpu';

const DURATION = 1.0;

export interface ObjectScaleAnimOptions {
    duration?: number,
    onDone?: () => void
}

export interface ObjectScaleAnim {
    tick(delta: number): boolean
}

export function createObjectScaleAnim(object: THREE.Mesh, opts: ObjectScaleAnimOptions): ObjectScaleAnim {
    const duration = opts.duration ?? DURATION;

    let donePlayed = false;
    let elapsed = 0;

    return {
        tick(delta: number) {
            elapsed += delta;
            const raw = Math.min(elapsed / duration, 1);
            const scaleFactor = easeImplode(raw);

            object.scale.set(scaleFactor, scaleFactor, scaleFactor);

            if (raw >= 0.8 && !donePlayed) {
                opts.onDone?.();
                donePlayed = true;
            }

            if (raw >= 1) {
                return true;
            }
            return false;
        }
    }
}