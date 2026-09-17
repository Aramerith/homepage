import { type PlacedPoint } from "./placement";

export default class SpatialHash {
    private cellSize: number;
    private cells = new Map<string, PlacedPoint[]>();

    constructor(cellSize: number) {
        this.cellSize = cellSize;
    } 

    private key(cx: number, cy: number, cz: number): string {
        return `${cx}|${cy}|${cz}`;
    }

    add(p: PlacedPoint): void {
        const cx = Math.floor(p.x / this.cellSize);
        const cy = Math.floor(p.y / this.cellSize);
        const cz = Math.floor(p.z / this.cellSize);
        const k = this.key(cx, cy, cz);

        let cell = this.cells.get(k);
        if (!cell) {
            cell = [];
            this.cells.set(k, cell);
        }
        cell.push(p);
    }

    /**
     * Returns true if (x, y, z) is within `radius` of any stored point.
     */
    collides(x: number, y: number, z: number, radius: number): boolean {
        const r2 = Math.pow(radius, 2);
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const cz = Math.floor(z / this.cellSize);

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const cell = this.cells.get(this.key(cx + dx, cy + dy, cz + dz));
                    if (!cell) continue;

                    for (const p of cell) {
                        const ddx = p.x - x;
                        const ddy = p.y - y;
                        const ddz = p.z - z;
                        if (Math.pow(ddx, 2) + Math.pow(ddy, 2) + Math.pow(ddz, 2) < r2) return true;
                    }
                }
            }
        }
        return false;
    }
}