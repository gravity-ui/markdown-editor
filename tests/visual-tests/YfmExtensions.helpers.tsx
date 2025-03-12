import {PlaygroundMini} from '../../demo/components/PlaygroundMini';
import {markup} from '../../demo/stories/yfm/content';

export const Text = () => <PlaygroundMini initial={markup.textMarks} />;
export const TaskLists = () => <PlaygroundMini initial={markup.tasklist} />;
export const FoldingHeadings = () => <PlaygroundMini initial={markup.foldingHeadings} />;
export const YfmNotes = () => <PlaygroundMini initial={markup.yfmNotes} />;
export const YfmCut = () => <PlaygroundMini initial={markup.yfmCut} />;
export const YfmTabs = () => <PlaygroundMini initial={markup.yfmTabs} />;
export const YfmHtml = () => <PlaygroundMini initial={markup.yfmHtmlBlock} />;
export const YfmFile = () => <PlaygroundMini initial={markup.yfmFile} />;
export const YfmTable = () => <PlaygroundMini initial={markup.yfmTable} />;
export const LatexFormulas = () => <PlaygroundMini initial={markup.latexFormulas} />;
export const MermaidDiagram = () => <PlaygroundMini initial={markup.mermaidDiagram} />;
