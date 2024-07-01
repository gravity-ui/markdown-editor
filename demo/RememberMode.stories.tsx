import React, {useEffect, useState} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {EditorMode} from '../src/bundle/Editor';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

export default {
    title: 'Experiments / Remember the mode',
} as Meta;

const markup = {
    RememberMode: `
## Remember the мode

MarkdownEditor API provides access to flexible configuration, in this demo, when the page is reloaded, the editor's mode of operation does not change.

For this example, the settings are saved in localStorage, but you can use other methods

## YFM HTML

::: html

<h1>Туристический санитарный и ветеринарный контроль в XXI веке</h1>
<p>Как следует из рассмотренного выше частного случая, наводнение известно. На завтрак англичане предпочитают овсяную кашу и кукурузные хлопья, тем не менее начальное условие движения совершает интеграл от переменной величины. Бамбук, при том, что королевские полномочия находятся в руках исполнительной власти - кабинета министров, однородно переворачивает вулканизм. Независимое государство, особенно в верхах разреза, совершает пегматитовый кварцит.</p>
<p>Большая часть территории участвует в погрешности определения курса меньше, чем силл. Штопор вразнобой поступает в цокольный музей под открытым небом, что имеет простой и очевидный физический смысл. Маховик, согласно третьему закону Ньютона, локально слагает распространенный систематический уход, а к мясу подают подливку, запеченные овощи и пикули.</p>
<p>Комбинированный тур смещает подземный сток. Деградация мерзлоты горизонтально просветляет четвертичный крен. Побережье, с учетом региональных факторов, вразнобой смещает объект. Угол крена точно переворачивает пингвин.</p>

:::

## Remember the мode

MarkdownEditor API provides access to flexible configuration, in this demo, when the page is reloaded, the editor's mode of operation does not change.

For this example, the settings are saved in localStorage, but you can use other methods

## YFM HTML 2

::: html

<h1>Cанитарный и ветеринарный контроль в 2 веке</h1>
<p>Как следует из рассмотренного выше частного случая, наводнение известно. На завтрак англичане предпочитают овсяную кашу и кукурузные хлопья, тем не менее начальное условие движения совершает интеграл от переменной величины. Бамбук, при том, что королевские полномочия находятся в руках исполнительной власти - кабинета министров, однородно переворачивает вулканизм. Независимое государство, особенно в верхах разреза, совершает пегматитовый кварцит.</p>
<p>Большая часть территории участвует в погрешности определения курса меньше, чем силл. Штопор вразнобой поступает в цокольный музей под открытым небом, что имеет простой и очевидный физический смысл. Маховик, согласно третьему закону Ньютона, локально слагает распространенный систематический уход, а к мясу подают подливку, запеченные овощи и пикули.</p>
<p>Комбинированный тур смещает подземный сток. Деградация мерзлоты горизонтально просветляет четвертичный крен. Побережье, с учетом региональных факторов, вразнобой смещает объект. Угол крена точно переворачивает пингвин.</p>
<p>Как следует из рассмотренного выше частного случая, наводнение известно. На завтрак англичане предпочитают овсяную кашу и кукурузные хлопья, тем не менее начальное условие движения совершает интеграл от переменной величины. Бамбук, при том, что королевские полномочия находятся в руках исполнительной власти - кабинета министров, однородно переворачивает вулканизм. Независимое государство, особенно в верхах разреза, совершает пегматитовый кварцит.</p>
<p>Большая часть территории участвует в погрешности определения курса меньше, чем силл. Штопор вразнобой поступает в цокольный музей под открытым небом, что имеет простой и очевидный физический смысл. Маховик, согласно третьему закону Ньютона, локально слагает распространенный систематический уход, а к мясу подают подливку, запеченные овощи и пикули.</p>
<p>Комбинированный тур смещает подземный сток. Деградация мерзлоты горизонтально просветляет четвертичный крен. Побережье, с учетом региональных факторов, вразнобой смещает объект. Угол крена точно переворачивает пингвин.</p>

:::

`.trim(),
};

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
>;

const args: Partial<PlaygroundStoryProps> = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
};

export const RememberMode: StoryFn<PlaygroundStoryProps> = (props) => {
    const [mode, setMode] = useState<EditorMode>();
    const [splitModeEnabled, setSplitModeEnabled] = useState<boolean>();

    const handleChangeEditorType = (mode: EditorMode) => {
        localStorage.setItem('markdownEditorMode', mode);
    };

    const handleChangeSplitModeEnabled = (enabled: boolean) => {
        localStorage.setItem('markdownEditorSplitModeEnabled', enabled.toString());
    };

    useEffect(() => {
        const storedMode = localStorage.getItem('markdownEditorMode') || 'wysiwyg';
        const storedSplitModeEnabled = localStorage.getItem('markdownEditorSplitModeEnabled');

        if (storedMode) {
            setMode(storedMode as EditorMode);
            setSplitModeEnabled(storedSplitModeEnabled === 'true');
        }
    }, []);

    return (
        <>
            {mode && (
                <PlaygroundComponent
                    {...props}
                    onChangeEditorType={handleChangeEditorType}
                    initialEditor={mode}
                    initialSplitModeEnabled={splitModeEnabled}
                    onChangeSplitModeEnabled={handleChangeSplitModeEnabled}
                    initial={markup.RememberMode}
                />
            )}
        </>
    );
};

RememberMode.args = args;
RememberMode.storyName = 'Playground';
