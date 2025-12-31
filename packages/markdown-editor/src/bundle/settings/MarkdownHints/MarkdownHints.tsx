import {Fragment, memo} from 'react';

import {Link} from '@gravity-ui/uikit';

import {i18n} from '.././../../i18n/md-hints';
import {cn} from '../../../classname';

import './MarkdownHints.scss';

const b = cn('markdown-hints');

export const MarkdownHints = memo(function MarkdownHints() {
    const hints = [
        {title: i18n('header_title'), hint: i18n('header_hint')},
        {title: i18n('italic_title'), hint: i18n('italic_hint')},
        {title: i18n('bold_title'), hint: i18n('bold_hint')},
        {title: i18n('strikethrough_title'), hint: i18n('strikethrough_hint')},
        {title: i18n('blockquote_title'), hint: i18n('blockquote_hint')},
        {title: i18n('code_title'), hint: i18n('code_hint')},
        {title: i18n('link_title'), hint: i18n('link_hint')},
        {title: i18n('image_title'), hint: i18n('image_hint')},
        {title: i18n('list_title'), hint: i18n('list_hint')},
        {title: i18n('numbered-list_title'), hint: i18n('numbered-list_hint')},
    ];

    return (
        <div className={b()}>
            <div className={b('grid')}>
                {hints.map((hint, index) => (
                    <Fragment key={`md-hint-${index}`}>
                        <span className={b('title')}>{hint.title}</span>
                        <span className={b('hint')}>{hint.hint}</span>
                    </Fragment>
                ))}
            </div>

            <Link href={i18n('documentation_link')} target="_blank" className={b('docs-link')}>
                {i18n('documentation')}
            </Link>
        </div>
    );
});

MarkdownHints.displayName = 'MarkdownHints';
