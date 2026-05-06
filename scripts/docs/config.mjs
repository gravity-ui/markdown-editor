const internalExtensions = ['BaseInputRules', 'BaseKeymap', 'BaseStyles', 'ReactRenderer', 'SharedState'];

/**
 * Configuration for the extension documentation generation pipeline
 */
export const config = {
    ai: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 1000,
    },

    prompts: {
        description: {
            system: `You are a technical writer for the @gravity-ui/markdown-editor library — a ProseMirror-based WYSIWYG and markup editor. Write concise, accurate documentation in English.`,
            user: `Write a description of the "{name}" extension (2-4 sentences).
Focus on what this extension adds to the editor from a user's perspective.
Do not repeat the extension name as the first word.

Category: {category}
ProseMirror nodes: {nodes}
ProseMirror marks: {marks}
Actions: {actions}
Included in presets: {presets}

Source code:
{sourceCode}

Write ONLY the description text, no markdown headers.`,
        },

        syntaxGuide: {
            system: `You are a technical writer for a markdown editor library. Write clear syntax guides.`,
            user: `Write a syntax guide for the "{name}" extension.

Explain the markdown/markup syntax this extension handles:
- Show the syntax patterns with inline code
- Explain how they render
- Note any variations or edge cases

If this is a behavior extension with no markdown syntax, write: "This extension does not define custom markdown syntax."

Metadata:
- Category: {category}
- Input rules: {inputRules}
- Serializer hints: {serializerHints}

Test examples:
{markupExamples}

Source code:
{sourceCode}

Write markdown content without the section header.`,
        },

        serialization: {
            system: `You are a technical writer for a markdown editor library.`,
            user: `Describe how the "{name}" extension serializes its content back to markdown.

What markdown output does it produce? Include code examples where helpful.

If the extension doesn't produce markdown output, write: "This extension does not produce markdown output."

Serializer hints from code: {serializerHints}
Nodes: {nodes}
Marks: {marks}

Source code:
{sourceCode}

Write markdown content without the section header.`,
        },

        useCases: {
            system: `You are a technical writer for the @gravity-ui/markdown-editor library.`,
            user: `Write 2-4 bullet points describing typical use cases for the "{name}" extension.
When would a developer include this extension in their editor setup?

Category: {category}
Nodes: {nodes}
Marks: {marks}
Presets: {presets}

Write ONLY bullet points in markdown. Each should be one concise sentence.`,
        },

        examples: {
            system: `You are a technical writer creating markdown documentation examples.`,
            user: `Provide 2-3 clear markdown examples for the "{name}" extension.

Each example should:
1. Have a brief one-line description
2. Show the markdown syntax in a code block
3. Be practical and realistic

Existing test examples:
{markupExamples}

Serializer hints: {serializerHints}
Input rules: {inputRules}

If this extension has no markdown syntax, write: "This extension does not have markdown syntax examples."

Write in markdown format.`,
        },
    },

    internalExtensions,

    categories: {
        order: ['markdown', 'yfm', 'additional', 'behavior', 'base'],
        labels: {
            markdown: 'Markdown',
            yfm: 'YFM',
            additional: 'Additional',
            behavior: 'Behavior',
            base: 'Base',
        },
    },
};

export function isInternalExtension(name) {
    return config.internalExtensions.includes(name);
}
