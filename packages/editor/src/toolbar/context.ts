import {createContext, useContext} from 'react';

import type {Receiver} from 'src/utils/event-emitter';

export type ToolbarEvents = {
    update: null;
};

// TODO: [major] pass to context all other methods (focus, onClick, etc.)
export type ToolbarContextValue<E> = {
    editor: E;
    eventBus: Receiver<ToolbarEvents>;
};

// TODO: specify generic editor type
const ToolbarContext = createContext<ToolbarContextValue<unknown> | undefined>(undefined);

export const ToolbarProvider = ToolbarContext.Provider;

export function useToolbarContext<E>(): ToolbarContextValue<E> {
    return useContext(ToolbarContext) as ToolbarContextValue<E>;
}
