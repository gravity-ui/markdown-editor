import {useEffect, useRef} from 'react';

import {ChevronRight, BucketPaint as ColorPalette} from '@gravity-ui/icons';
import {Icon, Menu, Popup, sp} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';
import {useBooleanState, useElementState} from 'src/react-utils';

import {CellBgPalette} from '../CellBgPalette';

const CLOSE_DELAY = 120;

export type CellBgMenuItemProps = {
    qa?: string;
    currentCellBg?: string | null;
    onCellBgChange: (color: string | null) => void;
};

export const CellBgMenuItem: React.FC<CellBgMenuItemProps> = function YfmTableCellBgMenuItem({
    qa,
    currentCellBg,
    onCellBgChange,
}) {
    const [anchorElement, setAnchorElement] = useElementState<HTMLDivElement>();
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [open, openPopup, closePopup] = useBooleanState(false);

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };
    const scheduleClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(closePopup, CLOSE_DELAY);
    };

    useEffect(() => () => cancelClose(), []);

    return (
        <Menu.Item
            qa={qa}
            ref={setAnchorElement}
            iconStart={<Icon data={ColorPalette} />}
            iconEnd={<Icon data={ChevronRight} />}
            onClick={() => {
                cancelClose();
                openPopup();
            }}
            extraProps={{
                onMouseEnter: () => {
                    cancelClose();
                    openPopup();
                },
                onMouseLeave: scheduleClose,
            }}
        >
            {i18n('cells.bg')}
            <Popup
                open={open}
                hasArrow={false}
                placement="right-start"
                anchorElement={anchorElement}
            >
                <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose} className={sp({p: 2})}>
                    <CellBgPalette value={currentCellBg} onSelect={onCellBgChange} />
                </div>
            </Popup>
        </Menu.Item>
    );
};
