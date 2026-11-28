export const bannerCanvas = `
## Everything at once

:::banner{height="l" width="l" vertical="top" bg-image="assets/banner-background.webp" bg-theme="light" bg-image-blur="true"}

::banner-image[Abstract illustration](assets/banner-image.webp)

::banner-title[Team portal]

:::banner-content

Everything the team needs in **one place**: the [handbook](https://example.com/handbook), the release calendar and the \`on-call\` schedule.

:::

:button[Get started](https://example.com/start){view="action" color="standard"} :button[Read the docs](https://example.com/docs){view="outline" color="gray"}

:::

## Title and description, centered on a fill

:::banner{height="s" width="m" align="center" bg-color="blue-medium"}

::banner-title[Release notes]

:::banner-content

What is new in the latest version.

:::

:::

## Alignment

### Left, bottom

:::banner{height="m" width="m" vertical="bottom" bg-color="gray-light"}

::banner-title[Left, bottom]

:::banner-content

The text and the buttons start at the left edge and stand at the bottom.

:::

:button[Open](https://example.com){view="action" color="blue"}

:::

### Center, top

:::banner{height="m" width="m" align="center" vertical="top" bg-color="gray-light"}

::banner-title[Center, top]

:::banner-content

The text and the buttons are centered and stand at the top.

:::

:button[Open](https://example.com){view="action" color="blue"}

:::

### Right, center

:::banner{height="m" width="m" align="right" bg-color="gray-light"}

::banner-title[Right, center]

:::banner-content

The text and the buttons end at the right edge, in the middle of the height.

:::

:button[Open](https://example.com){view="action" color="blue"}

:::

### Right, bottom

:::banner{height="m" width="m" align="right" vertical="bottom" bg-color="gray-light"}

::banner-title[Right, bottom]

:::banner-content

The text and the buttons end at the right edge and stand at the bottom.

:::

:button[Open](https://example.com){view="action" color="blue"}

:::

## Height

### Small

:::banner{height="s" width="s" bg-color="green-light"}

::banner-title[Height s]

:::banner-content

At least 236 px high.

:::

:::

### Medium

:::banner{height="m" width="s" bg-color="green-light"}

::banner-title[Height m]

:::banner-content

At least 300 px high.

:::

:::

### Large

:::banner{height="l" width="s" bg-color="green-light"}

::banner-title[Height l]

:::banner-content

At least 420 px high.

:::

:::

## Width

### Small

:::banner{height="s" width="s" bg-color="yellow-light"}

::banner-title[Width s]

:::banner-content

Up to 740 px wide.

:::

:::

### Medium

:::banner{height="s" width="m" bg-color="yellow-light"}

::banner-title[Width m]

:::banner-content

Up to 900 px wide.

:::

:::

### Large

:::banner{height="s" width="l" bg-color="yellow-light"}

::banner-title[Width l]

:::banner-content

Up to 1200 px wide.

:::

:::

### Full

:::banner{height="s" width="full" bg-color="yellow-light"}

::banner-title[Width full]

:::banner-content

As wide as the page.

:::

:::

## Fill

### Light

:::banner{height="s" width="m" bg-color="violet-light"}

::banner-title[Light fill]

:::banner-content

A soft background with \`monospace\` text and a [link](https://example.com).

:::

:button[Open](https://example.com){view="action" color="violet"} :button[Later]{view="flat" color="violet"}

:::

### Medium

:::banner{height="s" width="m" bg-color="green-medium"}

::banner-title[Medium fill]

:::banner-content

A brighter background with \`monospace\` text and a [link](https://example.com).

:::

:button[Open](https://example.com){view="action" color="green"} :button[Later]{view="flat" color="green"}

:::

### Heavy

:::banner{height="s" width="m" bg-color="red-heavy"}

::banner-title[Heavy fill]

:::banner-content

A saturated background with \`monospace\` text and a [link](https://example.com).

:::

:button[Open](https://example.com){view="normal" color="gray"} :button[Later]{view="flat" color="standard"}

:::

## Background image

### Light theme

:::banner{height="s" width="m" bg-image="assets/banner-background.webp" bg-theme="light"}

::banner-title[Dark text on a light image]

:::banner-content

The content keeps the light theme in a dark page.

:::

:button[Open](https://example.com){view="action" color="standard"}

:::

### Dark theme

:::banner{height="s" width="m" bg-image="assets/banner-bg-dark.svg" bg-theme="dark"}

::banner-title[Light text on a dark image]

:::banner-content

The content keeps the dark theme in a light page.

:::

:button[Open](https://example.com){view="action" color="standard"}

:::

### Blur

:::banner{height="s" width="m" align="center" vertical="top" bg-image="assets/banner-background.webp" bg-theme="light" bg-image-blur="true"}

::banner-title[A blurred background]

:::banner-content

The blur softens the shapes behind the text.

:::

:::

## Image

### Image on the left

:::banner{height="s" width="m" align="right" bg-color="blue-light"}

::banner-image{src="assets/banner-image-square.svg" alt="Chart"}

::banner-title[Quarterly report]

:::banner-content

A right-aligned text moves the image to the left.

:::

:button[Download](https://example.com/report){view="action" color="blue"}

:::

### Image and title

:::banner{height="s" width="m" bg-color="gray-light"}

::banner-image{src="assets/banner-image-wide.svg" alt="Office"}

::banner-title[Welcome aboard]

:::

## Buttons

### One button

:::banner{height="s" width="m" bg-color="gray-light"}

::banner-title[One button]

:button[Sign up](https://example.com){view="action" color="green"}

:::

### Two buttons

:::banner{height="s" width="m" bg-color="gray-light"}

::banner-title[Two buttons]

:button[Sign up](https://example.com){view="action" color="yellow"} :button[Learn more](https://example.com){view="normal" color="gray"}

:::

### Three buttons

:::banner{height="s" width="m" bg-color="gray-light"}

::banner-title[Three buttons]

:button[Sign up](https://example.com){view="action" color="red"} :button[Learn more](https://example.com){view="outline" color="blue"} :button[Skip]{view="flat" color="gray"}

:::

## Narrow layout

A banner narrower than 600 px stacks the image above the text and stacks long button labels and rows of three buttons: pick a mobile size in the **Viewport** toolbar of Storybook, or shrink the window.
`.trim();
