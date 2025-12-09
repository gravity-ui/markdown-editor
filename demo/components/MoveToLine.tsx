import {useState} from 'react';

import {Button, type DOMProps, Flex} from '@gravity-ui/uikit';

import {NumberInput} from 'src/index';

export type MoveToLineProps = DOMProps & {
    onClick: (value: number | undefined) => void;
};

export const MoveToLine: React.FC<MoveToLineProps> = function MoveToLine({
    style,
    className,
    onClick,
}) {
    const [line, setLine] = useState<number | undefined>(0);

    return (
        <Flex gap="1" style={style} className={className}>
            <NumberInput size="s" value={line} onUpdate={setLine} min={0} style={{width: '56px'}} />
            <Button size="s" onClick={() => onClick(line)}>
                Move to line
            </Button>
        </Flex>
    );
};
