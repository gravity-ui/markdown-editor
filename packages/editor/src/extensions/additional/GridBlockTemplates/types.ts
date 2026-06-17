export type GridBlock = {
    id: string;
    /** Inline CSS applied to this block. */
    css: string;
    /** Raw HTML content rendered inside the block. */
    content: string;
};

export type GridBlockTemplateType = 'block' | 'container';

export type GridBlockTemplateBlock = Omit<GridBlock, 'id'>;

interface GridBlockTemplateBase {
    id: string;
    title: string;
    type: GridBlockTemplateType;
    /** Original template inner HTML. */
    content: string;
}

export interface GridBlockBlockTemplate extends GridBlockTemplateBase {
    type: 'block';
    block: GridBlockTemplateBlock;
}

export interface GridBlockContainerTemplate extends GridBlockTemplateBase {
    type: 'container';
    containerCss: string;
    blocks: GridBlockTemplateBlock[];
}

export type GridBlockTemplate = GridBlockBlockTemplate | GridBlockContainerTemplate;

export interface GridBlockTemplatesOptions {
    /** Templates provided via extension options; read-only source. */
    items?: GridBlockTemplate[];
    /** Show the container templates button in the block toolbar. */
    showButton?: boolean;
    /** Show the "add template" button (writes to localStorage). */
    allowAdd?: boolean;
}
