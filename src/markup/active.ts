import type CodeMirror from 'codemirror';

export const isBoldActive = isActive('strong');
export const isItalicActive = isActive('em');

export const isH1Active = isActive('header-1');
export const isH2Active = isActive('header-2');
export const isH3Active = isActive('header-3');
export const isH4Active = isActive('header-4');
export const isH5Active = isActive('header-5');
export const isH6Active = isActive('header-6');

function isActive(type: string) {
    return (cm: CodeMirror.Editor): boolean => {
        const token = cm.getTokenTypeAt(cm.getCursor('start')) ?? '';
        return token.split(' ').includes(type);
    };
}
