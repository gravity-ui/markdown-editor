import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {readMarkupSections, selectMarkupExamples} from '../../../src/stories/header/examples';

// A test file runs in Node, where the `?raw` import of the stories is not available.
const sections = readMarkupSections(
    readFileSync(join(__dirname, '../../../src/stories/header/fixtures/all-markup.md'), 'utf8'),
);

/** Examples of the Header syntax by the prefix of their id and their numbers. */
export const markupExamples = (prefix: string, first?: number, last?: number) =>
    selectMarkupExamples(sections, prefix, first, last);

/** A section of the examples by its title. */
export const markupSection = (title: string) =>
    sections.filter((section) => section.title === title);

/**
 * The size of a header belongs to the header tests; here the height and the padding are lowered
 * through the public properties, so that a screenshot holds many examples.
 */
export const compactHeaderStyles =
    ':root {--g-md-header-plugin-height-s: 72px; --g-md-header-plugin-padding: var(--g-spacing-4);}';

/**
 * A header as tall as its content with a small padding, so that a screenshot holds many
 * titles or descriptions.
 */
export const denseHeaderStyles =
    ':root {--g-md-header-plugin-height-s: 0px; --g-md-header-plugin-padding: var(--g-spacing-3); --g-md-header-plugin-margin-block: 0 var(--g-spacing-2);}';
