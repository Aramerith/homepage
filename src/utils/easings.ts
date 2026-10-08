export function easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInSine(t: number): number {
    return Math.sin(t * (Math.PI / 2));
}

export function easeImplode(t: number): number {
    const PEAK_T = 0.85;
    return t === 0 ? 0 :
        t < PEAK_T ? 1 + (0.4 * Math.sin(t / PEAK_T * Math.PI * 0.5))
        : 1.2 * Math.pow(1 - ((t - PEAK_T) / (1 - PEAK_T)), 2);
}

export function easeSlowRiseBounce(t: number): number {
    const P1_END = 0.6;
    const P2_END = 0.7;

    // Phase values
    const P1_VAL = 0.15;
    const P2_VAL = 0.2;
    const PEAK   = 1.10;

    if (t <= 0) return 0;
    if (t >= 1) return 1;

    if (t < P1_END) {
    const u = t / P1_END;
    return P1_VAL * Math.sqrt(u);
    }
    if (t < P2_END) {
    const u = (t - P1_END) / (P2_END - P1_END);
    return P1_VAL + (P2_VAL - P1_VAL) * u;
    }

    const u = (t - P2_END) / (1 - P2_END);
    const RISE = 0.25;

    if (u < RISE) {
    const k = Math.sqrt(u / RISE);
    return P2_VAL + (PEAK - P2_VAL) * k;
    }

    const v    = (u - RISE) / (1 - RISE);
    const damp = (1 - v) * (1 - v); 
    return 1 + (PEAK - 1) * damp * Math.cos(v * 3 * Math.PI);
}

export function easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4);
}

export function easeInCubic(x: number): number {
    return x * x * x;
}

export function easeInCirc(x: number): number {
    return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

export function easeOutCirc(x: number): number {
    return Math.sqrt(1 - Math.pow(x - 1, 2));
}