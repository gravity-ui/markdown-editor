import {ClassNameProps, cn} from '../../classname';

import './Form.scss';

const b = cn('form');

export type FormProps = ClassNameProps & {
    children?: React.ReactNode;
};

export const Form: React.FC<FormProps> = ({className, children}) => {
    return <div className={b(null, [className])}>{children}</div>;
};
