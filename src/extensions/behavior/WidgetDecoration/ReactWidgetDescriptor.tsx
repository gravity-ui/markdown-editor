import {EditorView} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import {ErrorLoggerBoundary} from '../../../react-utils/ErrorBoundary';
import {RendererItem, getReactRendererFromState} from '../ReactRenderer';

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
        return getReactRendererFromState(this.view!.state).createItem('widget', () =>
            createPortal(
                <ErrorLoggerBoundary>
                    {this.renderReactElement(this.view!, this.getPos!)}
                </ErrorLoggerBoundary>,
                this.getDomElem(),
            ),
        );
    }
}
