import {readMarkupSections} from './examples';
import source from './fixtures/all-markup.md?raw';

/** Every example of the Header syntax, section by section. */
export const markupSections = readMarkupSections(source);
