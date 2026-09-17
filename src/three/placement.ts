import SpatialHash from "./spatialHash";

export interface PlacedPoint { x: number, y: number, z: number };

export interface PlacementOptions {
    count: number;
    rInner: number;
    rOuter: number;
    minDistance: number;
    maxAttempts?: number;
}

export function generatePlacements(opts: PlacementOptions): PlacedPoint[] {
    const { count, rInner, rOuter, minDistance, maxAttempts = 30 } = opts;
    const hash = new SpatialHash(minDistance);
    const out: PlacedPoint[] = [];
    
    for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = rInner + Math.random() * (rOuter - rInner);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);

            if (!hash.collides(x, y, z, minDistance)) {
                const p = { x, y, z };
                hash.add(p);
                out.push(p);
                break;
            }
        }
    }
    return out;
}