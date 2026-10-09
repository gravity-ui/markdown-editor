import {useCallback, useState} from 'react';
import type {ReactNode} from 'react';

import {Dialog} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

export interface ConfirmOptions {
    title: string;
    message: ReactNode;
    /** Apply button label. Falls back to a generic "Continue". */
    confirmText?: string;
    cancelText?: string;
    /** Paint the confirm button red — use for destructive, irreversible actions. */
    danger?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface PendingConfirm extends ConfirmOptions {
    resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation dialog. Returns a `confirm()` that resolves to the
 * user's choice and a `confirmElement` that must be rendered once by the caller.
 */
export const useConfirm = (): {confirm: ConfirmFn; confirmElement: ReactNode} => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);

    const confirm = useCallback<ConfirmFn>(
        (options) =>
            new Promise<boolean>((resolve) => {
                setPending({...options, resolve});
            }),
        [],
    );

    const finish = (confirmed: boolean) => {
        if (!pending) return;
        pending.resolve(confirmed);
        setPending(null);
    };

    const confirmElement = pending ? (
        <Dialog
            open
            size="s"
            initialFocus="cancel"
            onClose={() => finish(false)}
            onEnterKeyDown={() => finish(true)}
        >
            <Dialog.Header caption={pending.title} />
            <Dialog.Body>{pending.message}</Dialog.Body>
            <Dialog.Footer
                preset={pending.danger ? 'danger' : 'default'}
                textButtonApply={pending.confirmText ?? i18n('continue')}
                textButtonCancel={pending.cancelText ?? i18n('cancel')}
                onClickButtonApply={() => finish(true)}
                onClickButtonCancel={() => finish(false)}
            />
        </Dialog>
    ) : null;

    return {confirm, confirmElement};
};
