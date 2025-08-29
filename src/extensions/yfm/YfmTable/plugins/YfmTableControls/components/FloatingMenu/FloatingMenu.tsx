import {useState} from 'react';

import {Ellipsis as DotsColumn, GripHorizontal as GripColumn} from '@gravity-ui/icons';
import {
    Button,
    type ButtonButtonProps,
    DropdownMenu,
    type DropdownMenuProps,
    Flex,
    Icon,
} from '@gravity-ui/uikit';

import {useBooleanState} from 'src/react-utils';

import {FloatingPopup, type FloatingPopupProps} from '../FloatingPopup';

const popupOffset: FloatingPopupProps['offset'] = {
    mainAxis: -9.5,
};

export type FloatingMenuProps = {
    dirtype: 'row' | 'column';
    canDrag: boolean;
    anchorElement: Element;
    dropdownItems: DropdownMenuProps<unknown>['items'];
    switcherMouseProps?: Pick<ButtonButtonProps, 'onMouseDown' | 'onMouseMove' | 'onMouseUp'>;
    onOpenToggle: NonNullable<DropdownMenuProps<unknown>['onOpenToggle']>;
};

export const FloatingMenu: React.FC<FloatingMenuProps> = function YfmTableFloatingMenu(props) {
    const {dirtype, canDrag, anchorElement, dropdownItems, switcherMouseProps, onOpenToggle} =
        props;

    const [isMenuOpened, setMenuOpened] = useState(false);
    const [isHovered, setHovered, unsetHovered] = useBooleanState(false);

    const showActionView = isMenuOpened || isHovered;
    const isRowType = dirtype === 'row';

    return (
        <FloatingPopup
            open
            offset={popupOffset}
            anchorElement={anchorElement}
            placement={isRowType ? 'left' : 'top'}
            floatingStyles={{
                lineHeight: 'initial',
            }}
            style={{
                backgroundColor: 'transparent',
            }}
        >
            <DropdownMenu
                onOpenToggle={(...args) => {
                    setMenuOpened(...args);
                    onOpenToggle(...args);
                }}
                renderSwitcher={(switcherProps) => (
                    <Flex
                        centerContent
                        width={20} // xs button
                        height={20} // xs button
                        style={{
                            borderRadius: 'var(--g-border-radius-xs)',
                            backgroundColor: showActionView
                                ? 'var(--g-color-base-background)'
                                : undefined,
                        }}
                        onMouseEnter={setHovered}
                        onMouseLeave={unsetHovered}
                    >
                        <Button
                            style={{
                                cursor: canDrag ? 'grab' : undefined,
                                transform: isRowType ? 'rotate(90deg)' : undefined,
                                '--g-button-height': showActionView ? undefined : '5px',
                                '--_--background-color': showActionView
                                    ? undefined
                                    : 'var(--g-color-base-background)',
                            }}
                            view={isMenuOpened ? 'outlined-action' : 'outlined'}
                            pin={showActionView ? 'round-round' : 'circle-circle'}
                            size="xs"
                            qa={isRowType ? 'g-md-yfm-table-row-btn' : 'g-md-yfm-table-column-btn'}
                            {...switcherProps}
                            {...switcherMouseProps}
                        >
                            {showActionView ? (
                                <Icon data={canDrag ? GripColumn : DotsColumn} />
                            ) : (
                                String.fromCharCode(8194) // en space
                            )}
                        </Button>
                    </Flex>
                )}
                popupProps={{
                    zIndex: 1010,
                    placement: isRowType ? 'right-start' : 'bottom-start',
                }}
                menuProps={{qa: `g-md-yfm-table-${dirtype}-menu`}}
                items={dropdownItems}
            />
        </FloatingPopup>
    );
};
