import type {SerializerState} from '#core';

/** Write every line through the serializer to preserve list and quote prefixes. */
export function writeDirectiveLines(state: SerializerState, content: string) {
    for (const line of content.split('\n')) state.write(`${line}\n`);
}
