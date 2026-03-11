// hack to allow using generic components with memo

import {memo} from 'react';

// DO NOT TRY TO PASS GENERIC PARAMETERS TO THIS FUNCTION!
export const typedMemo: <Props extends object, Return extends React.ReactNode>(
    Component: (props: Props) => Return,
    compare?: (prevProps: Props, newProps: Props) => boolean,
) => (props: Props) => Return = memo;
