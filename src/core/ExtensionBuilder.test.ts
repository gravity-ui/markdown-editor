import {Plugin} from 'prosemirror-state';

import {ExtensionBuilder} from './ExtensionBuilder';
import type {ExtensionDeps, WEMarkSpec} from './types/extension';

describe('ExtensionBuilder', () => {
    it('should build empty extension', () => {
        const ext = new ExtensionBuilder().build();
        const deps = {} as ExtensionDeps;

        expect(ext.nodes().size).toBe(0);
        expect(ext.marks().size).toBe(0);
        expect(ext.plugins(deps).length).toBe(0);
        expect(Object.keys(ext.actions(deps)).length).toBe(0);
    });

    it('should immediately call added by .use() extension', () => {
        const mockExtension = jest.fn();
        const builder = new ExtensionBuilder();
        const options = {a: 1, b: 2, c: 3};

        builder.use(mockExtension, options);

        expect(mockExtension).toBeCalledTimes(1);
        expect(mockExtension).toBeCalledWith(builder, options);
    });

    it('should add nodes', () => {
        const nodes = new ExtensionBuilder()
            .addNode('node1', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'block', name: 'node1'}},
                toMd: () => {},
            }))
            .addNode('node2', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'block', name: 'node2'}},
                toMd: () => {},
            }))
            .build()
            .nodes();

        expect(nodes.size).toBe(2);
        expect(nodes.get('node1')).toBeTruthy();
        expect(nodes.get('node2')).toBeTruthy();
    });

    it('should add marks', () => {
        const marks = new ExtensionBuilder()
            .addMark('mark1', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'mark', name: 'mark1'}},
                toMd: {open: '', close: ''},
            }))
            .addMark('mark2', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'mark', name: 'mark2'}},
                toMd: {open: '', close: ''},
            }))
            .build()
            .marks();

        expect(marks.size).toBe(2);
        expect(marks.get('mark1')).toBeTruthy();
        expect(marks.get('mark2')).toBeTruthy();
    });

    it('should sort marks by priority', () => {
        const mark0: WEMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark0'}},
            toMd: {open: '', close: ''},
        };
        const mark1: WEMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark1'}},
            toMd: {open: '', close: ''},
        };
        const mark2: WEMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark2'}},
            toMd: {open: '', close: ''},
        };
        const mark3: WEMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark3'}},
            toMd: {open: '', close: ''},
        };
        const marksOrderedMap = new ExtensionBuilder()
            .addMark('mark3', () => mark3, ExtensionBuilder.Priority.VeryLow)
            .addMark('mark1', () => mark1)
            .addMark('mark0', () => mark0, ExtensionBuilder.Priority.VeryHigh)
            .addMark('mark2', () => mark2)
            .build()
            .marks();
        const marksList: {name: string; spec: WEMarkSpec}[] = [];
        marksOrderedMap.forEach((name, spec) => marksList.push({name, spec}));
        expect(marksList[0].name).toBe('mark0');
        expect(marksList[0].spec === mark0).toBe(true);
        expect(marksList[1].name).toBe('mark1');
        expect(marksList[1].spec === mark1).toBe(true);
        expect(marksList[2].name).toBe('mark2');
        expect(marksList[2].spec === mark2).toBe(true);
        expect(marksList[3].name).toBe('mark3');
        expect(marksList[3].spec === mark3).toBe(true);
    });

    it('should add plugins', () => {
        const plugins = new ExtensionBuilder()
            .addPlugin(() => new Plugin({}))
            .addPlugin(() => new Plugin({}))
            .build()
            .plugins({} as ExtensionDeps);

        expect(plugins.length).toBe(2);
    });

    it('should sort plugins by priority', () => {
        const plugin0 = new Plugin({});
        const plugin1 = new Plugin({});
        const plugin2 = new Plugin({});
        const plugin3 = new Plugin({});
        const plugins = new ExtensionBuilder()
            .addPlugin(() => plugin3, ExtensionBuilder.PluginPriority.VeryLow)
            .addPlugin(() => plugin1)
            .addPlugin(() => plugin0, ExtensionBuilder.PluginPriority.VeryHigh)
            .addPlugin(() => plugin2)
            .build()
            .plugins({} as ExtensionDeps);

        expect(plugins.indexOf(plugin0)).toBe(0);
        expect(plugins.indexOf(plugin1)).toBe(1);
        expect(plugins.indexOf(plugin2)).toBe(2);
        expect(plugins.indexOf(plugin3)).toBe(3);
    });

    it('should add actions', () => {
        const actions = new ExtensionBuilder()
            .addAction('action1', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }))
            .addAction('action2', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }))
            .build()
            .actions({} as ExtensionDeps);

        expect(Object.keys(actions).length).toBe(2);
        expect('action1' in actions).toBe(true);
        expect('action2' in actions).toBe(true);
    });

    it('should throw error when add nodes with the same names', () => {
        const builder = new ExtensionBuilder().addNode('node', () => ({
            spec: {},
            toMd: () => {},
            fromMd: {tokenSpec: {type: 'block', name: 'node'}},
        }));

        const fn = () => {
            builder.addNode('node', () => ({
                spec: {},
                toMd: () => {},
                fromMd: {tokenSpec: {type: 'block', name: 'node'}},
            }));
        };

        expect(fn).toThrow(Error);
    });

    it('should throw error when add marks with the same names', () => {
        const builder = new ExtensionBuilder().addMark('mark', () => ({
            spec: {},
            toMd: {open: '', close: ''},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark'}},
        }));

        const fn = () => {
            builder.addMark('mark', () => ({
                spec: {},
                toMd: {open: '', close: ''},
                fromMd: {tokenSpec: {type: 'mark', name: 'mark'}},
            }));
        };

        expect(fn).toThrow(Error);
    });

    it('should throw error when add actions with the same names', () => {
        const builder = new ExtensionBuilder().addAction('action', () => ({
            isActive: () => false,
            isEnable: () => false,
            run() {},
        }));

        const fn = () => {
            builder.addAction('action', () => ({
                isActive: () => false,
                isEnable: () => false,
                run() {},
            }));
        };

        expect(fn).toThrow(Error);
    });
});
