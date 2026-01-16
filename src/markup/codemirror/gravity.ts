import {HighlightStyle, defaultHighlightStyle} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';

import {customTags as ct} from './yfm';

export const gravityHighlightStyle = HighlightStyle.define(
    defaultHighlightStyle.specs.concat(
        {tag: t.meta, color: 'var(--g-color-text-hint)'},
        {tag: t.link, color: 'var(--g-color-text-link)'},
        {tag: t.url, color: 'var(--g-color-text-link-hover)'},
        {tag: t.contentSeparator, color: 'var(--g-color-text-secondary)'},
        {tag: [t.string, t.deleted], color: 'var(--g-color-text-danger)'},
        {tag: t.escape, color: 'var(--g-color-text-danger-heavy)'},
        {tag: t.typeName, color: 'var(--g-color-text-positive-heavy)'},
        {tag: t.atom, color: 'var(--g-color-text-info-heavy)'},
        {tag: t.labelName, color: 'var(--g-color-text-complementary)'},
        {tag: t.heading, fontWeight: 'bold'},
        // custom tags
        {tag: ct.underline, textDecoration: 'underline'},
        {tag: ct.monospace, fontFamily: 'monospace'},
        {tag: ct.marked, color: 'marktext', backgroundColor: 'mark'},
    ),
);

export const gravityTheme = EditorView.baseTheme({
    '&.cm-editor': {
        height: '100%',
    },
    '&.cm-focused': {
        outline: 'none',
    },
    '.cm-placeholder': {
        color: 'var(--g-color-text-secondary)',
    },
    '.cm-content': {
        color: 'var(--g-color-text-primary)',
        caretColor: 'currentColor',
        fontSize: 'var(--g-text-code-2-font-size)',
        fontWeight: 'var(--g-text-code-font-weight)',
        fontFamily: 'var(--g-font-family-monospace)',
        lineHeight: 'var(--g-text-code-2-line-height)',
    },
    '&.cm-focused .cm-cursor': {
        borderLeftColor: 'currentColor',
    },
    '&.cm-focused .cm-selectionBackground, &.cm-focused ::selection': {
        background: 'var(--g-color-base-misc-medium)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
        padding: '4px 0',
        lineHeight: '24px',
        color: 'var(--g-color-text-primary)',
        fontFamily: 'var(--g-font-family-monospace)',
        fontSize: 'var(--g-text-body-1-font-size)',
        backgroundColor: 'var(--g-color-base-float)',
        border: '1px solid var(--g-color-line-generic-solid)',
        borderRadius: '4px',

        '& > ul': {
            '& > completion-section': {
                color: 'var(--g-color-text-hint)',
                fontWeight: 'var(--g-text-accent-font-weight)',
                borderBottom: '1px solid var(--g-color-line-generic)',
            },

            '& > li:hover': {
                backgroundColor: 'var(--g-color-base-simple-hover)',
            },

            '& > li[aria-selected]': {
                backgroundColor: 'var(--g-color-base-selection)',
                color: 'revert',
            },
        },
    },
});
