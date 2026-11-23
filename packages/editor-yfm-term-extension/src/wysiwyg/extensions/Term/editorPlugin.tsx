import {ErrorLoggerBoundary, getReactRendererFromState} from '@gravity-ui/markdown-editor';
import {NodeSelection, Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {TermForm} from './TermNodeView/components/TermForm';
import {termNodeName} from './TermSpecs';
import {type TermTarget, editTerm, termEditorKey} from './commands';

export const termEditorPlugin = () =>
    new Plugin<TermTarget | null>({
        key: termEditorKey,
        state: {
            init: () => null,
            apply(tr, target) {
                const next: TermTarget | null | undefined = tr.getMeta(termEditorKey);
                if (next !== undefined) return next;
                if (!target || !tr.docChanged) return target;
                const from = tr.mapping.mapResult(target.from, 1);
                const to = tr.mapping.mapResult(target.to, -1);
                if (from.deleted || to.deleted || from.pos > to.pos) return null;
                if (target.edit && tr.doc.nodeAt(from.pos)?.type.name !== termNodeName) return null;
                return {...target, from: from.pos, to: to.pos};
            },
        },
        props: {
            handleKeyDown(view, event) {
                const {selection} = view.state;
                if (
                    event.key === 'Enter' &&
                    selection instanceof NodeSelection &&
                    selection.node.type.name === termNodeName
                ) {
                    editTerm(view, selection.from);
                    return true;
                }
                return false;
            },
        },
        view(view) {
            const item = getReactRendererFromState(view.state).createItem('yfm-term-editor', () => {
                const target = termEditorKey.getState(view.state);
                return target ? (
                    <ErrorLoggerBoundary>
                        <TermForm key={target.id} view={view} target={target} />
                    </ErrorLoggerBoundary>
                ) : null;
            });

            return {
                update(updatedView, prev) {
                    const target = termEditorKey.getState(updatedView.state);
                    if (
                        target !== termEditorKey.getState(prev) ||
                        (target && prev.doc !== updatedView.state.doc)
                    )
                        item.rerender();
                },
                destroy: () => item.remove(),
            };
        },
    });
