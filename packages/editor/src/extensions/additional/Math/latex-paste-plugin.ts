import {Plugin} from 'prosemirror-state';

import {getLoggerFromState} from '#core';
import {Fragment, Slice} from '#pm/model';

import {MathNode} from './const';
import {getLatexData, parseLatexFormulas} from './utils';

export const latexPastePlugin = () =>
    new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, e: Event) {
                    const event = e as ClipboardEvent;
                    if (!event.clipboardData || view.state.selection.$from.parent.type.spec.code) {
                        return false;
                    }

                    const latexData = getLatexData(event.clipboardData);
                    if (!latexData) return false;

                    getLoggerFromState(view.state).event({
                        domEvent: 'paste',
                        event: 'paste-latex-from-code-editor',
                        editor: latexData.editor,
                        editorMode: latexData.mode,
                        empty: !latexData.value,
                        dataTypes: event.clipboardData.types,
                    });

                    const {tr, schema} = view.state;
                    const mathBlockType = schema.nodes[MathNode.Block];

                    if (!mathBlockType) return false;

                    if (latexData.value) {
                        const formulas = parseLatexFormulas(latexData.value);

                        if (formulas.length > 0) {
                            const nodes = formulas.map((formula) =>
                                mathBlockType.create(null, schema.text(formula)),
                            );
                            const fragment = Fragment.from(nodes);
                            tr.replaceSelection(new Slice(fragment, 0, 0));
                        } else {
                            tr.deleteSelection();
                        }
                    } else {
                        tr.deleteSelection();
                    }

                    view.dispatch(tr.scrollIntoView());
                    e.preventDefault();
                    return true;
                },
            },
        },
    });
