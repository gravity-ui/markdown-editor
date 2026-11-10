import {Plugin} from 'prosemirror-state';

export type TabExitOnEscapeController = ReturnType<typeof createTabExitOnEscapePlugin>;

export function createTabExitOnEscapePlugin() {
    let allowTabExit = false;
    const resetTabExit = () => {
        allowTabExit = false;
        return false;
    };

    const plugin = new Plugin({
        props: {
            handleDOMEvents: {
                keydown(view, event) {
                    if (!allowTabExit || event.target !== view.dom) return false;

                    if (event.key === 'Tab') {
                        return true;
                    }

                    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
                        return false;
                    }

                    return resetTabExit();
                },
                blur: resetTabExit,
                mousedown: resetTabExit,
                beforeinput: resetTabExit,
                paste: resetTabExit,
                cut: resetTabExit,
                drop: resetTabExit,
                compositionstart: resetTabExit,
                pointerdown: resetTabExit,
                input: resetTabExit,
            },
        },
    });

    return {
        plugin,
        setAllowed(allowed: boolean) {
            allowTabExit = allowed;
        },
    };
}
