import {capitalize, isString} from '../../../lodash';
import {logger} from '../../../logger';

import type {AutocompleteAction, AutocompleteHandler, AutocompleteItem} from './types';

export type MainHandlerConfig = readonly AutocompleteItem[];

type MainHandlerLogOptions =
    | {
          event: 'destroy';
      }
    | {
          event: 'open' | 'close' | 'arrow' | 'filter' | 'enter';
          action: AutocompleteAction;
          item?: AutocompleteItem;
      };

export class MainHandler implements Required<AutocompleteHandler> {
    private static log(opts: MainHandlerLogOptions) {
        const prefix = '[Autocomplete]';

        if (opts.event === 'destroy') {
            logger.log(`${prefix} Destroy`);
            return;
        }

        const {action, item} = opts;
        const msg = [
            prefix,
            capitalize(opts.event),
            `Trigger="${action.trigger}"`,
            `Filter=${action.filter !== undefined ? `"${action.filter}"` : 'None'}`,
            `Type=${action.type ? `"${action.type.name}"` : 'None'}`,
            `Handler=${item ? `"${item.trigger.name}"` : 'None'}`,
        ].join(' ');

        logger.log(msg);
    }

    private readonly config: MainHandlerConfig;

    constructor(config: MainHandlerConfig) {
        this.config = config;
    }

    onOpen(action: AutocompleteAction): boolean {
        const item = this.getItem(action);
        MainHandler.log({event: 'open', action, item});
        return item?.handler.onOpen?.(action) ?? false;
    }

    onClose(action: AutocompleteAction): boolean {
        const item = this.getItem(action);
        MainHandler.log({event: 'close', action, item});
        return item?.handler.onClose?.(action) ?? false;
    }

    onArrow(action: AutocompleteAction): boolean {
        const item = this.getItem(action);
        MainHandler.log({event: 'arrow', action, item});
        return item?.handler.onArrow?.(action) ?? false;
    }

    onEnter(action: AutocompleteAction): boolean {
        const item = this.getItem(action);
        MainHandler.log({event: 'enter', action, item});
        return item?.handler.onEnter?.(action) ?? false;
    }

    onFilter(action: AutocompleteAction): boolean {
        const item = this.getItem(action);
        MainHandler.log({event: 'filter', action, item});
        return item?.handler.onFilter?.(action) ?? false;
    }

    onDestroy(): void {
        MainHandler.log({event: 'destroy'});
        for (const item of this.config) {
            item.handler.onDestroy?.();
        }
    }

    private getItem({trigger, type}: AutocompleteAction) {
        let predicate: Parameters<(typeof this.config)['find']>[0];

        if (type) {
            predicate = (item) => item.trigger.name === type.name;
        } else {
            predicate = (item) => {
                const itemTrigger = item.trigger.trigger;
                if (isString(itemTrigger)) return itemTrigger === trigger;
                return itemTrigger.test(trigger);
            };
        }

        return this.config.find(predicate);
    }
}
