import {entityIdAttr} from 'src/utils/entity-id';
import {nodeTypeFactory} from 'src/utils/schema';

export enum GridBlockAttrs {
    // @ts-expect-error error TS18055
    EntityId = entityIdAttr,
    /** Array of grid blocks (see GridBlock type) */
    blocks = 'blocks',
    /** CSS rules applied to the grid viewport */
    containerCss = 'containerCss',
}

export const gridBlockNodeName = 'grid_block';
export const gridBlockNodeType = nodeTypeFactory(gridBlockNodeName);

export const GridBlockAction = 'createGridBlock';

export const GridBlockConsts = {
    NodeName: gridBlockNodeName,
    NodeAttrs: GridBlockAttrs,
    nodeType: gridBlockNodeType,
} as const;

export const defaultGridBlockEntityId = gridBlockNodeName + '#0';
