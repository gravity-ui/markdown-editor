import {Plugin} from 'prosemirror-state';

import {Logger2} from '../logger';

import {ExtensionBuilder} from './ExtensionBuilder';
import type {ExtensionDeps, ExtensionMarkSpec} from './types/extension';

const logger = new Logger2().nested({env: 'test'});

describe('ExtensionBuilder', () => {
    it('should build empty extension', () => {
        const ext = new ExtensionBuilder(logger).build();
        const deps = {} as ExtensionDeps;

        expect(ext.nodes().size).toBe(0);
        expect(ext.marks().size).toBe(0);
        expect(ext.plugins(deps).length).toBe(0);
        expect(Object.keys(ext.actions(deps)).length).toBe(0);
    });

    it('should immediately call added by .use() extension', () => {
        const mockExtension = jest.fn();
        const builder = new ExtensionBuilder(logger);
        const options = {a: 1, b: 2, c: 3};

        builder.use(mockExtension, options);

        expect(mockExtension).toBeCalledTimes(1);
        expect(mockExtension).toBeCalledWith(builder, options);
    });

    it('should add nodes', () => {
        const nodes = new ExtensionBuilder(logger)
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
        const marks = new ExtensionBuilder(logger)
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
        const mark0: ExtensionMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark0'}},
            toMd: {open: '', close: ''},
        };
        const mark1: ExtensionMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark1'}},
            toMd: {open: '', close: ''},
        };
        const mark2: ExtensionMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark2'}},
            toMd: {open: '', close: ''},
        };
        const mark3: ExtensionMarkSpec = {
            spec: {},
            fromMd: {tokenSpec: {type: 'mark', name: 'mark3'}},
            toMd: {open: '', close: ''},
        };
        const marksOrderedMap = new ExtensionBuilder(logger)
            .addMark('mark3', () => mark3, ExtensionBuilder.Priority.VeryLow)
            .addMark('mark1', () => mark1)
            .addMark('mark0', () => mark0, ExtensionBuilder.Priority.VeryHigh)
            .addMark('mark2', () => mark2)
            .build()
            .marks();
        const marksList: {name: string; spec: ExtensionMarkSpec}[] = [];
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
        const plugins = new ExtensionBuilder(logger)
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
        const plugins = new ExtensionBuilder(logger)
            .addPlugin(() => plugin3, ExtensionBuilder.Priority.VeryLow)
            .addPlugin(() => plugin1)
            .addPlugin(() => plugin0, ExtensionBuilder.Priority.VeryHigh)
            .addPlugin(() => plugin2)
            .build()
            .plugins({} as ExtensionDeps);

        expect(plugins.indexOf(plugin0)).toBe(0);
        expect(plugins.indexOf(plugin1)).toBe(1);
        expect(plugins.indexOf(plugin2)).toBe(2);
        expect(plugins.indexOf(plugin3)).toBe(3);
    });

    it('should add actions', () => {
        const actions = new ExtensionBuilder(logger)
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
        const builder = new ExtensionBuilder(logger).addNode('node', () => ({
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
        const builder = new ExtensionBuilder(logger).addMark('mark', () => ({
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
        const builder = new ExtensionBuilder(logger).addAction('action', () => ({
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

    describe('granular add methods', () => {
        it('should add node via granular methods', () => {
            const toMd = jest.fn();
            const nodes = new ExtensionBuilder(logger)
                .addNodeSpec('myNode', () => ({group: 'block'}))
                .addMarkdownTokenParserSpec('my_node', () => ({
                    name: 'myNode',
                    type: 'block',
                }))
                .addNodeSerializerSpec('myNode', () => toMd)
                .build()
                .nodes();

            expect(nodes.size).toBe(1);
            const nodeSpec = nodes.get('myNode');
            expect(nodeSpec).toBeTruthy();
            expect(nodeSpec!.spec.group).toBe('block');
            expect(nodeSpec!.fromMd.tokenName).toBe('my_node');
            expect(nodeSpec!.fromMd.tokenSpec.name).toBe('myNode');
            expect(nodeSpec!.fromMd.tokenSpec.type).toBe('block');
            expect(nodeSpec!.toMd).toBe(toMd);
        });

        it('should add mark via granular methods', () => {
            const marks = new ExtensionBuilder(logger)
                .addMarkSpec('myMark', () => ({
                    parseDOM: [{tag: 'em'}],
                    toDOM() {
                        return ['em'];
                    },
                }))
                .addMarkdownTokenParserSpec('em', () => ({
                    name: 'myMark',
                    type: 'mark',
                }))
                .addMarkSerializerSpec('myMark', () => ({open: '*', close: '*'}))
                .build()
                .marks();

            expect(marks.size).toBe(1);
            const markSpec = marks.get('myMark');
            expect(markSpec).toBeTruthy();
            expect(markSpec!.fromMd.tokenName).toBe('em');
            expect(markSpec!.fromMd.tokenSpec.name).toBe('myMark');
            expect(markSpec!.toMd).toEqual({open: '*', close: '*'});
        });

        it('should mix addNode and granular nodes', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNode('node1', () => ({
                    spec: {},
                    fromMd: {tokenSpec: {type: 'block', name: 'node1'}},
                    toMd: () => {},
                }))
                .addNodeSpec('node2', () => ({group: 'block'}))
                .addMarkdownTokenParserSpec('node2_token', () => ({
                    name: 'node2',
                    type: 'block',
                }))
                .addNodeSerializerSpec('node2', () => () => {})
                .build()
                .nodes();

            expect(nodes.size).toBe(2);
            expect(nodes.get('node1')).toBeTruthy();
            expect(nodes.get('node2')).toBeTruthy();
        });

        it('should throw when addNodeSpec name conflicts with addNode', () => {
            const builder = new ExtensionBuilder(logger).addNode('node', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'block', name: 'node'}},
                toMd: () => {},
            }));

            expect(() => builder.addNodeSpec('node', () => ({}))).toThrow(
                /already registered via addNode/,
            );
        });

        it('should throw when addMarkSpec name conflicts with addMark', () => {
            const builder = new ExtensionBuilder(logger).addMark('mark', () => ({
                spec: {},
                fromMd: {tokenSpec: {type: 'mark', name: 'mark'}},
                toMd: {open: '', close: ''},
            }));

            expect(() => builder.addMarkSpec('mark', () => ({}))).toThrow(
                /already registered via addMark/,
            );
        });

        it('should throw when addNodeSpec called twice with same name', () => {
            const builder = new ExtensionBuilder(logger).addNodeSpec('node', () => ({}));

            expect(() => builder.addNodeSpec('node', () => ({}))).toThrow(
                /already registered via addNodeSpec/,
            );
        });

        it('should throw when addMarkdownTokenParserSpec called twice with same tokenName', () => {
            const builder = new ExtensionBuilder(logger).addMarkdownTokenParserSpec('tok', () => ({
                name: 'a',
                type: 'block',
            }));

            expect(() =>
                builder.addMarkdownTokenParserSpec('tok', () => ({name: 'b', type: 'block'})),
            ).toThrow(/already registered via addMarkdownTokenParserSpec/);
        });

        it('should throw on build when granular node is missing parser spec', () => {
            const builder = new ExtensionBuilder(logger)
                .addNodeSpec('myNode', () => ({}))
                .addNodeSerializerSpec('myNode', () => () => {});

            expect(() => builder.build().nodes()).toThrow(/missing parser spec/);
        });

        it('should throw on build when granular node is missing serializer', () => {
            const builder = new ExtensionBuilder(logger)
                .addNodeSpec('myNode', () => ({}))
                .addMarkdownTokenParserSpec('tok', () => ({name: 'myNode', type: 'block'}));

            expect(() => builder.build().nodes()).toThrow(/missing serializer/);
        });

        it('should throw on build when granular mark is missing parser spec', () => {
            const builder = new ExtensionBuilder(logger)
                .addMarkSpec('myMark', () => ({}))
                .addMarkSerializerSpec('myMark', () => ({open: '', close: ''}));

            expect(() => builder.build().marks()).toThrow(/missing parser spec/);
        });

        it('should throw on build when granular mark is missing serializer', () => {
            const builder = new ExtensionBuilder(logger)
                .addMarkSpec('myMark', () => ({}))
                .addMarkdownTokenParserSpec('tok', () => ({name: 'myMark', type: 'mark'}));

            expect(() => builder.build().marks()).toThrow(/missing serializer/);
        });

        it('should handle multiple parser tokens mapping to the same node', () => {
            const toMd = jest.fn();
            const nodes = new ExtensionBuilder(logger)
                .addNodeSpec('code_block', () => ({group: 'block', code: true}))
                .addMarkdownTokenParserSpec('code_block', () => ({
                    name: 'code_block',
                    type: 'block',
                    noCloseToken: true,
                }))
                .addMarkdownTokenParserSpec('fence', () => ({
                    name: 'code_block',
                    type: 'block',
                    noCloseToken: true,
                }))
                .addNodeSerializerSpec('code_block', () => toMd)
                .build()
                .nodes();

            // Main node entry + parser-only entry for the extra token
            expect(nodes.size).toBe(2);

            const codeBlock = nodes.get('code_block');
            expect(codeBlock).toBeTruthy();
            expect(codeBlock!.spec.group).toBe('block');
            expect(codeBlock!.toMd).toBe(toMd);

            const fence = nodes.get('fence');
            expect(fence).toBeTruthy();
            expect(fence!.fromMd.tokenName).toBe('fence');
            expect(fence!.fromMd.tokenSpec.name).toBe('code_block');
            // Parser-only entry has empty spec and throwing serializer
            expect(fence!.spec).toEqual({});
            expect(() => (fence!.toMd as Function)()).toThrow();
        });

        it('should handle multiple parser tokens mapping to the same mark', () => {
            const marksList: {name: string; spec: ExtensionMarkSpec}[] = [];

            new ExtensionBuilder(logger)
                .addMarkSpec('myMark', () => ({}))
                .addMarkdownTokenParserSpec('em', () => ({
                    name: 'myMark',
                    type: 'mark',
                }))
                .addMarkdownTokenParserSpec('emphasis', () => ({
                    name: 'myMark',
                    type: 'mark',
                }))
                .addMarkSerializerSpec('myMark', () => ({open: '*', close: '*'}))
                .build()
                .marks()
                .forEach((name, spec) => marksList.push({name, spec}));

            // Main mark entry + parser-only entry for the extra token
            expect(marksList).toHaveLength(2);
            expect(marksList[0].name).toBe('myMark');
            expect(marksList[0].spec.toMd).toEqual({open: '*', close: '*'});
            expect(marksList[1].name).toBe('emphasis');
            expect(marksList[1].spec.fromMd.tokenName).toBe('emphasis');
            expect(marksList[1].spec.fromMd.tokenSpec.name).toBe('myMark');
        });

        it('should handle addMarkdownTokenParserSpec token targeting addNode entity', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNode('code_block', () => ({
                    spec: {group: 'block', code: true},
                    fromMd: {
                        tokenSpec: {name: 'code_block', type: 'block', noCloseToken: true},
                    },
                    toMd: () => {},
                }))
                .addMarkdownTokenParserSpec('fence', () => ({
                    name: 'code_block',
                    type: 'block',
                    noCloseToken: true,
                }))
                .build()
                .nodes();

            // addNode entry + parser-only entry for 'fence'
            expect(nodes.size).toBe(2);

            const codeBlock = nodes.get('code_block');
            expect(codeBlock).toBeTruthy();
            expect(codeBlock!.spec.group).toBe('block');

            const fence = nodes.get('fence');
            expect(fence).toBeTruthy();
            expect(fence!.fromMd.tokenName).toBe('fence');
            expect(fence!.fromMd.tokenSpec.name).toBe('code_block');
            expect(fence!.spec).toEqual({});
            expect(() => (fence!.toMd as Function)()).toThrow();
        });

        it('should apply overrides to extra parser tokens', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNodeSpec('code_block', () => ({group: 'block'}))
                .addMarkdownTokenParserSpec('code_block', () => ({
                    name: 'code_block',
                    type: 'block',
                }))
                .addMarkdownTokenParserSpec('fence', () => ({
                    name: 'code_block',
                    type: 'block',
                }))
                .addNodeSerializerSpec('code_block', () => () => {})
                .overrideMarkdownTokenParserSpec('fence', (prev) => ({
                    ...prev,
                    noCloseToken: true,
                }))
                .build()
                .nodes();

            const fence = nodes.get('fence');
            expect(fence!.fromMd.tokenSpec.noCloseToken).toBe(true);
        });

        it('should allow overrideMarkdownTokenParserSpec on addNode token', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNode('image', () => ({
                    spec: {inline: true, group: 'inline'},
                    fromMd: {
                        tokenSpec: {
                            name: 'image',
                            type: 'node',
                            getAttrs: () => ({src: ''}),
                        },
                    },
                    toMd: () => {},
                }))
                .overrideMarkdownTokenParserSpec('image', (prev) => ({
                    ...prev,
                    getAttrs: () => ({src: '', width: null}),
                }))
                .build()
                .nodes();

            const image = nodes.get('image');
            expect(image!.fromMd.tokenSpec.getAttrs!({} as any, [] as any, 0)).toEqual({
                src: '',
                width: null,
            });
        });

        it('should allow overrideMarkdownTokenParserSpec on addMark token', () => {
            const marks = new ExtensionBuilder(logger)
                .addMark('bold', () => ({
                    spec: {},
                    fromMd: {
                        tokenSpec: {
                            name: 'bold',
                            type: 'mark',
                            getAttrs: () => ({weight: 'bold'}),
                        },
                    },
                    toMd: {open: '**', close: '**'},
                }))
                .overrideMarkdownTokenParserSpec('bold', (prev) => ({
                    ...prev,
                    getAttrs: () => ({weight: 'bold', custom: true}),
                }))
                .build()
                .marks();

            const bold = marks.get('bold');
            expect(bold!.fromMd.tokenSpec.getAttrs!({} as any, [] as any, 0)).toEqual({
                weight: 'bold',
                custom: true,
            });
        });

        it('should sort granular marks by priority together with addMark marks', () => {
            const marksList: {name: string; spec: ExtensionMarkSpec}[] = [];

            new ExtensionBuilder(logger)
                .addMark(
                    'addMarkLow',
                    () => ({
                        spec: {},
                        fromMd: {tokenSpec: {type: 'mark', name: 'addMarkLow'}},
                        toMd: {open: '', close: ''},
                    }),
                    ExtensionBuilder.Priority.Low,
                )
                .addMarkSpec('granularHigh', () => ({}), ExtensionBuilder.Priority.High)
                .addMarkdownTokenParserSpec('granular_high', () => ({
                    name: 'granularHigh',
                    type: 'mark',
                }))
                .addMarkSerializerSpec('granularHigh', () => ({open: '', close: ''}))
                .build()
                .marks()
                .forEach((name, spec) => marksList.push({name, spec}));

            expect(marksList[0].name).toBe('granularHigh');
            expect(marksList[1].name).toBe('addMarkLow');
        });
    });

    describe('override methods', () => {
        it('should override node spec from addNode', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNode('heading', () => ({
                    spec: {group: 'block', content: 'inline*'},
                    fromMd: {tokenSpec: {type: 'block', name: 'heading'}},
                    toMd: () => {},
                }))
                .overrideNodeSpec('heading', (prev) => ({...prev, group: 'block heading'}))
                .build()
                .nodes();

            expect(nodes.get('heading')!.spec.group).toBe('block heading');
            expect(nodes.get('heading')!.spec.content).toBe('inline*');
        });

        it('should override node spec from addNodeSpec', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNodeSpec('myNode', () => ({group: 'block', content: 'inline*'}))
                .addMarkdownTokenParserSpec('my_node', () => ({name: 'myNode', type: 'block'}))
                .addNodeSerializerSpec('myNode', () => () => {})
                .overrideNodeSpec('myNode', (prev) => ({...prev, group: 'block custom'}))
                .build()
                .nodes();

            expect(nodes.get('myNode')!.spec.group).toBe('block custom');
            expect(nodes.get('myNode')!.spec.content).toBe('inline*');
        });

        it('should chain multiple overrides', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNode('node', () => ({
                    spec: {group: 'block', content: 'inline*', marks: ''},
                    fromMd: {tokenSpec: {type: 'block', name: 'node'}},
                    toMd: () => {},
                }))
                .overrideNodeSpec('node', (prev) => ({...prev, group: 'block custom'}))
                .overrideNodeSpec('node', (prev) => ({...prev, content: 'block+'}))
                .build()
                .nodes();

            expect(nodes.get('node')!.spec.group).toBe('block custom');
            expect(nodes.get('node')!.spec.content).toBe('block+');
            expect(nodes.get('node')!.spec.marks).toBe('');
        });

        it('should override mark spec from addMark', () => {
            const marks = new ExtensionBuilder(logger)
                .addMark('bold', () => ({
                    spec: {parseDOM: [{tag: 'strong'}]},
                    fromMd: {tokenSpec: {type: 'mark', name: 'bold'}},
                    toMd: {open: '**', close: '**'},
                }))
                .overrideMarkSpec('bold', (prev) => ({
                    ...prev,
                    parseDOM: [{tag: 'strong'}, {tag: 'b'}],
                }))
                .build()
                .marks();

            expect(marks.get('bold')!.spec.parseDOM).toHaveLength(2);
        });

        it('should override parser spec on granular node', () => {
            const nodes = new ExtensionBuilder(logger)
                .addNodeSpec('myNode', () => ({}))
                .addMarkdownTokenParserSpec('my_tok', () => ({
                    name: 'myNode',
                    type: 'block',
                }))
                .addNodeSerializerSpec('myNode', () => () => {})
                .overrideMarkdownTokenParserSpec('my_tok', (prev) => ({
                    ...prev,
                    noCloseToken: true,
                }))
                .build()
                .nodes();

            expect(nodes.get('myNode')!.fromMd.tokenSpec.noCloseToken).toBe(true);
            expect(nodes.get('myNode')!.fromMd.tokenSpec.type).toBe('block');
        });

        it('should override node serializer on addNode entry', () => {
            const originalToMd = jest.fn();
            const newToMd = jest.fn();

            const nodes = new ExtensionBuilder(logger)
                .addNode('node', () => ({
                    spec: {},
                    fromMd: {tokenSpec: {type: 'block', name: 'node'}},
                    toMd: originalToMd,
                }))
                .overrideNodeSerializerSpec('node', () => newToMd)
                .build()
                .nodes();

            expect(nodes.get('node')!.toMd).toBe(newToMd);
        });

        it('should override mark serializer on addMark entry', () => {
            const marks = new ExtensionBuilder(logger)
                .addMark('em', () => ({
                    spec: {},
                    fromMd: {tokenSpec: {type: 'mark', name: 'em'}},
                    toMd: {open: '_', close: '_'},
                }))
                .overrideMarkSerializerSpec('em', () => ({open: '*', close: '*'}))
                .build()
                .marks();

            expect(marks.get('em')!.toMd).toEqual({open: '*', close: '*'});
        });

        it('should preserve view when overriding addNode entry', () => {
            const viewFactory = () => (() => {}) as any;

            const nodes = new ExtensionBuilder(logger)
                .addNode('node', () => ({
                    spec: {group: 'block'},
                    fromMd: {tokenSpec: {type: 'block', name: 'node'}},
                    toMd: () => {},
                    view: viewFactory,
                }))
                .overrideNodeSpec('node', (prev) => ({...prev, group: 'block custom'}))
                .build()
                .nodes();

            expect(nodes.get('node')!.view).toBe(viewFactory);
            expect(nodes.get('node')!.spec.group).toBe('block custom');
        });

        it('should work with addNode entries when no overrides applied', () => {
            const toMd = jest.fn();
            const nodes = new ExtensionBuilder(logger)
                .addNode('node', () => ({
                    spec: {group: 'block'},
                    fromMd: {tokenSpec: {type: 'block', name: 'node'}},
                    toMd,
                }))
                .build()
                .nodes();

            expect(nodes.get('node')!.spec.group).toBe('block');
            expect(nodes.get('node')!.toMd).toBe(toMd);
        });

        it('should throw when overriding unregistered node spec', () => {
            expect(() =>
                new ExtensionBuilder(logger).overrideNodeSpec('unknown', (prev) => prev),
            ).toThrow(/not registered/);
        });

        it('should throw when overriding unregistered mark spec', () => {
            expect(() =>
                new ExtensionBuilder(logger).overrideMarkSpec('unknown', (prev) => prev),
            ).toThrow(/not registered/);
        });

        it('should throw when overriding unregistered parser token', () => {
            expect(() =>
                new ExtensionBuilder(logger).overrideMarkdownTokenParserSpec(
                    'unknown_tok',
                    (prev) => prev,
                ),
            ).toThrow(/not registered/);
        });

        it('should throw when overriding unregistered node serializer', () => {
            expect(() =>
                new ExtensionBuilder(logger).overrideNodeSerializerSpec('unknown', (prev) => prev),
            ).toThrow(/not registered/);
        });

        it('should throw when overriding unregistered mark serializer', () => {
            expect(() =>
                new ExtensionBuilder(logger).overrideMarkSerializerSpec('unknown', (prev) => prev),
            ).toThrow(/not registered/);
        });
    });
});
