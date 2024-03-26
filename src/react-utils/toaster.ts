import React from 'react';

import type {ToasterPublicMethods} from '@gravity-ui/uikit';

export const ToasterContext = React.createContext<ToasterPublicMethods | null>(null);
ToasterContext.displayName = 'YEToasterContext';

export function useToaster(): ToasterPublicMethods {
    const toaster = React.useContext(ToasterContext);

    if (!toaster) {
        throw new Error('YEToaster: `useToaster` hook is used out of context');
    }

    return React.useMemo(() => toaster, [toaster]);
}
