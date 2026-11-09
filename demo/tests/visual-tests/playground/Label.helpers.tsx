import {labelToolbarsPreset} from '../../../src/defaults/toolbars';

import {Playground} from './Playground.helpers';

/** The playground with the label button in the main toolbar. */
export const LabelPlayground = ({initial}: {initial: string}) => (
    <Playground
        initial={initial}
        toolbarsPreset={labelToolbarsPreset}
        width="100%"
        style={{width: 812}}
    />
);
