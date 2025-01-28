/* eslint-disable */

import {type Fragment, Mark, Node} from 'prosemirror-model';

import {SerializerState} from '../types/serializer';

function isNode(value: Node | Fragment): value is Node {
    return (value as Node).type !== undefined;
}

export interface MarkdownSerializerOptions {
    tightLists?: boolean;
    escape?: boolean;
    commonEscape?: RegExp;
    startOfLineEscape?: RegExp;
}

type Nodes = {
    [key: string]: SerializerNodeToken;
};

type Marks = {
    [key: string]: SerializerMarkToken;
};

export interface SerializerNodeToken {
    (state: SerializerState, node: Node, parent: Node, index: number): void;
}

export interface SerializerMarkToken {
    open:
        | string
        | ((state: SerializerState, node: Mark, parent: Fragment, index: number) => string);
    close:
        | string
        | ((state: SerializerState, node: Mark, parent: Fragment, index: number) => string);
    mixable?: boolean;
    escape?: boolean;
    expelEnclosingWhitespace?: boolean;
}

// ::- A specification for serializing a ProseMirror document as
// Markdown/CommonMark text.
// prettier-ignore
export class MarkdownSerializer {
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
    // marks, see: http://spec.commonmark.org/0.26/#example-330private
    private nodes: Nodes;
    private marks: Marks;

    constructor(
        nodes: Nodes,
        marks: Marks
    ) {
        this.nodes = nodes;
        this.marks = marks;
    }

    // :: (Node, ?Object) → string
    // Serialize the content of the given node to
    // [CommonMark](http://commonmark.org/).
    serialize(content: Node, options?: MarkdownSerializerOptions): string {
        const state = new MarkdownSerializerState(this.nodes, this.marks, options);
        state.renderContent(content);
        return state.out;
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
    public delim: string = '';
    public out: string = '';
    public closed: Node | false = false;
    public inTightList: boolean = false;
    public noAutoBlank: boolean = false;
    public isAutolink: boolean | undefined = undefined;
    public escapeWhitespace: boolean = false;
    public options: MarkdownSerializerOptions;

    constructor(
        public nodes: Nodes,
        public marks: Marks,
        options?: MarkdownSerializerOptions
    ) {
        this.options = options || {};
        if (typeof this.options.tightLists === 'undefined') { this.options.tightLists = false }
    }

    setNoAutoBlank(): void {
        this.noAutoBlank = true;
    }

    unsetNoAutoBlank(): void {
        this.noAutoBlank = false;
    }

    flushClose(size?: number): void {
        if (this.closed) {
            if (!this.atBlank() && !this.noAutoBlank) this.out += '\n';
            if (size == null) size = 2;
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
    wrapBlock(delim: string, firstDelim: string | null, node: Node, f: () => void): void {
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
    ensureNewLine(): void {
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
    closeBlock(node?: Node): void {
        this.closed = node ?? false;
    }

    // :: (string, ?bool)
    // Add the given text to the document. When escape is not `false`,
    // it will be escaped.
    text(text?: string, escape?: boolean): void {
        const lines = text?.split('\n') ?? '';
        for (let i = 0; i < lines.length; i++) {
            const startOfLine = this.atBlank() || this.closed;
            this.write();
            let text = lines[i];
            if (escape !== false && this.options.escape !== false) text = this.esc(text, startOfLine)
            if (this.escapeWhitespace) text = this.escWhitespace(text);
            this.out += text
            if (i != lines.length - 1) this.out += '\n';
        }
    }

    // :: (Node)
    // Render the given node as a block.
    render(node: Node, parent: Node, index: number): void {
        if (typeof parent === 'number') throw new Error('!');
        if (!this.nodes[node.type.name]) throw new Error('Token type `' + node.type.name + '` not supported by Markdown renderer');
        this.nodes[node.type.name](this, node, parent, index);
    }

    // :: (Node)
    // Render the contents of `parent` as block nodes.
    renderContent(parent: Node): void {
        parent.forEach((node, _, i) => this.render(node, parent, i));
    }

    // :: (Node)
    // Render the contents of `parent` as inline content.
    renderInline(parent: Node) {
        const active: Mark[] = [];
        let trailing = '';
        const progress = (node: Node | null, _: number | null, index: number) => {
            let marks = node ? node.marks : [];_

            // Remove marks from breaks (hard_break or soft_break) that are the edge node inside
            // that mark to prevent parser edge cases with new lines just
            // before closing or after opening marks.
            if (node && node.type.spec.isBreak) {
                marks = marks.filter(m => {
                    if (index === 0) return false;
                    if (index + 1 == parent.childCount) return false;
                    const prev = parent.child(index - 1);
                    const next = parent.child(index + 1);
                    return (
                        (m.isInSet(prev.marks) && (!prev.isText || prev.text && /\S/.test(prev.text))) &&
                        (m.isInSet(next.marks) && (!next.isText || next.text && /\S/.test(next.text)))
                    );
                });
            }

            let leading = trailing;
            trailing = '';
            // If whitespace has to be expelled from the node, adjust
            // leading and trailing accordingly.
            if (node && node.isText && marks.some(mark => {
                const info = this.marks[mark.type.name];
                return info && info.expelEnclosingWhitespace;
            })) {
                if (node.text) {
                    const result = /^(\s*)(.*?)(\s*)$/m.exec(node.text);
                    if (result) {
                        const [_, lead, inner, trail] = result;
                        leading += lead;
                        trailing = trail;
                        if (lead || trail) {
                            // FIXME: There is no withText method in type Node
                            node = inner ? (node as any).withText(inner) : null;
                            if (!node) marks = active;
                        }
                    }
                }
            }

            const inner = marks.length && marks[marks.length - 1];
            const noEsc = inner && this.marks[inner.type.name].escape === false;
            const len = marks.length - (noEsc ? 1 : 0);

            // Try to reorder 'mixable' marks, such as em and strong, which
            // in Markdown may be opened and closed in different order, so
            // that order of the marks for the token matches the order in
            // active.
            outer: for (let i = 0; i < len; i++) {
                const mark = marks[i];
                if (!this.marks[mark.type.name].mixable) break;
                for (let j = 0; j < active.length; j++) {
                    const other = active[j];
                    if (!this.marks[other.type.name].mixable) break;
                    if (mark.eq(other)) {
                        if (i > j) { marks = marks.slice(0, j).concat(mark).concat(marks.slice(j, i)).concat(marks.slice(i + 1, len)) } else if (j > i) { marks = marks.slice(0, i).concat(marks.slice(i + 1, j)).concat(mark).concat(marks.slice(j, len)) }
                        continue outer;
                    }
                }
            }

            // Find the prefix of the mark set that didn't change
            let keep = 0;
            while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) ++keep;

            // Close the marks that need to be closed
            while (keep < active.length) {
                const mark = active.pop();
                if (mark) {
                    this.text(this.markString(mark, false, parent, index), false)
                }
            }

            // Output any previously expelled trailing whitespace outside the marks
            if (leading) this.text(leading);

            // Open the marks that need to be opened
            if (node) {
                while (active.length < len) {
                    const add = marks[active.length];
                    active.push(add);
                    this.text(this.markString(add, true, parent, index), false);
                }

                // Render the node. Special case code marks, since their content
                // may not be escaped.
                if (noEsc && node.isText) {
                    this.text(this.markString(inner, true, parent, index) + node.text +
                      this.markString(inner, false, parent, index + 1), false);
                } else { this.render(node, parent, index) }
            }
        };
        parent.forEach(progress);
        progress(null, null, parent.childCount);
    }

    // :: (Node, string, (number) → string)
    // Render a node's content as a list. `delim` should be the extra
    // indentation added to all lines except the first in an item,
    // `firstDelim` is a function going from an item index to a
    // delimiter for the first line of the item.
    renderList(node: Node, delim: string, firstDelim: (index: number, node: Node) => string): void {
        if (this.closed && this.closed.type == node.type) { this.flushClose(3) } else if (this.inTightList) { this.flushClose(1) }

        const isTight = typeof node.attrs.tight !== 'undefined' ? node.attrs.tight : this.options.tightLists;
        const prevTight = this.inTightList;
        this.inTightList = isTight;
        node.forEach((child, _, i) => {
            if (i && isTight) this.flushClose(1);
            this.wrapBlock(delim, firstDelim(i, child), node, () => this.render(child, node, i));
        });
        this.inTightList = prevTight;
    }

    // :: (string, ?bool) → string
    // Escape the given string so that it can safely appear in Markdown
    // content. If `startOfLine` is true, also escape characters that
    // have special meaning only at the start of the line.
    esc(str: string, startOfLine?: boolean | Node): string {
        const escRegexp = this.options?.commonEscape || /[`\^+*\\\|~\[\]\{\}<>\$_]/g;
        const startOfLineEscRegexp = this.options?.startOfLineEscape || /^[:#\-*+>]/;

        str = str.replace(escRegexp, '\\$&');
        if (startOfLine) str = str.replace(startOfLineEscRegexp, '\\$&').replace(/^(\s*\d+)\./, '$1\\.');
        return str;
    }

    escWhitespace(str: string): string {
        return str.replace(/ /g, '\\ ');
    }

    quote(str: string): string {
        const wrap = str.indexOf('"') == -1 ? '""' : str.indexOf("'") == -1 ? "''" : '()';
        return wrap[0] + str + wrap[1];
    }

    // :: (string, number) → string
    // Repeat the given string `n` times.
    repeat(str: string, n: number): string {
        let out = '';
        for (let i = 0; i < n; i++) out += str;
        return out;
    }

    // : (Mark, bool, string?) → string
    // Get the markdown string for a given opening or closing mark.
    markString(mark: Mark, open: boolean, parent: Fragment | Node, index: number): string {
        const info = this.marks[mark.type.name];
        const value = open ? info.open : info.close;

        const actualParent = isNode(parent) ? parent.content : parent;

        return typeof value === 'string' ? value : value(this, mark, actualParent, index);
    }

    // :: (string) → { leading: ?string, trailing: ?string }
    // Get leading and trailing whitespace from a string. Values of
    // leading or trailing property of the return object will be undefined
    // if there is no match.
    getEnclosingWhitespace(text: string): { leading?: string, trailing?: string } {
        return {
            leading: (text.match(/^(\s+)/) || [])[0],
            trailing: (text.match(/(\s+)$/) || [])[0],
        };
    }
}
