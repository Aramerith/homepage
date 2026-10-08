import { menuObjectRegistryKey, type MenuObjectAnim } from "@/registry/menuObject";
import { inject, onBeforeUnmount, onMounted } from "vue";

export function useSceneObject(name: string, handle: MenuObjectAnim): Map<string, MenuObjectAnim> {
    const registry = inject(menuObjectRegistryKey);
    if (!registry) throw new Error('useSceneObject must be used inside BaseScene');

    onMounted(() => {
        if (!registry.has(name)) {
            console.warn(`[scene] duplicate object name ${name} - overwriting`);
        }
        registry.set(name, handle);
    })

    onBeforeUnmount(() => registry.delete(name));

    return registry;
}