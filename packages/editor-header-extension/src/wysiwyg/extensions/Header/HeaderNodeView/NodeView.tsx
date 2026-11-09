import {cn} from '@gravity-ui/markdown-editor';
import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView, NodeView, ViewMutationRecord} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderDimensions,
    type HeaderTextAttrs,
    type HeaderTitleAttrs,
    headerClassNames,
    headerDimensions,
} from '@gravity-ui/markdown-plugin-header';
import {Portal} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

import {setHeaderDimensions} from '../commands';
import {STOP_EVENT_CLASSNAME, headerControlButtons, headerControlsClassName} from '../const';
import {setHeaderTextVisibility, setHeaderTitleAttrs} from '../text/commands';

import {HeaderControls} from './HeaderControls';
import {HeaderSettings} from './Settings/HeaderSettings';
import {TextSettings} from './Settings/TextSettings';

import './NodeView.scss';

const b = cn('header-view');

export class WHeaderNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private readonly controlsDOM: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private readonly renderItem;
    private settingsOpen = false;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;

        this.dom = document.createElement('div');
        this.updateClassName();
        this.contentDOM = this.dom.appendChild(document.createElement('div'));
        this.contentDOM.className = b('content');
        // `Portal` wraps the toolbar, so the visibility styles target this container.
        this.controlsDOM = this.dom.appendChild(document.createElement('div'));
        this.controlsDOM.className = headerControlsClassName;
        this.controlsDOM.contentEditable = 'false';

        this.renderItem = getReactRendererFromState(view.state).createItem(
            'header-controls',
            this.renderControls.bind(this),
        );
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.dom.classList.remove(...headerClassNames(this.node.attrs).split(' '));
        this.node = node;
        this.updateClassName();
        if (this.settingsOpen) this.renderItem.rerender();
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }

    ignoreMutation(mutation: ViewMutationRecord) {
        return mutation.type !== 'selection' && !this.contentDOM.contains(mutation.target);
    }

    stopEvent(event: Event) {
        const {target} = event;
        return target instanceof Element && target.closest(`.${STOP_EVENT_CLASSNAME}`) !== null;
    }

    private updateClassName() {
        this.dom.classList.add(b(), ...headerClassNames(this.node.attrs).split(' '));
    }

    private readonly openSettings = () => {
        this.settingsOpen = true;
        this.renderItem.rerender();
    };

    private readonly closeSettings = () => {
        this.settingsOpen = false;
        this.renderItem.rerender();
        (headerControlButtons(this.dom)[0] ?? this.view).focus();
    };

    private run(command: (pos: number) => Command) {
        const pos = this.getPos();
        if (pos !== undefined) command(pos)(this.view.state, this.view.dispatch);
    }

    private readonly changeDimensions = (attrs: Partial<HeaderDimensions>) =>
        this.run((pos) => setHeaderDimensions(pos, attrs));

    private readonly changeTitle = (attrs: Partial<HeaderTitleAttrs>) =>
        this.run((pos) => setHeaderTitleAttrs(pos, attrs));

    private readonly changeTextVisibility = (slot: keyof HeaderTextAttrs, visible: boolean) =>
        this.run((pos) => setHeaderTextVisibility(pos, slot, visible));

    private renderControls() {
        return (
            <>
                <Portal container={this.controlsDOM}>
                    <HeaderControls
                        view={this.view}
                        getPos={this.getPos}
                        onOpenSettings={this.openSettings}
                    />
                </Portal>
                {this.settingsOpen &&
                    // uikit `Portal` makes the panel controls untabbable once focus leaves the panel.
                    createPortal(
                        <HeaderSettings
                            dimensions={headerDimensions(this.node.attrs)}
                            onChange={this.changeDimensions}
                            onClose={this.closeSettings}
                        >
                            <TextSettings
                                header={this.node}
                                onTitleChange={this.changeTitle}
                                onVisibilityChange={this.changeTextVisibility}
                            />
                        </HeaderSettings>,
                        this.dom,
                    )}
            </>
        );
    }
}
