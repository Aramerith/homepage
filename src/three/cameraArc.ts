import * as THREE from 'three/webgpu';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const DURATION = 1.6;

export interface ArcOptions {
    zoomOutMultiplier?: number,
    endRadius?: number,
    onDone?: () => void,
    duration?: number
}

export interface CameraArc {
    tick(delta: number): boolean,
    cancel(): void
}

export function buildCameraArc(
    camera: THREE.Camera,
    targetPos: THREE.Vector3,
    opts: ArcOptions = {},
): THREE.QuadraticBezierCurve3 {
    const zoomOut = opts.zoomOutMultiplier ?? 1.4;
    
    const start = camera.position.clone();
    const startRadius = start.length(); 

    const startDir = start.clone().normalize();
    const endDir = targetPos.clone().normalize();
    const endRadius = opts.endRadius ?? startRadius;
    const end = endDir.clone().multiplyScalar(endRadius);

    const full = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
    const half = new THREE.Quaternion().slerp(full, 0.5);

    const midDir = startDir.clone().applyQuaternion(half);

    const midRadius = Math.max(startRadius, endRadius) * zoomOut;
    const mid = midDir.multiplyScalar(midRadius);

    const control = mid.clone().multiplyScalar(2).sub(start.clone().add(end).multiplyScalar(0.5));

    return new THREE.QuadraticBezierCurve3(start, control, end);
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createCameraArc(
    camera: THREE.Camera,
    targetPos: THREE.Vector3,
    opts: ArcOptions
): CameraArc {
    const curve = buildCameraArc(camera, targetPos, opts);
    const duration = opts.duration ?? DURATION;
    let elapsed = 0;
    let cancelled = false;

    return {
        tick(delta: number) {
            if (cancelled) return true;
            elapsed += delta;
            const raw = Math.min(elapsed / duration, 1);
            const t = easeInOutCubic(raw);
            curve.getPoint(t, camera.position);
            camera.lookAt(ORIGIN);

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