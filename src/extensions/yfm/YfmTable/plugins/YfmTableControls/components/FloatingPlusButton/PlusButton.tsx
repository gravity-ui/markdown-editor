import {useEffect} from 'react';

import {Plus as PlusIcon} from '@gravity-ui/icons';
import {Button, Flex, Icon, type QAProps} from '@gravity-ui/uikit';

import {useBooleanState} from 'src/react-utils';

export type PlusButtonProps = QAProps & {
    onClick: () => void;
    onHoverChange: (hover: boolean) => void;
};

export const PlusButton: React.FC<PlusButtonProps> = function YfmTablePlusButton({
    qa,
    onClick,
    onHoverChange,
}) {
    const [hovered, setHovered, unsetHovered] = useBooleanState(false);
    useEffect(() => {
        onHoverChange(hovered);
    }, [hovered, onHoverChange]);

    return (
        <Flex
            centerContent
            width={20} // xs button
            height={20} // xs button
            onMouseEnter={setHovered}
            onMouseLeave={unsetHovered}
            style={{
                borderRadius: '100px', // button circle border radius
                backgroundColor: hovered ? 'var(--g-color-base-background)' : undefined,
            }}
        >
            <Button
                qa={qa}
                size="xs"
                pin="circle-circle"
                view={hovered ? 'outlined-action' : 'normal'}
                onClick={onClick}
                style={{
                    '--g-button-height': hovered ? undefined : '4px',
                    '--_--background-color-hover': hovered
                        ? 'var(--g-color-base-background)'
                        : undefined,
                    color: hovered ? undefined : 'var(--g-color-base-generic)',
                }}
            >
                <Icon data={PlusIcon} />
            </Button>
        </Flex>
    );
};
