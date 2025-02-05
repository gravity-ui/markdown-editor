import {createContext, useContext, useMemo} from 'react';

import type {ToasterPublicMethods} from '@gravity-ui/uikit';

export const ToasterContext = createContext<ToasterPublicMethods | null>(null);
ToasterContext.displayName = 'YEToasterContext';

export function useToaster(): ToasterPublicMethods {
    const toaster = useContext(ToasterContext);

    if (!toaster) {
        throw new Error('YEToaster: `useToaster` hook is used out of context');
    }

    return useMemo(() => toaster, [toaster]);
}
