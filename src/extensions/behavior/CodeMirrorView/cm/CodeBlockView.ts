/* eslint-disable import/no-extraneous-dependencies */
import type {ThemeType} from '@gravity-ui/uikit/build/esm/components/theme/types';
import CodeMirror from 'codemirror';
import 'codemirror/addon/display/placeholder';
import {exitCode, selectAll} from 'prosemirror-commands';
import {redo, undo} from 'prosemirror-history';
import {Fragment, Node} from 'prosemirror-model';
import {Selection, TextSelection} from 'prosemirror-state';
import {EditorView, NodeView, NodeViewConstructor} from 'prosemirror-view';

import type {CodeMirrorViewOptions} from '..';
import {resetCodeblock} from '../../../../extensions/markdown';
import {isFunction} from '../../../../lodash';
import {isMac} from '../../../../utils/platform';
import {createFakeParagraph, findFakeParaPosForTextSelection} from '../../Selection';
import type {WatcherReceiver} from '../YCThemeWatcher';
import {langAttr} from '../const';

import {getModeMIME, modeMimes} from './codemodes';

import 'codemirror/theme/nord.css';
import './CodeBlockView.scss'; // eslint-disable-line import/order

const yc2cmThemeMap: Record<ThemeType, string> = {
    dark: 'nord',
    light: 'default',
};

type ViewOptions = CodeMirrorViewOptions & {
    themeWatcher: WatcherReceiver;
};

export class CodeBlockView implements NodeView {
    static creator =
        (opts: ViewOptions): NodeViewConstructor =>
        (node, view, getPos) => {
            return new this(node, view, getPos, opts);
        };

    dom: HTMLElement;

    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;

    private readonly cm: CodeMirror.Editor;
    private updating: boolean;
    private incomingChanges: boolean;

    private readonly themeWatcher: WatcherReceiver;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined, opts: ViewOptions) {
        // Store for later
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        this.themeWatcher = opts.themeWatcher;

        const {codeBlockPlaceholder} = opts;

        // Create a CodeMirror instance
        this.cm = CodeMirror(
            // @ts-expect-error bad types: 'null' is not assignable to...
            null,
            {
                value: this.node.textContent,
                lineNumbers: false,
                extraKeys: this.codeMirrorKeymap(opts),
                mode: getModeMIME(node.attrs[langAttr]),
                placeholder: isFunction(codeBlockPlaceholder)
                    ? codeBlockPlaceholder()
                    : codeBlockPlaceholder,
                theme: yc2cmThemeMap[this.themeWatcher.type],
            },
        );

        // The editor's outer node is our DOM representation
        this.dom = this.cm.getWrapperElement();
        // CodeMirror needs to be in the DOM to properly initialize, so
        // schedule it to update itself
        setTimeout(() => this.cm.refresh(), 20);

        this.incomingChanges = false;
        // This flag is used to avoid an update loop between the outer and
        // inner editor
        this.updating = false;

        // Track whether changes are have been made but not yet propagated
        this.cm.on('beforeChange', () => {
            this.incomingChanges = true;
        });
        this.cm.on('changes', () => {
            if (!this.updating) {
                this.valueChanged();
                this.forwardSelection();
            }
            this.incomingChanges = false;
        });
        // Propagate updates from the code editor to ProseMirror
        this.cm.on('cursorActivity', () => {
            if (!this.updating && !this.incomingChanges) this.forwardSelection();
        });
        this.cm.on('focus', () => this.forwardSelection());

        this.themeWatcher.on('change-type', this.updateCmTheme);
    }

    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        const change = computeChange(this.cm.getValue(), node.textContent);
        if (change) {
            this.updating = true;
            this.cm.replaceRange(
                change.text,
                this.cm.posFromIndex(change.from),
                this.cm.posFromIndex(change.to),
            );
            this.updating = false;
        }

        this.cm.setOption('mode', modeMimes[node.attrs['data-language']]);

        return true;

        // TODO: update editor's mode if lang attr has been changed
    }

    destroy() {
        this.themeWatcher.off('change-type', this.updateCmTheme);
    }

    selectNode() {
        this.cm.focus();
    }

    setSelection(anchor: number, head: number) {
        this.cm.focus();
        this.updating = true;
        this.cm.setSelection(this.cm.posFromIndex(anchor), this.cm.posFromIndex(head));
        this.updating = false;
    }

    stopEvent() {
        return true;
    }

    private updateCmTheme = (ycThemeType: ThemeType) => {
        const cmTheme = yc2cmThemeMap[ycThemeType];
        if (this.cm.getOption('theme') !== cmTheme) {
            this.cm.setOption('theme', cmTheme);
            this.cm.refresh();
        }
    };

    private forwardSelection() {
        if (!this.cm.hasFocus()) return;
        const {state} = this.view;
        const selection = this.asProseMirrorSelection(state.doc);
        if (!selection.eq(state.selection)) {
            this.view.dispatch(state.tr.setSelection(selection));
        }
    }

    private asProseMirrorSelection(doc: Node) {
        const offset = this.getPos()! + 1;
        const anchor = this.cm.indexFromPos(this.cm.getCursor('anchor')) + offset;
        const head = this.cm.indexFromPos(this.cm.getCursor('head')) + offset;
        return TextSelection.create(doc, anchor, head);
    }

    private valueChanged() {
        const pos = this.getPos();
        const change = computeChange(this.node.textContent, this.cm.getValue());
        if (change && pos !== undefined) {
            const start = pos + 1;
            const {state} = this.view;
            const tr = state.tr.replaceWith(
                start + change.from,
                start + change.to,
                change.text ? state.schema.text(change.text) : Fragment.empty,
            );
            this.view.dispatch(tr);
        }
    }

    private codeMirrorKeymap(opts?: CodeMirrorViewOptions) {
        const view = this.view;
        const mod = isMac() ? 'Cmd' : 'Ctrl';

        const keymap: CodeMirror.KeyMap = {
            Up: () => this.maybeEscape('line', -1),
            Left: () => this.maybeEscape('char', -1),
            Down: () => this.maybeEscape('line', 1),
            Right: () => this.maybeEscape('char', 1),
            'Shift-Enter': () => {
                if (exitCode(view.state, view.dispatch)) view.focus();
            },
            Backspace: () => {
                if (resetCodeblock(view.state, view.dispatch, view)) return view.focus();
                else return CodeMirror.Pass;
            },
            [`${mod}-Z`]: () => undo(view.state, view.dispatch),
            [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
            [`${mod}-Y`]: () => redo(view.state, view.dispatch),
            [`${mod}-A`]: () => this.onAllSelect(),
        };

        if (opts) {
            (
                [
                    [opts.onCancel, 'Esc'],
                    [opts.onSubmit, `${mod}-Enter`],
                ] as const
            ).forEach(([handler, key]) => {
                if (handler) {
                    keymap[key] = () => {
                        if (!handler()) return CodeMirror.Pass;
                        return;
                    };
                }
            });
        }

        return CodeMirror.normalizeKeyMap(keymap);
    }

    private onAllSelect() {
        const sels = this.cm.listSelections();
        if (sels.length !== 1) {
            return CodeMirror.Pass;
        }

        const [sel] = sels;
        const from = sel.from();
        const to = sel.to();

        const isDocStart = from.line === this.cm.firstLine() && from.ch === 0;
        const isDocEnd =
            to.line === this.cm.lastLine() && to.ch === this.cm.getLine(this.cm.lastLine()).length;

        const isAllSelection = isDocStart && isDocEnd;

        if (!isAllSelection) {
            return CodeMirror.Pass;
        }

        // select all prosemirror doc, when all codemirror doc already selected
        this.cm.setSelection(from);
        selectAll(this.view.state, this.view.dispatch);
        this.view.focus();
        return;
    }

    private maybeEscape(unit: 'line' | 'char', dir: -1 | 1) {
        const pos = this.cm.getCursor();
        if (
            this.cm.somethingSelected() ||
            pos.line !== (dir < 0 ? this.cm.firstLine() : this.cm.lastLine()) ||
            (unit === 'char' && pos.ch !== (dir < 0 ? 0 : this.cm.getLine(pos.line).length))
        )
            return CodeMirror.Pass;

        const direction = dir < 0 ? 'before' : 'after';
        const $pos = findFakeParaPosForTextSelection(
            this.view.state.selection as TextSelection,
            direction,
        );
        if ($pos) {
            const {tr} = this.view.state;
            createFakeParagraph(tr, $pos, direction);
            this.view.dispatch(tr.scrollIntoView());
        } else {
            const pos = this.getPos();
            if (pos !== undefined) {
                const targetPos = pos + (dir < 0 ? 0 : this.node.nodeSize);
                const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir);
                this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
            }
        }

        this.view.focus();

        return null;
    }
}

function computeChange(oldVal: string, newVal: string) {
    if (oldVal === newVal) return null;
    let start = 0,
        oldEnd = oldVal.length,
        newEnd = newVal.length;
    while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) ++start;
    while (
        oldEnd > start &&
        newEnd > start &&
        oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)
    ) {
        oldEnd--;
        newEnd--;
    }
    return {from: start, to: oldEnd, text: newVal.slice(start, newEnd)};
}
