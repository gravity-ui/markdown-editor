import {type RefObject, createContext, useContext} from 'react';

import {type Options, useHotkeys} from 'react-hotkeys-hook';

export const GptHotkeysContext = createContext<RefObject<HTMLDivElement> | null>(null);

export function useGptHotKeys(
    key: string,
    callback: () => void,
    options: Options = {},
    dependencies?: unknown[],
) {
    const container = useContext(GptHotkeysContext);
    useHotkeys(
        key,
        callback,
        {
            preventDefault: true,
            enableOnFormTags: Boolean(container),
            ...options,
            ignoreEventWhen: (event) => {
                if (container && !container.current?.contains(document.activeElement)) return true;
                if (
                    container &&
                    key === 'Enter' &&
                    event.target instanceof Element &&
                    event.target.closest('button, a, input, textarea, [contenteditable="true"]')
                )
                    return true;
                return options.ignoreEventWhen?.(event) ?? false;
            },
        },
        dependencies,
    );
}
