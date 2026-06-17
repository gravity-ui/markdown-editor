import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum GridBlockTemplatesAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    /** Array of grid blocks. */
    blocks = 'blocks',
    /** CSS rules with selectors, scoped to this grid instance. */
    customCss = 'customCss',
}

export const gridBlockTemplatesNodeName = 'grid_block_templates';
export const gridBlockTemplatesNodeType = nodeTypeFactory(gridBlockTemplatesNodeName);

export const GridBlockTemplatesAction = 'createGridBlockTemplates';

export const GridBlockTemplatesConsts = {
    NodeName: gridBlockTemplatesNodeName,
    NodeAttrs: GridBlockTemplatesAttrs,
    nodeType: gridBlockTemplatesNodeType,
} as const;

export const defaultGridBlockTemplatesEntityId = gridBlockTemplatesNodeName + '#0';
