import {Ghost} from '@gravity-ui/icons';
import {Button, Popup} from '@gravity-ui/uikit';

type Props = {
    onClose: () => void;
};

export function renderPopup(anchor: HTMLElement, props: Props) {
    return (
        <Popup open anchorRef={{current: anchor}}>
            <div style={{padding: '4px 8px', display: 'flex', alignItems: 'center'}}>
                <Ghost width={'16px'} height={'16px'} />
                <Button view="action" onClick={props.onClose} style={{marginLeft: '4px'}}>
                    Hide me
                </Button>
            </div>
        </Popup>
    );
}
