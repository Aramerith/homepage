import type { ObjectScaleAnim } from "@/three/objectScaleAnim";
import type { InjectionKey } from "vue"

export interface MenuObjectAnimParam {
    duration?: number,
    direction: string,
    onDone?: () => void
}

export interface MenuObjectAnim {
    getScaleAnimation(t: MenuObjectAnimParam): ObjectScaleAnim
}

export const menuObjectRegistryKey = Symbol('menu-cube-registry') as InjectionKey<Map<string, MenuObjectAnim>>;
