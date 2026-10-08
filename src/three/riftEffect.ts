import { float, Fn, mix, mx_fractal_noise_float, smoothstep, time, uniform, uv, vec2, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export interface RiftUniforms {
    uPower: THREE.UniformNode<"float", number>
    uAspect: THREE.UniformNode<"float", number>,
    uNoiseAmp: THREE.UniformNode<"float", number>,
    uNoiseScale: THREE.UniformNode<"float", number>,
    uGlowWidth: THREE.UniformNode<"float", number>,
    uRaySpeed: THREE.UniformNode<"float", number>
}

export interface RiftMaterial {
    uniforms: RiftUniforms,
    fragmentNode: THREE.VarNode<"vec4", THREE.JoinNode<"vec4">>
}

export function createRiftMaterial(): RiftMaterial {
    const uAspect = uniform(1.0);
    const uPower = uniform(0.0);
    const uEdgeSharp = uniform(30.0);
    const uIntensity = uniform(1);
    const uHalfX = uniform(0.35);
    const uHalfY = uniform(0.2);
    const uNoiseAmp = uniform(0.035);
    const uNoiseScale = uniform(25.0);

    const uGlowWidth = uniform(0.04);
    const uEdgeElectric = uniform(2);
    const uEdgeSharp2 = uniform(300.0);
    const uEdgeScale = uniform(8.0);
    const uEdgeSpeed = uniform(0.02);
    const uColorStart = uniform(0);
    const uColorEnd = uniform(0.5);

    const uRayStrength = uniform(1.75);
    const uRayDensity  = uniform(2.5);
    const uRaySharp    = uniform(4.0);
    const uRaySpeed = uniform(0.1);
    const uRayDisplace = uniform(0.005);
    const uRayEdgeDim  = uniform(0.15);

    const uniforms: RiftUniforms = { uPower, uAspect, uNoiseAmp, uNoiseScale, uGlowWidth, uRaySpeed };

    const fragmentNode = Fn(() => {
        // Shape
        const uvN = uv();
        const p = vec2(uvN.x.sub(0.5).mul(uAspect), uvN.y.sub(0.5));

        const ax = p.x.abs().div(uHalfX);
        const ay = p.y.abs().div(uHalfY);
        const d = ax.pow(uPower).add(ay.pow(uPower)).sub(1.0);

        const FLOOR = float(0.3);
        const axS = ax.max(FLOOR);
        const ayS = ay.max(FLOOR);
        const p1 = uPower.sub(1.0);
        const gx = uPower.mul(axS.pow(p1)).div(uHalfX);
        const gy = uPower.mul(ayS.pow(p1)).div(uHalfY);
        const gmag = gx.mul(gx).add(gy.mul(gy)).sqrt().max(float(0.0001));

        const dnBase = d.div(gmag);

        const nShape = mx_fractal_noise_float(
            vec3(p.mul(uNoiseScale), time.mul(0.5)),
            3, 2.0, 0.5
        );
        const edgeBand = dnBase.abs().mul(-25.0).exp();
        const dn = dnBase.add(nShape.mul(uNoiseAmp).mul(edgeBand));

        // Glow

        const nA = mx_fractal_noise_float(
            vec3(p.mul(uEdgeScale), time.mul(uEdgeSpeed)),
            3, 3.2, 0.6
        );
        const ridgeA = nA.abs().mul(-1.0).add(1.0);

        const nB = mx_fractal_noise_float(
            vec3(p.mul(uEdgeScale.mul(2.4)).add(41.3),
                time.mul(uEdgeSpeed.mul(2.1))),
            3, 3.0, 0.55
        );
        const ridgeB = nB.abs().mul(-1.0).add(1.0);

        const spikeA = ridgeA.pow(uEdgeSharp2);
        const spikeB = ridgeB.pow(uEdgeSharp2.mul(0.8)).mul(0.5);
        const spikes = spikeA.add(spikeB).clamp(float(0.0), float(1.5));

        const wElectric = uGlowWidth
            .mul(spikes.mul(uEdgeElectric).add(1.0))
            .max(float(0.005));
        
        // Glow radial beams

        const ang = p.y.atan(p.x);
        const ca = ang.cos();
        const sa = ang.sin();

        const nRayA = mx_fractal_noise_float(
            vec3(ca.mul(uRayDensity),
                 sa.mul(uRayDensity),
                 time.mul(uRaySpeed)),
            3, 2.0, 0.5
        );
        const nRayB = mx_fractal_noise_float(
            vec3(ca.mul(uRayDensity.mul(2.3)).add(13.7),
                 sa.mul(uRayDensity.mul(2.3)).add(9.1),
                 time.mul(uRaySpeed.mul(1.6))),
            3, 2.0, 0.5
        );

        const ridge = nRayA.abs().add(nRayB.abs().mul(0.6)).mul(-1.0).add(1.0);
        const rays = ridge.pow(uRaySharp).clamp(float(0.0), float(1.0));

        const dnRay = dn.add(rays.mul(uRayDisplace));
        const dnPos = dnRay.max(float(0));

        const rayMul = rays.mul(uRayStrength).add(float(1.0));
        const wEff = wElectric.mul(rayMul);
        
        const outerGlow = dnPos.div(wEff).mul(-1.0).exp();
        const glowCutoff = float(1.0).sub(
            smoothstep(wEff.mul(0.5), wEff.mul(2.0), dnPos)
        );
        const edgeLineRaw = dnRay.abs().mul(uEdgeSharp).mul(-1.0).exp();
        const edgeGate = rays.mul(uRayEdgeDim).add(float(1.0).sub(uRayEdgeDim));
        const edgeLine = edgeLineRaw.mul(edgeGate);
        const outside  = smoothstep(float(-0.003), float(0.0), dn);

        const profileScalar = outerGlow.mul(glowCutoff).mul(0.75)
                                        .add(edgeLine)
                                        .mul(outside);

        const mixAmt = smoothstep(
            wEff.mul(uColorStart),
            wEff.mul(uColorEnd),
            dnPos
        );

        const glowColor = vec3(0.3, 0, 1);

        const finalColor = mix(vec3(1.0), glowColor, mixAmt);

        const insideMask = float(1.0).sub(outside);

        const rgb = finalColor.mul(profileScalar).mul(uIntensity);

        const alpha = insideMask.add(profileScalar.mul(uIntensity)).clamp(float(0.0), float(1.0));

        return vec4(rgb, alpha);
    })();

    return { uniforms, fragmentNode };
}