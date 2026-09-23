import * as THREE from 'three/webgpu';

const DURATION = 1.6;

export interface ArcOptions {
    zoomOutMultiplier?: number,
    endLookAt?: THREE.Vector3,
    onDone?: () => void,
    duration?: number
}

export interface CameraArc {
    tick(delta: number): boolean,
    cancel(): void
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createCameraArc(
    camera: THREE.Camera,
    targetPos: THREE.Vector3,
    opts: ArcOptions
): CameraArc {
    const zoomOut = opts.zoomOutMultiplier ?? 1.4;
    const duration = opts.duration ?? DURATION;
    const endLookAt = opts.endLookAt ?? new THREE.Vector3(0, targetPos.y, 0);

    let startRadius = 0;
    let startTheta = 0;
    let startY = 0;

    let endRadius = 0;
    let endTheta = 0;
    let endY = 0;

    let ctrlR = 0;
    let dTheta = 0;

    let initialized = false;

    const startQuat = new THREE.Quaternion();
    const endQuat = new THREE.Quaternion();
    const endEye = new THREE.Vector3();
    const lookMat = new THREE.Matrix4();

    let elapsed = 0;
    let cancelled = false;

    function init() {
        const p = camera.position;
        startRadius = Math.hypot(p.x, p.z);
        startTheta = Math.atan2(p.z, p.x);
        startY = p.y;

        endRadius = startRadius;
        endTheta = Math.atan2(targetPos.z, targetPos.x);
        endY = targetPos.y;

        dTheta = endTheta - startTheta;
        if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
        if (dTheta < -Math.PI) dTheta += 2 * Math.PI;

        const peakR = Math.max(startRadius, endRadius) * zoomOut;
        ctrlR = 2 * peakR - (startRadius + endRadius) / 2;

        startQuat.copy(camera.quaternion);

        endEye.set(
            endRadius * Math.cos(endTheta),
            endY,
            endRadius * Math.sin(endTheta)
        );

        lookMat.lookAt(endEye, endLookAt, camera.up);
        endQuat.setFromRotationMatrix(lookMat);

        initialized = true;
    }

    return {
        tick(delta: number) {
            if (cancelled) return true;
            if (!initialized) init();
            elapsed += delta;
            const raw = Math.min(elapsed / duration, 1);
            const t = easeInOutCubic(raw);
            const it = 1 - t;
            
            const r = Math.pow(it, 2) * startRadius + 2 * it * t * ctrlR + Math.pow(t, 2) * endRadius;
            const theta = startTheta + dTheta * t;
            const y = startY + (endY - startY) * t;

            camera.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
            camera.quaternion.slerpQuaternions(startQuat, endQuat, t);

            if (raw >= 1) {
                opts.onDone?.();
                return true;
            }
            return false;
        },
        cancel() {
            cancelled = true;
        }
    }
}