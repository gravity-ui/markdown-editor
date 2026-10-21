import {Label} from '@gravity-ui/uikit';

import {Playground} from './Playground.helpers';

type LabelPlaygroundProps = {
    initial: string;
};

/** The playground and a UIKit `Label` of the same theme and size, to compare computed styles. */
export const LabelPlayground = ({initial}: LabelPlaygroundProps) => (
    <div>
        <Playground initial={initial} width="100%" style={{width: 812}} />
        <Label className="native-label" theme="info" size="xs">
            Draft
        </Label>
    </div>
);
