import * as THREE from 'three/webgpu';

export default function getRadialPosition(distance: number, horizontalAngle: number, verticalAngle: number = 0): THREE.Vector3 {
    const elevation = THREE.MathUtils.degToRad(verticalAngle);
    const azimuth   = THREE.MathUtils.degToRad(horizontalAngle);
    const cosEl = Math.cos(elevation);

    const x = distance * cosEl * Math.cos(azimuth);
    const y = distance * Math.sin(elevation);
    const z = distance * cosEl * Math.sin(azimuth);
    return new THREE.Vector3(x, y, z);
}