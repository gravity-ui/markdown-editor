import {RefObject, useEffect} from 'react';

import {useBooleanState} from './hooks';

export const useNodeHovered = (nodeRef: RefObject<HTMLElement>) => {
    const [nodeHovered, setNodeHovered, unsetNodeHovered] = useBooleanState(false);

    useEffect(() => {
        const {current: anchor} = nodeRef;
        anchor?.addEventListener('mouseenter', setNodeHovered);
        anchor?.addEventListener('mouseleave', unsetNodeHovered);

        return () => {
            anchor?.removeEventListener('mouseenter', setNodeHovered);
            anchor?.removeEventListener('mouseleave', unsetNodeHovered);
        };
    }, [nodeRef.current, setNodeHovered, unsetNodeHovered]);

    return nodeHovered;
};
