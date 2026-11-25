import {ErrorLoggerBoundary, cn, getReactRendererFromState} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {Decoration, EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {type LinkParser, buttonAttrs} from '@gravity-ui/markdown-plugin-banner';

import {syncDomAttrs} from '../../../utils/nodeview';
import {ButtonNodeAttr} from '../ButtonSpecs';
import {buttonLabel} from '../ButtonSpecs/utils';
import {hasButtonSettings, setButtonSettingsOpen} from '../plugins/ButtonSettingsPlugin';

import {ButtonSettings} from './components/ButtonSettings';

import './NodeView.scss';

const b = cn('button-nodeview');

type DomAttrs = Record<string, string>;
type GetPos = () => number | undefined;
type RenderItem = ReturnType<ReturnType<typeof getReactRendererFromState>['createItem']>;

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: GetPos;
    private readonly parser: LinkParser;
    private attrs: DomAttrs = {};
    private settingsOpen = false;
    private settings: RenderItem | null = null;

    constructor(
        node: Node,
        view: EditorView,
        getPos: GetPos,
        parser: LinkParser,
        decorations: readonly Decoration[] = [],
    ) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.parser = parser;
        this.dom = document.createElement('a');
        this.dom.classList.add(b());
        // A link with an address is a Tab stop inside the editor.
        this.dom.tabIndex = -1;
        this.dom.setAttribute('aria-haspopup', 'dialog');
        this.renderAttrs();
        this.renderLabel();
        this.dom.addEventListener('mousedown', this.handleMouseDown);
        this.dom.addEventListener('click', this.handleClick);
        this.renderSettings(decorations);
    }

    update(node: Node, decorations: readonly Decoration[]) {
        if (node.type !== this.node.type) return false;
        const prev = this.node;
        this.node = node;
        if (!node.sameMarkup(prev)) {
            this.renderAttrs();
            if (node.attrs[ButtonNodeAttr.Label] !== prev.attrs[ButtonNodeAttr.Label]) {
                this.renderLabel();
            }
        }
        this.renderSettings(decorations);
        return true;
    }

    destroy() {
        this.dom.removeEventListener('mousedown', this.handleMouseDown);
        this.dom.removeEventListener('click', this.handleClick);
        this.settings?.remove();
    }

    private renderAttrs() {
        const attrs: DomAttrs = buttonAttrs(this.node.attrs);
        // A link without an address has no role.
        if (!(ButtonNodeAttr.Href in attrs)) attrs.role = 'button';
        syncDomAttrs(this.dom, this.attrs, attrs);
        this.attrs = attrs;
    }

    private renderLabel() {
        if (this.node.attrs[ButtonNodeAttr.Label].trim()) {
            this.dom.textContent = buttonLabel(this.node);
            return;
        }
        const placeholder = document.createElement('span');
        placeholder.className = b('placeholder');
        placeholder.textContent = buttonLabel(this.node);
        this.dom.replaceChildren(placeholder);
    }

    private handleMouseDown = (event: MouseEvent) => {
        const pos = this.getPos();
        if (event.button !== 0 || pos === undefined) return;
        // The editor skips a prevented event, so the click does not move the cursor.
        event.preventDefault();
        const {state} = this.view;
        const tr = state.tr.setSelection(NodeSelection.create(state.doc, pos));
        this.view.dispatch(setButtonSettingsOpen(tr, true));
    };

    private handleClick = (event: MouseEvent) => event.preventDefault();

    private handleSettingsClose = (reason?: string) => {
        this.view.dispatch(setButtonSettingsOpen(this.view.state.tr, false));
        if (reason !== 'outside-press') this.view.focus();
    };

    private renderSettings(decorations: readonly Decoration[]) {
        this.settingsOpen = hasButtonSettings(decorations);
        if (this.settingsOpen && !this.settings) {
            this.settings = getReactRendererFromState(this.view.state).createItem(
                'button-settings',
                () => this.renderSettingsWindow(),
            );
        }
        this.settings?.rerender();
    }

    private renderSettingsWindow() {
        if (!this.settingsOpen) return null;
        return (
            <ErrorLoggerBoundary>
                <ButtonSettings
                    view={this.view}
                    node={this.node}
                    getPos={this.getPos}
                    anchor={this.dom}
                    parser={this.parser}
                    onClose={this.handleSettingsClose}
                />
            </ErrorLoggerBoundary>
        );
    }
}
