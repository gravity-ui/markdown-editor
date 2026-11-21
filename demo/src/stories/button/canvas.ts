import {buttonViewColors, buttonViews} from '@gravity-ui/markdown-plugin-banner';

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

const viewsAndColors = buttonViews
    .map((view) =>
        [
            `### ${capitalize(view)}`,
            buttonViewColors[view]
                .map(
                    (color) =>
                        `:button[${capitalize(color)}]{href="https://example.com" view="${view}" color="${color}"}`,
                )
                .join(' '),
        ].join('\n\n'),
    )
    .join('\n\n');

export const buttonExamples = `
## In a paragraph

Press :button[Start]{href="https://example.com/start" view="action" color="blue"} to begin, or read :button[the docs]{href="https://example.com/docs" view="outline" color="gray"} first.

## A row of buttons

:button[Save]{href="https://example.com/save" view="action" color="standard"} :button[Preview]{href="https://example.com/preview" view="normal" color="gray"} :button[Share]{href="https://example.com/share" view="outline" color="blue"} :button[Cancel]{href="https://example.com/cancel" view="flat" color="standard"}

## Views and colors

${viewsAndColors}

## With and without a link

:button[With a link]{href="https://example.com" view="action" color="blue"} :button[In a new tab]{href="https://example.com" view="normal" color="blue" target="_blank"} :button[Without a link]{view="outline" color="blue"}
`.trim();

export const buttonCanvas = `
${buttonExamples}

## In a banner

:::banner{height="s" width="m" bg-color="gray-light"}

::banner-title[Buttons in a banner]

:::banner-content

Up to three buttons stand in a row under the text.

:::

:button[Primary]{href="https://example.com" view="action" color="blue"} :button[Secondary]{href="https://example.com" view="normal" color="gray"} :button[Tertiary]{view="flat" color="standard"}

:::
`.trim();
