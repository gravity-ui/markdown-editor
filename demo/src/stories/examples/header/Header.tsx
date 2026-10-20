import {memo} from 'react';

import transform from '@diplodoc/transform';
import {type ExtensionAuto, colorClassName} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml/index.js';

import {Playground} from '../../../components/Playground';
import {getPlugins} from '../../../defaults/md-plugins';
import {block} from '../../../utils/cn';

import {getHeaderExamples} from './markup';

import cover from './cover.png';

import './Header.scss';

const b = block('header-catalogue');

const examples = getHeaderExamples(cover);
const plugins = getPlugins();

// Примеры содержат `data:`-адреса изображений, а санитайзер по умолчанию их удаляет.
const render = (markup: string) =>
    transform(markup, {plugins, needToSanitizeHtml: false, defaultClassName: colorClassName}).result
        .html;

const catalogue = Object.entries(examples).map(([group, items]) => ({
    group,
    items: Object.entries(items).map(([name, markup]) => ({name, markup, html: render(markup)})),
}));

export const HeaderCatalogue = memo(function HeaderCatalogue() {
    return (
        <div className={b()}>
            {catalogue.map(({group, items}) => (
                <section key={group}>
                    <h2 className={b('group')}>{group}</h2>
                    {items.map(({name, markup, html}) => (
                        <article key={name} className={b('example')}>
                            <h3 className={b('name')}>{name}</h3>
                            <div className={b('card')}>
                                <pre className={b('markup')}>{markup}</pre>
                                <YfmStaticView className={b('preview')} html={html} noListReset />
                            </div>
                        </article>
                    ))}
                </section>
            ))}
        </div>
    );
});

const editorMarkup = [
    examples.Layout['Medium, centered'],
    examples['Content image']['Right, small, aligned left'],
    examples['Background image'].Darken,
    examples.Slots['Shuffled order'],
    examples['Edge cases']['Inside a cut'],
].join('\n\n');

const extensions: ExtensionAuto = (builder) => builder.use(Header);

export const HeaderEditor = memo(function HeaderEditor() {
    return (
        <Playground
            initial={editorMarkup}
            initialEditor="markup"
            initialSplitModeEnabled
            splitModeOrientation="horizontal"
            renderPreviewDefined
            settingsVisible
            stickyToolbar
            breaks
            sanitizeHtml={false}
            disableMarkdownItAttrs
            wysiwygConfig={{extensions}}
        />
    );
});
