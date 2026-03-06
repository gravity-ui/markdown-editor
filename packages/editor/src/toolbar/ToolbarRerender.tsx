import {type PropsWithChildren, useEffect, useMemo} from 'react';

import {useUpdate} from 'react-use';

import {EventEmitter} from 'src/utils';

import {
    type ToolbarContextValue,
    type ToolbarEvents,
    ToolbarProvider,
    useToolbarContext,
} from './context';

export type ToolbarRerenderWrapperProps = {
    content: () => React.ReactNode;
};

/**
 Rerender the content when an update event is received in the event bus from the context.
 @internal
 */
// TODO [major]: Always expect the toolbar to be wrapped in context; remove this component as unnecessary.
export function ToolbarUpdateOnRerender({content}: ToolbarRerenderWrapperProps) {
    const rerender = useUpdate();
    const context = useToolbarContext();

    useEffect(() => {
        if (!context) return undefined;
        context.eventBus.on('update', rerender);
        return () => {
            context.eventBus.off('update', rerender);
        };
    }, [context, rerender]);

    return <>{content()}</>;
}

type ToolbarWrapToContextProps<E> = PropsWithChildren<{
    editor: E;
}>;

/**
 If there is no external context, wraps the content in the toolbar context
 and emits an update event on each component re-render.
 @internal
 */
// TODO [major]: Always expect the toolbar to be wrapped in context; remove this component as unnecessary.
export function ToolbarWrapToContext<E>({editor, children}: ToolbarWrapToContextProps<E>) {
    const outerContext = useToolbarContext();
    const innerContext = useMemo(() => {
        if (outerContext) return undefined;
        const eventBus = new EventEmitter<ToolbarEvents>();
        return {editor, eventBus} satisfies ToolbarContextValue<E>;
    }, [editor, outerContext]);

    useEffect(() => {
        innerContext?.eventBus.emit('update', null);
    });

    // wrapping in inner context only if there is no outer context
    return innerContext ? (
        <ToolbarProvider value={innerContext}>{children}</ToolbarProvider>
    ) : (
        <>{children}</>
    );
}
