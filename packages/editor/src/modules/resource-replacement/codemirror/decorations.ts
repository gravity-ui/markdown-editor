import {type EditorState, StateField} from '@codemirror/state';
import {Decoration, type DecorationSet, EditorView, WidgetType} from '@codemirror/view';

import {ReactRendererFacet} from '../../../markup/codemirror/react-facet';
import {createResourceIndicator, destroyResourceIndicator} from '../indicator';
import type {ReplacementResource} from '../types';

import {pendingField} from './pending-state';

class PendingWidget extends WidgetType {
    readonly id: string;
    readonly resource: ReplacementResource;
    constructor(id: string, resource: ReplacementResource) {
        super();
        this.id = id;
        this.resource = resource;
    }
    eq(other: PendingWidget) {
        return this.id === other.id && this.resource === other.resource;
    }
    toDOM(view: EditorView) {
        return createResourceIndicator(this.resource, view.state.facet(ReactRendererFacet));
    }
    destroy(dom: HTMLElement) {
        destroyResourceIndicator(dom);
    }
}

export const createResourceDecorations = (state: EditorState) =>
    Decoration.set(
        state.field(pendingField).flatMap((batch) =>
            batch.ranges.map((range, index) =>
                Decoration.replace({
                    widget: new PendingWidget(`${batch.id}:${index}`, range.resource),
                }).range(range.from, range.to),
            ),
        ),
        true,
    );
export function createResourceDecorationExtension() {
    const decorationField = StateField.define<DecorationSet>({
        create: createResourceDecorations,
        update(value, tr) {
            return tr.state.field(pendingField) === tr.startState.field(pendingField)
                ? value
                : createResourceDecorations(tr.state);
        },
        provide: (field) => EditorView.decorations.from(field),
    });

    return [
        decorationField,
        EditorView.atomicRanges.of((view) => view.state.field(decorationField)),
    ];
}
