import type {ExtensionAuto} from '#core';
import {writeDirectiveLines} from 'src/utils/directive-container';

import {ButtonSpecs, escapePlainContent, serializeAttrs} from '../../Button/ButtonSpecs';

import {normalizeHeaderAttrs, normalizeHeaderImageAttrs, serializeHeaderAttrs} from './attrs';
import {
    HeaderImageDefaults,
    headerActionsName,
    headerContentName,
    headerImageName,
    headerNodeName,
    headerTitleName,
} from './const';
import {headerDirective} from './md/header';
import {
    getHeaderContentSpec,
    getHeaderSchemaSpec,
    getHeaderTitleSpec,
    headerActionsSpec,
    headerImageSpec,
} from './schema';

export * from './attrs';
export * from './const';
export * from './decor';
export {headerHtml, toCssUrl} from './dom';
export {headerDirective} from './md/header';
export type HeaderSpecsOptions = {
    titlePlaceholder?: () => string;
    contentPlaceholder?: () => string;
};

export const HeaderSpecs: ExtensionAuto<HeaderSpecsOptions> = (builder, options = {}) => {
    builder.use(ButtonSpecs).configureMd((md) => md.use(headerDirective));
    builder
        .addNodeSpec(headerNodeName, getHeaderSchemaSpec)
        .addNodeSpec(headerTitleName, () =>
            getHeaderTitleSpec(
                options.titlePlaceholder
                    ? {header: options.titlePlaceholder}
                    : builder.context.get('placeholder'),
            ),
        )
        .addNodeSpec(headerContentName, () => getHeaderContentSpec(options.contentPlaceholder))
        .addNodeSpec(headerActionsName, () => headerActionsSpec)
        .addNodeSpec(headerImageName, () => headerImageSpec);
    for (const name of [headerNodeName, headerTitleName, headerContentName, headerActionsName]) {
        builder.addMarkdownTokenParserSpec(name, () => ({
            name,
            type: 'block',
            ...(name === headerNodeName
                ? {getAttrs: (token) => normalizeHeaderAttrs(Object.fromEntries(token.attrs ?? []))}
                : {}),
        }));
    }
    builder.addMarkdownTokenParserSpec(headerImageName, () => ({
        name: headerImageName,
        type: 'node',
        getAttrs: (token) => normalizeHeaderImageAttrs(Object.fromEntries(token.attrs ?? [])),
    }));
    builder.addNodeSerializerSpec(headerNodeName, () => (state, node) => {
        writeDirectiveLines(state, `:::header${serializeHeaderAttrs(node.attrs)}\n`);
        const image = node.child(3);
        if (image.attrs.src || image.attrs.enabled === 'true') {
            writeDirectiveLines(
                state,
                `:::header-image${serializeAttrs(image.attrs, {...HeaderImageDefaults, enabled: 'true'})}\n:::\n`,
            );
        }
        for (const child of [node.child(0), node.child(1), node.child(2)])
            state.render(child, node, 0);
        state.write(':::');
        state.closeBlock(node);
    });
    builder.addNodeSerializerSpec(headerTitleName, () => (state, node) => {
        writeDirectiveLines(state, `:::header-title\n${escapePlainContent(node.textContent)}`);
        state.write(':::');
        state.closeBlock(node);
    });
    builder.addNodeSerializerSpec(headerContentName, () => (state, node) => {
        writeDirectiveLines(state, ':::header-content');
        state.renderContent(node);
        state.ensureNewLine();
        state.write(':::');
        state.closeBlock(node);
    });
    builder.addNodeSerializerSpec(
        headerActionsName,
        () => (state, node) => state.renderContent(node),
    );
    builder.addNodeSerializerSpec(headerImageName, () => () => {});
};
