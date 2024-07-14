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

## Next is another YFM HTML block with styles

::: html

<style>
html, body {
    background-color: var(--yfm-html-color-background);
    color: var(--yfm-html-color-text-primary);
    font-size: var(--yfm-html-font-size);
    font-family: var(--yfm-html-font-family);
}
.container {
    display: flex;
    margin: 20px;
}
.main {
    flex: 2;
    padding: 20px;
}

.main ul {
    list-style-type: disc;
    margin-left: 20px;
}

aside {
    flex: 1;
    padding: 20px;
}

aside blockquote {
    font-style: italic;
    color: var(--yfm-html-color-text-primary);
    border-left: 4px solid var(--yfm-html-color-text-primary);
    padding-left: 10px;
}

.info-block {
    margin-top: 20px;
}

.info-block h3 {
    color: var(--yfm-html-color-text-primary);
}

.info-block ul {
    list-style-type: circle;
    margin-left: 20px;
}

.dark a {
    color: red;
    text-decoration: none;
}
.light a {
    color: blue;
    text-decoration: none;
}

</style>

    <header>
        <h1>Understanding HTML: The Backbone of Web Development</h1>
    </header>

    <div class="container">
        <div class="main">
            <p>HTML, or HyperText Markup Language, is the standard language used to create web pages. It allows developers to structure content and make it accessible and attractive to users.</p>

            <p>HTML was first developed by Tim Berners-Lee in 1991, and since then, it has gone through numerous iterations to become the versatile tool it is today. One of the core tenets of HTML is its simplicity and accessibility. By using a series of tags, you can define various elements on a webpage, such as headings, paragraphs, links, images, and more.</p>

            <p>HTML documents are plain text files that can be created and edited with any text editor. When opened in a web browser, the HTML code is parsed and rendered to display the structured content. This is achieved through the use of various HTML elements, each represented by tags.</p>

            <p>Some of the most commonly used HTML tags include:</p>
            <ul>
                <li><strong>&lt;h1&gt; to &lt;h6&gt;</strong> – Define headings.</li>
                <li><strong>&lt;p&gt;</strong> – Defines a paragraph.</li>
                <li><strong>&lt;a&gt;</strong> – Defines a hyperlink.</li>
                <li><strong>&lt;img&gt;</strong> – Embeds an image.</li>
                <li><strong>&lt;div&gt;</strong> – Defines a division or a section in a document.</li>
            </ul>

            <p>HTML also supports multimedia, allowing you to embed videos, audio, and interactive content. Modern HTML (HTML5) introduces several new elements and APIs to enhance functionality, making it easier for developers to create rich, interactive web experiences.</p>

            <p>In conclusion, understanding HTML is fundamental for web development. Its role in structuring and presenting content on the web is indispensable. Whether you are a beginner or a seasoned developer, mastering HTML opens the door to creating engaging and effective web pages.</p>
        </div>

        <aside>
            <blockquote>
                "HTML is the skeleton of the web, essential and foundational. Every web page owes its structure to HTML."
            </blockquote>

            <div class="info-block">
                <h3>Quick Facts:</h3>
                <ul>
                    <li>Released in 1991 by Tim Berners-Lee.</li>
                    <li>The latest version is HTML5.</li>
                    <li>HTML stands for HyperText Markup Language.</li>
                </ul>
            </div>
        </aside>
    </div>


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
