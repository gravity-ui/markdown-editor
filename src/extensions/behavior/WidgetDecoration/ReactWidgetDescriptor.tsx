import {Portal} from '@gravity-ui/uikit';
import type {EditorView} from 'prosemirror-view';

import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {type RendererItem, getReactRendererFromState} from '../ReactRenderer';

import {WidgetDescriptor} from './WidgetDescriptor';

export abstract class ReactWidgetDescriptor extends WidgetDescriptor {
    protected renderItem?: RendererItem;

    abstract getDomElem(): HTMLElement;
    abstract renderReactElement(view: EditorView, getPos: () => number): React.ReactElement;

    remove(): void {
        this.renderItem?.remove();
        this.renderItem = undefined;
    }

    protected renderWidget(): HTMLElement {
        this.renderItem = this.renderItem ?? this.createRenderItem();
        this.renderItem.rerender();
        return this.getDomElem();
    }

    protected createRenderItem() {
        return getReactRendererFromState(this.view!.state).createItem('widget', () => (
            <Portal container={this.getDomElem()}>
                <ErrorLoggerBoundary>
                    {this.renderReactElement(this.view!, this.getPos!)}
                </ErrorLoggerBoundary>
            </Portal>
        ));
    }
}
