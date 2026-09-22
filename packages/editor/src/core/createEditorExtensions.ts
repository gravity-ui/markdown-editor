import type {WysiwygEditorOptions} from './Editor';
import {ExtensionsManager} from './ExtensionsManager';
import {SchemaDynamicModifier} from './SchemaDynamicModifier';
import {MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import {MarkdownSerializerDynamicModifier} from './markdown/MarkdownSerializer';
import {convertDynamicModifiersConfigs} from './utils/dynamicModifiers';

/** Prepare shared schema and Markdown configuration without creating a view or plugins. */
export function createEditorExtensions({
    extensions = () => {},
    allowHTML,
    mdPreset,
    linkify,
    pmTransformers,
    linkifyTlds,
    modifiers,
    logger,
}: WysiwygEditorOptions): ExtensionsManager {
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
            // "breaks" affects rendering, but not parsing.
            mdOpts: {html: allowHTML, linkify, breaks: true, preset: mdPreset},
            linkifyTlds,
            pmTransformers,
            dynamicModifiers,
        },
        logger,
    });
}
