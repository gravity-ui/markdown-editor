// ::- A specification for serializing a ProseMirror document as
// Markdown/CommonMark text.
// prettier-ignore
import type {Mark, Node} from "prosemirror-model";

import type {MarkdownSerializerDynamicModifier} from './MarkdownSerializerDynamicModifier';

export interface SerializerNodeToken {
    (state: MarkdownSerializerState, node: Node, parent: Node, index: number): void;
}

export interface SerializerMarkToken {
    open:
        | string
        | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
    close:
        | string
        | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
    mixable?: boolean;
    expelEnclosingWhitespace?: boolean;
    escape?: boolean;
}

interface SerializerOptions {
    tightLists?: boolean;
    escapeExtraCharacters?: RegExp;
    hardBreakNodeName?: string;
    strict?: boolean;
    commonEscape?: RegExp;
    startOfLineEscape?: RegExp;
    escape?: boolean; // Added to fix types
}

function regexpEqual(a?: RegExp, b?: RegExp): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.source === b.source && a.flags === b.flags;
}

function optionsEqual(a: Partial<SerializerOptions>, b: Partial<SerializerOptions>): boolean {
    return (
        a.tightLists === b.tightLists &&
        a.strict === b.strict &&
        a.escape === b.escape &&
        a.hardBreakNodeName === b.hardBreakNodeName &&
        regexpEqual(a.commonEscape, b.commonEscape) &&
        regexpEqual(a.startOfLineEscape, b.startOfLineEscape) &&
        regexpEqual(a.escapeExtraCharacters, b.escapeExtraCharacters)
    );
}

const blankMark: SerializerMarkToken = {open: '', close: '', mixable: false};

interface MarkMap {
    [markName: string]: SerializerMarkToken;
}

interface NodeMap {
    [nodeName: string]: SerializerNodeToken;
}

export class MarkdownSerializer {
    private readonly nodes: NodeMap;
    private readonly marks: MarkMap;
    private readonly dynamicModifier?: MarkdownSerializerDynamicModifier;

    private _lastNode: Node | null = null;
    private _lastOptions: Partial<SerializerOptions> = {};
    private _lastResult = '';

    // :: (Object<(state: MarkdownSerializerState, node: Node, parent: Node, index: number)>, Object)
    // Construct a serializer with the given configuration. The `nodes`
    // object should map node names in a given schema to function that
    // take a serializer state and such a node, and serialize the node.
    //
    // The `marks` object should hold objects with `open` and `close`
    // properties, which hold the strings that should appear before and
    // after a piece of text marked that way, either directly or as a
    // function that takes a serializer state and a mark, and returns a
    // string. `open` and `close` can also be functions, which will be
    // called as
    //
    //     (state: MarkdownSerializerState, mark: Mark,
    //      parent: Fragment, index: number) → string
    //
    // Where `parent` and `index` allow you to inspect the mark's
    // context to see which nodes it applies to.
    //
    // Mark information objects can also have a `mixable` property
    // which, when `true`, indicates that the order in which the mark's
    // opening and closing syntax appears relative to other mixable
    // marks can be varied. (For example, you can say `**a *b***` and
    // `*a **b***`, but not `` `a *b*` ``.)
    //
    // To disable character escaping in a mark, you can give it an
    // `escape` property of `false`. Such a mark has to have the highest
    // precedence (must always be the innermost mark).
    //
    // The `expelEnclosingWhitespace` mark property causes the
    // serializer to move enclosing whitespace from inside the marks to
    // outside the marks. This is necessary for emphasis marks as
    // CommonMark does not permit enclosing whitespace inside emphasis
    // marks, see: http://spec.commonmark.org/0.26/#example-330
    constructor(
        nodes: NodeMap,
        marks: MarkMap,
        dynamicModifier?: MarkdownSerializerDynamicModifier,
    ) {
        // :: Object<(MarkdownSerializerState, Node)> The node serializer
        // functions for this serializer.
        this.nodes = nodes;
        // :: Object The mark serializer info.
        this.marks = marks;

        this.dynamicModifier = dynamicModifier;
    }

    // :: (Node, ?Object) → string
    // Serialize the content of the given node to
    // [CommonMark](http://commonmark.org/).
    serialize(content: Node, options: Partial<SerializerOptions> = {}): string {
        if (
            this._lastNode === content &&
            (this._lastOptions === options || optionsEqual(this._lastOptions, options))
        ) {
            return this._lastResult;
        }

        const savedOptions = {...options};

        const state = new MarkdownSerializerState(
            this.nodes,
            this.marks,
            options,
            this.dynamicModifier,
        );
        state.renderContent(content);

        this._lastNode = content;
        this._lastOptions = savedOptions;
        this._lastResult = state.out;

        return state.out;
    }

    clearCache(): void {
        this._lastNode = null;
        this._lastOptions = {};
        this._lastResult = '';
    }

    // for tests (implements SerializerTests interface)
    containsNode(nodeName: string): boolean {
        return nodeName in this.nodes;
    }

    // for tests (implements SerializerTests interface)
    containsMark(markName: string): boolean {
        return markName in this.marks;
    }
}

// ::- This is an object used to track state and expose
// methods related to markdown serialization. Instances are passed to
// node and mark serialization methods (see `toMarkdown`).
// prettier-ignore
export class MarkdownSerializerState {
    out: string;
    inTightList: boolean;
    noAutoBlank: boolean;
    isAutolink: boolean | undefined;
    atBlockStart: boolean;
    escapeWhitespace: boolean;
    escapeCharacters?: string[];

    private readonly nodes: NodeMap;
    private readonly marks: MarkMap;
    private readonly options: SerializerOptions;
    private delim: string;
    private closed: Node | false;
    private readonly dynamicModifier?: MarkdownSerializerDynamicModifier;

    constructor(nodes: NodeMap, marks: MarkMap, options: Partial<SerializerOptions> = {}, dynamicModifier?: MarkdownSerializerDynamicModifier) {
        this.nodes = nodes;
        this.marks = marks;
        this.delim = this.out = '';
        this.closed = false;
        this.inTightList = false;
        this.noAutoBlank = false;
        this.isAutolink = undefined;
        this.atBlockStart = false;
        this.escapeWhitespace = false;
        // :: Object
        // The options passed to the serializer.
        //   tightLists:: ?bool
        //   Whether to render lists in a tight style. This can be overridden
        //   on a node level by specifying a tight attribute on the node.
        //   Defaults to false.
        this.options = options || {};
        this.dynamicModifier = dynamicModifier;
        if (typeof this.options.tightLists === 'undefined') { this.options.tightLists = false }
    }

    setNoAutoBlank() {
        this.noAutoBlank = true;
    }

    unsetNoAutoBlank() {
        this.noAutoBlank = false;
    }

    flushClose(size?: number | null) {
        if (this.closed) {
            if (!this.atBlank() && !this.noAutoBlank) this.out += '\n';
            if (size === null || size === undefined) size = 2;
            if (size > 1) {
                let delimMin = this.delim;
                const trim = /\s+$/.exec(delimMin);
                if (trim) delimMin = delimMin.slice(0, delimMin.length - trim[0].length);

                if (!this.noAutoBlank) {
                    for (let i = 1; i < size; i++) { this.out += delimMin + '\n' }
                }
            }
            this.closed = false;
        }
    }

    // :: (string, ?string, Node, ())
    // Render a block, prefixing each line with `delim`, and the first
    // line in `firstDelim`. `node` should be the node that is closed at
    // the end of the block, and `f` is a function that renders the
    // content of the block.
    wrapBlock(delim: string, firstDelim: string | null, node: Node, f: () => void) {
        const old = this.delim;
        this.write(firstDelim || delim);
        this.delim += delim;
        f();
        this.delim = old;
        this.closeBlock(node);
    }

    atBlank(): boolean {
        return /(^|\n)$/.test(this.out);
    }

    // :: ()
    // Ensure the current content ends with a newline.
    ensureNewLine() {
        if (!this.atBlank()) this.out += '\n';
    }

    // :: (?string)
    // Prepare the state for writing output (closing closed paragraphs,
    // adding delimiters, and so on), and then optionally add content
    // (unescaped) to the output.
    write(content?: string | null): void {
        this.flushClose();
        if (this.delim && this.atBlank()) { this.out += this.delim }
        if (content) this.out += content;
    }

    // :: (Node)
    // Close the block for the given node.
    closeBlock(node?: Node) {
        this.closed = node ?? false;
    }

    // :: (string, ?bool)
    // Add the given text to the document. When escape is not `false`,
    // it will be escaped.
    text(text: string, escape?: boolean) {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            this.write();
            // Escape ! before [ to prevent being parsed as image syntax
            if (escape === false && lines[i][0] === '[' && /(^|[^\\])!$/.test(this.out))
                this.out = this.out.slice(0, this.out.length - 1) + '\\!';
            let text = lines[i];
            if (escape !== false && this.options.escape !== false) text = this.esc(text, this.atBlockStart)
            if (this.escapeWhitespace) text = this.escWhitespace(text);
            this.out += text
            if (i != lines.length - 1) this.out += '\n';
        }
    }

    // :: (Node)
    // Render the given node as a block.
    render(node: Node, parent: Node, index: number) {
        if (typeof parent === 'number') {
            throw new Error('!');
        }

        const callback = this.nodes[node.type.name];
        if (callback) {
            if (this.dynamicModifier) {
                this.dynamicModifier.processNode(this, node, parent, index, callback);
            } else {
                callback(this, node, parent, index);
            }
        } else if (this.options.strict !== false) {
                throw new Error('Token type `' + node.type.name + '` not supported by Markdown renderer');
            } else if (!node.type.isLeaf) {
                if (node.type.inlineContent) this.renderInline(node);
                else this.renderContent(node);
                if (node.isBlock) this.closeBlock(node);
            }
    }

    // :: (Node)
    // Render the contents of `parent` as block nodes.
    renderContent(parent: Node) {
        parent.forEach((node, _, i) => this.render(node, parent, i));
    }

    // Render the contents of `parent` as inline content.
    renderInline(parent: Node, fromBlockStart = true) {
        this.atBlockStart = fromBlockStart;
        const active: Mark[] = [];
        let trailing = '';
        const progress = (node: Node | null, _: any, index: number) => {
            let marks = node ? node.marks : [];

            // Remove marks from breaks (hard_break or soft_break) that are the edge node inside
            // that mark to prevent parser edge cases with new lines just
            // before closing or after opening marks.
            if (node && node.type.spec.isBreak) {
                marks = marks.filter((m) => {
                    if (index === 0) return false;
                    if (index + 1 === parent.childCount) return false;
                    const prev = parent.child(index - 1);
                    const next = parent.child(index + 1);
                    return (
                        (m.isInSet(prev.marks) && (!prev.isText || /\S/.test(prev.text ?? ''))) &&
                        (m.isInSet(next.marks) && (!next.isText || /\S/.test(next.text ?? '')))
                    );
                });
            }

            let leading = trailing;
            trailing = '';
            // If whitespace has to be expelled from the node, adjust
            // leading and trailing accordingly.
            if (node && node.isText && marks.some((mark) => {
                const info = this.getMark(mark.type.name);
                return info && info.expelEnclosingWhitespace && !mark.isInSet(active);
            })) {
                const [_, lead, rest] = /^(\s*)(.*)$/m.exec(node.text!)!;
                if (lead) {
                    leading += lead;
                    node = rest ? (node as any).withText(rest) : null;
                    if (!node) marks = active;
                }
            }
            if (node && node.isText && marks.some((mark) => {
                const info = this.getMark(mark.type.name);
                return info && info.expelEnclosingWhitespace && !this.isMarkAhead(parent, index + 1, mark);
            })) {
                const [_, rest, trail] = /^(.*?)(\s*)$/m.exec(node.text!)!;
                if (trail) {
                    trailing = trail;
                    node = rest ? (node as any).withText(rest) : null;
                    if (!node) marks = active;
                }
            }

            const inner = marks.length && marks[marks.length - 1];
            const noEsc = inner && this.getMark(inner.type.name).escape === false;
            const len = marks.length - (noEsc ? 1 : 0);

            // Try to reorder 'mixable' marks, such as em and strong, which
            // in Markdown may be opened and closed in different order, so
            // that order of the marks for the token matches the order in
            // active.
            // eslint-disable-next-line  no-labels
            outer: for (let i = 0; i < len; i++) {
                const mark = marks[i];
                if (!this.getMark(mark.type.name).mixable) break;
                for (let j = 0; j < active.length; j++) {
                    const other = active[j];
                    if (!this.getMark(other.type.name).mixable) break;
                    if (mark.eq(other)) {
                        if (i > j) {
                            marks = marks.slice(0, j).concat(mark).concat(marks.slice(j, i)).concat(marks.slice(i + 1, len))
                        }
                        else if (j > i) {
                            marks = marks.slice(0, i).concat(marks.slice(i + 1, j)).concat(mark).concat(marks.slice(j, len))
                        }
                        // eslint-disable-next-line no-labels
                        continue outer;
                    }
                }
            }

            // Find the prefix of the mark set that didn't change
            let keep = 0;
            while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) ++keep;

            // Close the marks that need to be closed
            while (keep < active.length) {
                this.text(this.markString(active.pop()!, false, parent, index), false)
            }

            // Output any previously expelled trailing whitespace outside the marks
            if (leading) this.text(leading)

            // Open the marks that need to be opened
            if (node) {
                while (active.length < len) {
                    const add = marks[active.length];
                    active.push(add);
                    this.text(this.markString(add, true, parent, index), false);
                    this.atBlockStart = false;
                }

                // Render the node. Special case code marks, since their content
                // may not be escaped.
                if (noEsc && node.isText) {
                    this.text(this.markString(inner, true, parent, index) + node.text +
                      this.markString(inner, false, parent, index + 1), false);
                } else {
                    this.render(node, parent, index)
                }
                this.atBlockStart = false;
            }

            // After the first non-empty text node is rendered, the end of output
            // is no longer at block start.
            //
            // FIXME: If a non-text node writes something to the output for this
            // block, the end of output is also no longer at block start. But how
            // can we detect that?
            if (node?.isText && node.nodeSize > 0) {
                this.atBlockStart = false;
            }
        };
        parent.forEach(progress);
        progress(null, null, parent.childCount);
        this.atBlockStart = false;
    }

    // :: (Node, string, (number) → string)
    // Render a node's content as a list. `delim` should be the extra
    // indentation added to all lines except the first in an item,
    // `firstDelim` is a function going from an item index to a
    // delimiter for the first line of the item.
    renderList(node: Node, delim: string, firstDelim: (index: number, firstDelimNode: Node) => string): void {
        if (this.closed && this.closed.type == node.type) { this.flushClose(3) } else if (this.inTightList) { this.flushClose(1) }

        const isTight = typeof node.attrs.tight !== 'undefined' ? node.attrs.tight : this.options.tightLists;
        const prevTight = this.inTightList;
        this.inTightList = isTight;
        node.forEach((child: any, _: any, i: any) => {
            if (i && isTight) this.flushClose(1);
            this.wrapBlock(delim, firstDelim(i, child), node, () => this.render(child, node, i))
        });
        this.inTightList = prevTight;
    }

    // :: (string, ?bool) → string
    // Escape the given string so that it can safely appear in Markdown
    // content. If `startOfLine` is true, also escape characters that
    // have special meaning only at the start of the line.
    esc(str: string, startOfLine = false) {
        // eslint-disable-next-line no-useless-escape
        const defaultEsc = /[`\^+*\\\|~\[\]\{\}<>\$]/g;
        const extraChars = this.escapeCharacters?.length ? this.escapeCharacters.map(c => '\\' + c).join('') : '';
        const escRegexp = this.options?.commonEscape ||
            // Compose the escape regexp from default, options, and extra characters
            new RegExp(defaultEsc.source + (extraChars ? `|[${extraChars}]` : ''), 'g');

        const startOfLineEscRegexp = this.options?.startOfLineEscape || /^[:#\-*+>]/;

        str = str.replace(escRegexp, '\\$&');
        // Smart underscore: don't escape _ between word characters (e.g. foo_bar)
        str = str.replace(/_/g, (m, i) =>
            i > 0 && i + 1 < str.length && /\w/.test(str[i - 1]) && /\w/.test(str[i + 1])
                ? m
                : '\\' + m
        );
        if (startOfLine) str = str.replace(startOfLineEscRegexp, '\\$&').replace(/^(\s*\d+)\./, '$1\\.');
        return str;
    }

    escWhitespace(str: string): string {
        return str.replace(/ /g, '\\ ');
    }

    /// @internal
    quote(str: string): string {
        const wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : '()';
        return wrap[0] + str + wrap[1];
    }

    // :: (string, number) → string
    // Repeat the given string `n` times.
    repeat(str: string, n: number) {
        let out = '';
        for (let i = 0; i < n; i++) out += str;
        return out;
    }

    // :: (Mark, bool, string?) → string
    // Get the markdown string for a given opening or closing mark.
    markString(mark: Mark, open: boolean, parent: Node, index: number): string {
        const info = this.getMark(mark.type.name);
        const value = open ? info.open : info.close;
        return typeof value === 'string' ? value : value(this, mark, parent, index);
    }

    // :: (string) → { leading: ?string, trailing: ?string }
    // Get leading and trailing whitespace from a string. Values of
    // leading or trailing property of the return object will be undefined
    // if there is no match.
    getEnclosingWhitespace(text: string) {
        return {
            leading: (text.match(/^(\s+)/) || [])[0],
            trailing: (text.match(/(\s+)$/) || [])[0],
        };
    }

    private isMarkAhead(parent: Node, index: number, mark: Mark): boolean {
        for (;; index++) {
            if (index >= parent.childCount) return false;
            const next = parent.child(index);
            if (!next.type.spec.isBreak) return Boolean(mark.isInSet(next.marks));
        }
    }

    // Get mark info by name, with fallback to blankMark when strict mode is off.
    private getMark(name: string): SerializerMarkToken {
        const info = this.marks[name];
        if (!info) {
            if (this.options.strict !== false)
                throw new Error(`Mark type \`${name}\` not supported by Markdown renderer`);
            return blankMark;
        }
        return info;
    }
}
