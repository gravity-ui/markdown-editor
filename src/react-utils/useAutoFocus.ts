import {RefObject, useEffect} from 'react';

export const useAutoFocus = (nodeRef: RefObject<HTMLElement>, dependencies: unknown[] = []) => {
    useEffect(() => {
        const {current: anchor} = nodeRef;
        const timeout = setTimeout(() => {
            anchor?.focus();
        });

        return () => {
            clearTimeout(timeout);
        };
        // https://github.com/facebook/react/issues/23392#issuecomment-1055610198
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodeRef.current, ...dependencies]);
};
