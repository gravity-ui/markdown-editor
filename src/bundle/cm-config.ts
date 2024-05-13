import type CodeMirror from 'codemirror';
import {Pass} from 'codemirror';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/edit/continuelist';
// import 'codemirror/addon/fold/foldcode';
// import 'codemirror/addon/fold/foldgutter';
// import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/addon/fold/markdown-fold';
// import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/markdown/markdown';

import {logger} from '../logger';
import {
    insertLink,
    toCodeBlock,
    toH1,
    toH2,
    toH3,
    toH4,
    toH5,
    toH6,
    toInlineCode,
    wrapToBold,
    wrapToCut,
    wrapToItalic,
    wrapToNote,
    wrapToStrike,
    wrapToUnderline,
} from '../markup/commands';
import {Action as A, formatter as f} from '../shortcuts';

import {ActionName} from './config/action-names';

import 'codemirror/lib/codemirror.css';

export const config: CodeMirror.EditorConfiguration = {
    lineNumbers: false,
    lineWrapping: true,
    // foldGutter: true,
    mode: 'text/markdown',
    viewportMargin: Infinity,
    // gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList',
        Home: 'goLineLeft',
        End: 'goLineRight',
        [f.toCM(A.Bold)!]: withLogger(ActionName.bold, wrapToBold),
        [f.toCM(A.Italic)!]: withLogger(ActionName.italic, wrapToItalic),
        [f.toCM(A.Strike)!]: withLogger(ActionName.strike, wrapToStrike),
        [f.toCM(A.Underline)!]: withLogger(ActionName.underline, wrapToUnderline),
        [f.toCM(A.Link)!]: withLogger(ActionName.link, insertLink({url: ''})),
        [f.toCM(A.Heading1)!]: withLogger(ActionName.heading1, toH1),
        [f.toCM(A.Heading2)!]: withLogger(ActionName.heading2, toH2),
        [f.toCM(A.Heading3)!]: withLogger(ActionName.heading3, toH3),
        [f.toCM(A.Heading4)!]: withLogger(ActionName.heading4, toH4),
        [f.toCM(A.Heading5)!]: withLogger(ActionName.heading5, toH5),
        [f.toCM(A.Heading6)!]: withLogger(ActionName.heading6, toH6),
        [f.toCM(A.Code)!]: withLogger(ActionName.code_inline, toInlineCode),
        [f.toCM(A.CodeBlock)!]: withLogger(ActionName.code_block, toCodeBlock),
        [f.toCM(A.Cut)!]: withLogger(ActionName.yfm_cut, wrapToCut),
        [f.toCM(A.Note)!]: withLogger(ActionName.yfm_note, wrapToNote),
    },
    // styleActiveLine: true,
    addModeClass: true,
};

type CMCommand = (instance: CodeMirror.Editor) => void | typeof CodeMirror.Pass;

export function withLogger(action: string, command: CMCommand): CMCommand {
    return (...args) => {
        const res = command(...args);
        if (res !== Pass) {
            logger.action({mode: 'markup', source: 'keymap', action});
        }
        return res;
    };
}
