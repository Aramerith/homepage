import { inject, provide, ref, type InjectionKey, type Ref } from "vue";

export interface LoadError {
    label: string,
    error: unknown
}

export interface LoadTask {
    readonly label: string,
    resolve(): void,
    reject(error: unknown): void
}

export interface SceneLoadApi {
    readonly pending: Ref<number>,
    readonly errors: Ref<LoadError[]>
    register(label?: string): LoadTask,
    whenIdle(): Promise<void>
}

export const SCENE_LOAD: InjectionKey<SceneLoadApi> = Symbol('scene-load');

export function provideSceneLoad(): SceneLoadApi {
    const pending = ref(0);
    const errors = ref<LoadError[]>([]);
    let waiters: Array<() => void> = [];

    const flushIfIdle = (): void => {
        if (pending.value !== 0) return;
        const w = waiters;
        waiters = [];
        for (const fn of w) fn();
    };

    function register(label: string = "anonymous"): LoadTask {
        pending.value++;
        let done = false;
        const finish = (): void => {
            if (done) return;
            done = true;
            pending.value--;
            flushIfIdle();
        };
        return {
            label,
            resolve: finish,
            reject(error: unknown) {
                errors.value.push({ label, error });
                finish();
            }
        }
    };

    const whenIdle = (): Promise<void> => {
        if (pending.value === 0) return Promise.resolve();
        return new Promise<void>(res => waiters.push(res));
    };

    const api: SceneLoadApi = { pending, errors, register, whenIdle };
    provide(SCENE_LOAD, api);
    return api;
}

export function useSceneLoad(): SceneLoadApi {
    const api = inject(SCENE_LOAD);
    if (!api) throw new Error('useSceneLoad() requires <BaseScene> as an ancestor')
    return api
}