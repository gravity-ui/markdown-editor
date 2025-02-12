import {type FileItem, insertFiles} from '../../../markup/commands';
import {ToolbarFilePopup, type ToolbarFilePopupProps} from '../custom/ToolbarFilePopup';
import type {MToolbarBaseProps} from '../types';

import {useMarkupToolbarContext} from './context';

export type MToolbarFilePopupProps = MToolbarBaseProps &
    Pick<ToolbarFilePopupProps, 'anchorElement'> & {
        hide: () => void;
    };

export const MToolbarFilePopup: React.FC<MToolbarFilePopupProps> = ({
    focus,
    onClick,
    hide,
    anchorElement,
    editor,
    className,
}) => {
    const {uploadHandler} = useMarkupToolbarContext();

    return (
        <ToolbarFilePopup
            hide={hide}
            focus={focus}
            onClick={onClick}
            anchorElement={anchorElement}
            className={className}
            onSubmit={(fileParams) => insertFiles([fileParams])(editor.cm)}
            uploadHandler={uploadHandler}
            onSuccessUpload={(res) => {
                insertFiles(
                    res.success.map<FileItem>(({result, file}) => ({
                        src: result.url,
                        name: result.name ?? file.name,
                        type: result.type ?? file.type,
                    })),
                )(editor.cm);
            }}
        />
    );
};
