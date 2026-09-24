import type {PresetName} from 'markdown-it';

import type {Logger2} from '../logger';

import type {Extension} from './ExtensionBuilder';
import {ExtensionsManager} from './ExtensionsManager';
import {SchemaDynamicModifier} from './SchemaDynamicModifier';
import {MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import {MarkdownSerializerDynamicModifier} from './markdown/MarkdownSerializer';
import type {TransformFn} from './markdown/ProseMirrorTransformer';
import type {DynamicModifiers} from './types/dynamicModifiers';
import {convertDynamicModifiersConfigs} from './utils/dynamicModifiers';

/** Shared configuration for editor dependencies, independent of the view. */
export type EditorExtensionsOptions = {
    extensions?: Extension;
    /** @default 'default' */
    mdPreset?: PresetName;
    allowHTML?: boolean;
    linkify?: boolean;
    pmTransformers?: TransformFn[];
    linkifyTlds?: string | string[];
    /** @internal Modifiers adjust the parser and serializer */
    modifiers?: DynamicModifiers[];
    logger?: Logger2.ILogger;
};

/** Create a manager with shared schema and Markdown settings; dependencies are built lazily. */
export function createEditorExtensionsManager({
    extensions = () => {},
    allowHTML,
    mdPreset,
    linkify,
    pmTransformers,
    linkifyTlds,
    modifiers,
    logger,
}: EditorExtensionsOptions): ExtensionsManager {
    const dynamicModifiersConfig = modifiers
        ? convertDynamicModifiersConfigs(modifiers)
        : undefined;
    const dynamicModifiers = dynamicModifiersConfig
        ? {
              schema: new SchemaDynamicModifier(dynamicModifiersConfig.schema),
              parser: new MarkdownParserDynamicModifier(dynamicModifiersConfig.parser),
              serializer: new MarkdownSerializerDynamicModifier(dynamicModifiersConfig.serializer),
          }
        : undefined;

    return new ExtensionsManager({
        extensions,
        options: {
            mdOpts: {html: allowHTML, linkify, breaks: true, preset: mdPreset},
            linkifyTlds,
            pmTransformers,
            dynamicModifiers,
        },
        logger,
    });
}
