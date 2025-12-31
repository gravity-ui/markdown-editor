import {Button} from '@gravity-ui/uikit';

import {type ClassNameProps, cn} from '../../classname';
import {i18n} from '../../i18n/forms';

import './FormFooter.scss';

const b = cn('form-footer');

export type FormFooterProps = ClassNameProps & {
    onCancel?(): void;
    onSubmit?(): void;
    children?: React.ReactNode;
};

export const FormFooter: React.FC<FormFooterProps> = ({
    className,
    onCancel,
    onSubmit,
    children,
}) => {
    return (
        <div className={b(null, [className])}>
            {onCancel && (
                <Button size="s" view="flat-secondary" onClick={onCancel}>
                    {i18n('common_action_cancel')}
                </Button>
            )}
            {onSubmit && (
                <Button size="s" view="action" onClick={onSubmit}>
                    {i18n('common_action_submit')}
                </Button>
            )}
            {children}
        </div>
    );
};
