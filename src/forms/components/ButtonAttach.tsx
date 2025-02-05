import {Button, ButtonProps, UseFileInputProps, useFileInput} from '@gravity-ui/uikit';

export type ButtonAttachProps = UseFileInputProps & {
    multiple?: boolean;
    buttonProps?: ButtonProps;
    accept?: HTMLInputElement['accept'];
    children?: React.ReactNode;
};

export const ButtonAttach: React.FC<ButtonAttachProps> = ({
    onUpdate,
    onChange,
    multiple,
    buttonProps,
    accept,
    children,
}) => {
    const {controlProps, triggerProps} = useFileInput({onUpdate, onChange});

    return (
        <>
            <input type="file" multiple={multiple} accept={accept} {...controlProps} />
            <Button {...buttonProps} {...triggerProps}>
                {children}
            </Button>
        </>
    );
};
