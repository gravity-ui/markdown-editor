import {type MouseEvent, memo} from 'react';

import transform from '@diplodoc/transform';
import {colorClassName} from '@gravity-ui/markdown-editor';
import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml/index.js';

import {Playground} from '../../../components/Playground';
import {getPlugins} from '../../../defaults/md-plugins';
import {block} from '../../../utils/cn';

import {footnoteEditorMarkup, footnoteExamples} from './markup';

import './Footnote.scss';

const b = block('footnote-catalogue');

const plugins = getPlugins();

const render = (markup: string) =>
    transform(markup, {plugins, defaultClassName: colorClassName}).result.html;

const catalogue = Object.entries(footnoteExamples).map(([group, items]) => ({
    group,
    id: `footnote-catalogue-${group.toLowerCase().replace(/\s+/g, '-')}`,
    items: Object.entries(items).map(([name, markup]) => ({name, markup, html: render(markup)})),
}));

type FootnoteGroupProps = {group: (typeof catalogue)[number]};

const FootnoteGroup = memo(function FootnoteGroup({group: {group, id, items}}: FootnoteGroupProps) {
    return (
        <section>
            <h2 id={id} className={b('group')}>
                {group}
            </h2>
            {items.map(({name, markup, html}) => (
                <article key={name} className={b('example')} data-qa="footnote-example">
                    <h3 className={b('name')}>{name}</h3>
                    <div className={b('card')}>
                        <pre className={b('markup')}>{markup}</pre>
                        <YfmStaticView className={b('preview')} html={html} noListReset />
                    </div>
                </article>
            ))}
        </section>
    );
});

// Storybook renders a story in its own document, so the link also scrolls explicitly.
const scrollToGroup = (event: MouseEvent<HTMLAnchorElement>) => {
    const {hash} = event.currentTarget;
    const target = event.currentTarget.closest(`.${b()}`)?.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
    history.replaceState(null, '', hash);
};

const FootnoteNav = memo(function FootnoteNav() {
    return (
        <nav className={b('nav')}>
            {catalogue.map(({group, id}) => (
                <a key={id} className={b('nav-link')} href={`#${id}`} onClick={scrollToGroup}>
                    {group}
                </a>
            ))}
        </nav>
    );
});

type FootnoteCatalogueProps = {
    /** Group name. Without it, all groups are shown. */
    group?: string;
};

export const FootnoteCatalogue = memo(function FootnoteCatalogue({group}: FootnoteCatalogueProps) {
    return (
        <div className={b()}>
            {!group && <FootnoteNav />}
            {catalogue
                .filter((item) => !group || item.group === group)
                .map((item) => (
                    <FootnoteGroup key={item.group} group={item} />
                ))}
        </div>
    );
});

export const FootnoteEditor = memo(function FootnoteEditor() {
    return (
        <Playground
            initial={footnoteEditorMarkup}
            initialEditor="markup"
            initialSplitModeEnabled
            splitModeOrientation="horizontal"
            renderPreviewDefined
            settingsVisible
            stickyToolbar
            breaks
        />
    );
});
