import {Plugin} from 'prosemirror-state';

import {ExtensionDeps} from '../../../core/types/extension';
import {CommandMenuOptions} from '../../behavior/CommandMenu';

import {defaultNodeFilter} from './config';
import {EmptyRowEventsHandler} from './emptyRowActionsHandler';

export const emptyRowPlugin = (deps: ExtensionDeps, opts: CommandMenuOptions) => {
    let eventsHandler: EmptyRowEventsHandler | null = null;

    return new Plugin({
        props: {
            handleDOMEvents: {
                mousemove: (_view, event) => eventsHandler?.handleViewMousemove(event),
            },
        },
        view: (view) => {
            eventsHandler = new EmptyRowEventsHandler(
                view,
                {
                    nodeFilter: defaultNodeFilter,
                    opts: opts,
                },
                deps,
            );

            return eventsHandler;
        },
    });
};
