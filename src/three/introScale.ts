import { CameraSettings } from '@/constants/objectParams';
import { easeInSine, easeOutExpo } from '@/utils/easings';
import * as THREE from 'three/webgpu';

const DURATION = 1.0;

export interface IntroOptions {
    duration?: number,
    delay: number,
    cameraSpeedMultiplier: number,
    onDone?: () => void
}

export interface IntroAnimData {
    finished: boolean,
    extraTheta: number
}

export interface IntroScaleAnim {
    tick(delta: number): IntroAnimData,
}

export function createIntroAnim(
    camera: THREE.Camera,
    group: THREE.Group,
    opts: IntroOptions
): IntroScaleAnim {
    const duration = opts.duration ?? DURATION;
    const delay = opts.delay;

    let elapsed = 0;
    let cancelled = false;
    let finished = false;
    let extraTheta = 0;

    return {
        tick(delta: number) {
            if (cancelled) {
                finished = true;
                return { finished, extraTheta };
            }
            elapsed += delta;
            if (elapsed > delay) {
                const raw = Math.min((elapsed - delay) / duration, 1);
                const scaleFactor = easeOutExpo(raw);

                group.scale.set(scaleFactor, scaleFactor, scaleFactor);

                const extraSpeed = (1 - easeInSine(raw)) * opts.cameraSpeedMultiplier;
                extraTheta += delta * (CameraSettings.ROTATION_SPEED + ( CameraSettings.ROTATION_SPEED * extraSpeed)) * Math.PI * 2;
                const x = CameraSettings.DISTANCE * Math.cos(extraTheta);
                const z = CameraSettings.DISTANCE * Math.sin(extraTheta);
                camera.lookAt(0, 0, 0);
                camera.position.set(x, CameraSettings.POSITION_Y, z);

                if (raw >= 1) {
                    opts.onDone?.();
                    finished = true;
                }
            }
            return { finished, extraTheta }
        }
    }
}