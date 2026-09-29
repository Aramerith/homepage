import { cameraWorldMatrix, floor, Fn, hash, materialColor, mix, modelViewMatrix, modelWorldMatrixInverse, positionLocal, screenUV, sin, step, time, uniform, varying, vec2, vec3, vec4 } from "three/tsl";
import * as THREE from 'three/webgpu';

export interface GlitchUniforms {
    vGlitchState: THREE.VaryingNode<"vec2">,
    glitchStrength: THREE.UniformNode<"float", number>,
    bandCount: THREE.UniformNode<"float", number>,
    glitchSpeed: THREE.UniformNode<"float", number>,
    glitchSeed: THREE.UniformNode<"float", number>,
    jitterAmount: THREE.UniformNode<"float", number>
}

export interface GlitchMaterial {
    uniforms: GlitchUniforms,
    positionNode: THREE.Node<"vec3">,
    colorNode: THREE.VarNode<"vec4", THREE.JoinNode<"vec4">>
}

export function createGlitchMaterial(): GlitchMaterial {
    const vGlitchState = varying(vec2(0.0, 0.0));
    const glitchStrength = uniform(0.0);
    const bandCount = uniform(3);
    const glitchSpeed = uniform(5000.0);
    const glitchSeed = uniform(0.0);
    const jitterAmount = uniform(0);

    const uniforms: GlitchUniforms = { vGlitchState, glitchStrength, bandCount, glitchSpeed, glitchSeed, jitterAmount };

    const invModelView = modelWorldMatrixInverse.mul(cameraWorldMatrix);

    const positionNode = Fn(() => {
        const posView = modelViewMatrix.mul(vec4(positionLocal, 1.0)).xyz;

        const stepTime = floor(time.mul(10.0));

        const bandRaw = floor(posView.y.mul(bandCount).add(time.mul(glitchSpeed)));
        const bandId = bandRaw.add(glitchSeed).add(stepTime.mul(37.0));

        const h1 = hash(vec2(bandId, 0.0));
        const h2 = hash(vec2(bandId, 1.0));

        const isGlitched = step(h1.oneMinus(), glitchStrength);
        const direction = h2.sub(0.5).mul(2.0);

        const vId = positionLocal.mul(137.0);
        const jY = hash(vec2(vId.x, vId.y)).sub(0.5);
        const jZ = hash(vec2(vId.y, vId.z)).sub(0.5);

        const g = isGlitched.mul(glitchStrength);
        const shiftX = direction.mul(g).mul(0.4);
        const shiftY = jY.mul(g).mul(jitterAmount);
        const shiftZ = jZ.mul(g).mul(jitterAmount);

        vGlitchState.assign(vec2(isGlitched, direction));

        const glitchedView = posView.add(vec3(shiftX, shiftY, shiftZ));
        return invModelView.mul(vec4(glitchedView, 1.0)).xyz;
    })();

    const colorNode = Fn(() => {
        const posView = modelViewMatrix.mul(vec4(positionLocal, 1.0)).xyz;

        const isGlitched = vGlitchState.x;
        const direction = vGlitchState.y;
        const dirSign = step(0.0, direction).mul(2.0).sub(1.0);

        const stepTime = floor(time.mul(10.0));

        const bandRaw = floor(posView.y.mul(bandCount).add(time.mul(glitchSpeed)));
        const bandId = bandRaw.add(glitchSeed).add(stepTime.mul(37.0));

        const bandShift = hash(vec2(bandId, 3.0)).sub(0.5).mul(0.3);

        const ab = isGlitched.mul(glitchStrength).mul(0.04).mul(dirSign);

        const x = screenUV.x.add(bandShift);
        const y = screenUV.y;

        const sample = (dx: THREE.Node<"float"> | number): any => {
            return sin(x.add(dx).mul(50.0).add(y.mul(20.0))).mul(0.5).add(0.5);
        };
        const r = sample(ab);
        const g = sample(0.0);
        const b = sample(ab.negate());

        const glitchColor = vec3(r, g, b);

        const baseColor = materialColor;

        return vec4(mix(baseColor, glitchColor, isGlitched.mul(glitchStrength)), 1.0);
    })();

    return { uniforms, positionNode, colorNode };
}
