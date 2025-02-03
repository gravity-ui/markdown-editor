/**
 * Builds a mapping between "simple" keys and comma-separated "complex" keys, allowing you
 * to trigger all processors defined for the complex keys that include a particular simple key.
 *
 * Example:
 * ```ts
 * const config = {
 *   'paragraph,heading': { data: 'p+h' },
 *   'paragraph,listItem': { data: 'p+li' },
 *   paragraph: { data: 'p' },
 *   heading: { data: 'h' },
 *   listItem: { data: 'li' },
 * };
 *
 * const { processorsMap, keyMapping } = buildKeyMapping(config);
 *
 * // processorsMap:
 * //   "paragraph,heading"   -> { data: 'p+h' }
 * //   "paragraph,listItem"  -> { data: 'p+li' }
 * //   "paragraph"           -> { data: 'p' }
 * //   "heading"             -> { data: 'h' }
 * //   "listItem"            -> { data: 'li' }
 *
 * // keyMapping:
 * //   "paragraph" -> ["paragraph,heading", "paragraph,listItem", "paragraph"]
 * //   "heading"   -> ["paragraph,heading", "heading"]
 * //   "listItem"  -> ["paragraph,listItem", "listItem"]
 *
 * // When handling a "paragraph" node, the processors from the following keys will be triggered:
 * //   processorsMap.get("paragraph,heading")
 * //   processorsMap.get("paragraph,listItem")
 * //   processorsMap.get("paragraph")
 * ```
 */
export function buildKeyMapping<T>(
    config: Record<string, T>,
    delimiter = ',',
): {
    processorsMap: Map<string, T>;
    keyMapping: Map<string, string[]>;
} {
    const processorsMap = new Map<string, T>();
    const keyMapping = new Map<string, string[]>();

    Object.entries(config).forEach(([rawKey, processor]) => {
        const splittedKeys = rawKey.split(delimiter).map((k) => k.trim());
        const joinedKey = splittedKeys.join(delimiter);

        processorsMap.set(joinedKey, processor);

        const splittedKeysNoDup = Array.from(new Set(splittedKeys));

        splittedKeysNoDup.forEach((simpleKey) => {
            if (!keyMapping.has(simpleKey)) {
                keyMapping.set(simpleKey, []);
            }
            keyMapping.get(simpleKey)!.push(joinedKey);
        });
    });

    return {processorsMap, keyMapping};
}
