export {headingNodeName, headingLevelAttr} from './HeadingSpecs';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export enum HeadingAction {
    ToH1 = 'toH1',
    ToH2 = 'toH2',
    ToH3 = 'toH3',
    ToH4 = 'toH4',
    ToH5 = 'toH5',
    ToH6 = 'toH6',
}
