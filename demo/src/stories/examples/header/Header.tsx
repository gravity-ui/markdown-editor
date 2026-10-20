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

type HeaderGroupProps = {group: (typeof catalogue)[number]};

const HeaderGroup = memo(function HeaderGroup({group: {group, items}}: HeaderGroupProps) {
    return (
        <section>
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
    );
});

type HeaderCatalogueProps = {
    /** Имя группы. Без него показываются все группы подряд. */
    group?: string;
};

export const HeaderCatalogue = memo(function HeaderCatalogue({group}: HeaderCatalogueProps) {
    return (
        <div className={b()}>
            {catalogue
                .filter((item) => !group || item.group === group)
                .map((item) => (
                    <HeaderGroup key={item.group} group={item} />
                ))}
        </div>
    );
});

const editorMarkup = [
    examples.Alignment['Left, center'],
    examples['Content image']['Right, crop'],
    examples['Decor layer']['Mesh over fill'],
    examples['Background image']['Focus bottom'],
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
