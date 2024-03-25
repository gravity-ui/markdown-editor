/* eslint-disable @typescript-eslint/no-loop-func */
import {MainHandler, MainHandlerConfig} from './handler';
import type {AutocompleteAction, AutocompleteHandler, AutocompleteTrigger} from './types';

const methodsWithAction = new Set<keyof AutocompleteHandler>([
    'onArrow',
    'onClose',
    'onEnter',
    'onFilter',
    'onOpen',
]);

describe('Autocomplete', () => {
    describe('MainHandler', () => {
        for (const method of methodsWithAction) {
            it(`should call ${method} only on the right handlers`, () => {
                const handler1: AutocompleteHandler = {[method]: jest.fn(() => false)};
                const handler2: AutocompleteHandler = {[method]: jest.fn(() => true)};
                const handler3: AutocompleteHandler = {[method]: jest.fn(() => true)};

                const trigger1: AutocompleteTrigger = {name: 'trigger1', trigger: '#'};
                const trigger2: AutocompleteTrigger = {name: 'trigger2', trigger: '#'};
                const trigger3: AutocompleteTrigger = {name: 'trigger3', trigger: '#'};

                const action1: AutocompleteAction = {
                    type: trigger1,
                } as AutocompleteAction;
                const action3: AutocompleteAction = {
                    type: trigger3,
                } as AutocompleteAction;

                const config: MainHandlerConfig = [
                    {handler: handler1, trigger: trigger1},
                    {handler: handler2, trigger: trigger2},
                    {handler: handler3, trigger: trigger3},
                ];
                const mainHandler = new MainHandler(config);

                expect(mainHandler[method](action1)).toBe(false);
                expect(handler1[method]).toBeCalledTimes(1);
                expect(handler1[method]).toBeCalledWith(action1);
                expect(handler2[method]).toBeCalledTimes(0);
                expect(handler3[method]).toBeCalledTimes(0);

                expect(mainHandler[method](action3)).toBe(true);
                expect(handler1[method]).toBeCalledTimes(1);
                expect(handler2[method]).toBeCalledTimes(0);
                expect(handler3[method]).toBeCalledTimes(1);
                expect(handler3[method]).toBeCalledWith(action3);
            });
        }

        it('should call onDestroy on each handler', () => {
            const handler1: AutocompleteHandler = {onDestroy: jest.fn()};
            const handler2: AutocompleteHandler = {onDestroy: jest.fn()};
            const handler3: AutocompleteHandler = {onDestroy: jest.fn()};

            const trigger: AutocompleteTrigger = {name: 'name', trigger: '#'};
            const config: MainHandlerConfig = [
                {handler: handler1, trigger},
                {handler: handler2, trigger},
                {handler: handler3, trigger},
            ];
            const mainHandler = new MainHandler(config);

            mainHandler.onDestroy();

            expect(handler1.onDestroy).toBeCalled();
            expect(handler2.onDestroy).toBeCalled();
            expect(handler3.onDestroy).toBeCalled();
        });
    });
});
