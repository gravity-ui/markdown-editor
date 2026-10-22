import {useRef} from 'react';

import {useViewerEffect} from '@gravity-ui/markdown-viewer';

export function PreserveCutState() {
    const savedState = useRef(new Map<string, boolean>());

    useViewerEffect(({root}) => {
        const states = savedState.current;
        const cuts = Array.from(
            root.querySelectorAll<HTMLDetailsElement>('details.yfm-cut'),
            (cut) => ({
                cut,
                id: cut.querySelector(':scope > summary[id]')?.id,
            }),
        );

        for (const {cut, id} of cuts) {
            if (!id) continue;
            const open = states.get(id);
            if (open !== undefined) cut.open = open;
        }

        return () => {
            for (const {cut, id} of cuts) {
                if (id) states.set(id, cut.open);
            }
        };
    }, []);

    return null;
}
