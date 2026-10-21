import {type MouseEvent, memo} from 'react';

import transform from '@diplodoc/transform';
import {type ExtensionAuto, colorClassName} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {YfmStaticView} from '@gravity-ui/markdown-editor/view/components/YfmHtml/index.js';

import {Playground} from '../../../components/Playground';
import {getPlugins} from '../../../defaults/md-plugins';
import {block} from '../../../utils/cn';

import {getHeaderExamples} from './markup';

import cover from './cover.png';
import landscape from './landscape.jpg';

import './Header.scss';

const b = block('header-catalogue');

const examples = getHeaderExamples(cover, landscape);
const plugins = getPlugins();

// Санитайзер по умолчанию удаляет из стилей фигур положение и прозрачность.
const render = (markup: string) =>
    transform(markup, {plugins, needToSanitizeHtml: false, defaultClassName: colorClassName}).result
        .html;

const catalogue = Object.entries(examples).map(([group, items]) => ({
    group,
    id: `header-catalogue-${group.toLowerCase().replace(/\s+/g, '-')}`,
    items: Object.entries(items).map(([name, markup]) => ({name, markup, html: render(markup)})),
}));

type HeaderGroupProps = {group: (typeof catalogue)[number]};

const HeaderGroup = memo(function HeaderGroup({group: {group, id, items}}: HeaderGroupProps) {
    return (
        <section>
            <h2 id={id} className={b('group')}>
                {group}
            </h2>
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

// В Storybook история живёт в своём документе, поэтому переход по `href` дублируется прокруткой.
const scrollToGroup = (event: MouseEvent<HTMLAnchorElement>) => {
    const {hash} = event.currentTarget;
    const target = event.currentTarget.closest(`.${b()}`)?.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
    history.replaceState(null, '', hash);
};

const HeaderNav = memo(function HeaderNav() {
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

type HeaderCatalogueProps = {
    /** Имя группы. Без него показываются все группы подряд. */
    group?: string;
};

export const HeaderCatalogue = memo(function HeaderCatalogue({group}: HeaderCatalogueProps) {
    return (
        <div className={b()}>
            {!group && <HeaderNav />}
            {catalogue
                .filter((item) => !group || item.group === group)
                .map((item) => (
                    <HeaderGroup key={item.group} group={item} />
                ))}
        </div>
    );
});

const editorMarkup = [
    examples.Alignment['Align left, vertical center'],
    examples['Content image']['Side right, fit crop'],
    examples['Decor layer']['Decor mesh, shape diagonal'],
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
