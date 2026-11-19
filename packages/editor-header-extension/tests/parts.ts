import {pType} from '@gravity-ui/markdown-editor';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node, NodeSpec, NodeType} from '@gravity-ui/markdown-editor/pm/model';

import type {HeaderPartSpec} from '../src/wysiwyg/extensions/Header/parts';

export const testImage = 'test_image';
export const testTitle = 'test_title';
export const testContent = 'test_content';

const plain = (paragraph: Node) => {
    let found = true;
    paragraph.forEach((child) => {
        found &&= child.isText && !child.marks.length;
    });
    return found;
};

const parts: Record<string, NodeSpec & {headerPart: HeaderPartSpec}> = {
    [testImage]: {
        group: 'block',
        atom: true,
        attrs: {src: {default: ''}},
        toDOM: () => ['figure'],
        headerPart: {part: 'image', create: (type) => type.create()},
    },
    [testTitle]: {
        group: 'block',
        content: 'text*',
        marks: '',
        attrs: {size: {default: '2'}},
        toDOM: () => ['h1', 0],
        headerPart: {
            part: 'title',
            create: (type) => type.create(null, type.schema.text('Title')),
            adopt: (paragraph, type) =>
                plain(paragraph) ? type.create(null, paragraph.content) : null,
        },
    },
    [testContent]: {
        group: 'block',
        content: 'block+',
        toDOM: () => ['section', 0],
        headerPart: {
            part: 'content',
            create: (type: NodeType) =>
                type.create(null, pType(type.schema).create(null, type.schema.text('Description'))),
            adopt: (paragraph, type) => type.create(null, paragraph),
        },
    },
};

/** Three banner parts that only exist in tests: the shared part commands know no part by name. */
export const TestParts = (only: string[] = Object.keys(parts)): ExtensionAuto => {
    return (builder) => {
        for (const name of only) {
            const {atom} = parts[name];
            builder.addNodeSpec(name, () => parts[name]);
            builder.addMarkdownTokenParserSpec(name, () => ({
                name,
                type: atom ? 'node' : 'block',
            }));
            builder.addNodeSerializerSpec(name, () => (state, node) => {
                state.write(`[${name}]`);
                state.ensureNewLine();
                state.renderContent(node);
                state.closeBlock(node);
            });
        }
    };
};
