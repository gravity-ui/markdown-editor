import {HelpPopover} from '@gravity-ui/components';

import {ClassNameProps, cn} from '../../classname';

import './FormRow.scss';

const b = cn('form-row');

export type FormRowProps = ClassNameProps & {
    label: React.ReactNode;
    help?: React.ReactNode;
    control: React.ReactNode;
    controlClassName?: string;
};

export const FormRow: React.FC<FormRowProps> = ({
    className,
    label,
    help,
    control,
    controlClassName,
}) => {
    return (
        <div className={b(null, [className])}>
            <div className={b('label')}>
                <span className={b('label-text')}>{label}</span>
                {help && <HelpPopover content={help} className={b('label-help')} />}
            </div>
            <div className={b('control', [controlClassName])}>{control}</div>
        </div>
    );
};
