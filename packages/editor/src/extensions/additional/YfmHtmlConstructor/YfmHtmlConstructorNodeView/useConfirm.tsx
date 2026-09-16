import {useCallback, useEffect, useRef, useState} from 'react';
import type {ReactNode} from 'react';

import {Dialog} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

export interface ConfirmOptions {
    title: string;
    message: ReactNode;
    /** Apply button label. Falls back to a generic "Continue". */
    confirmText?: string;
    cancelText?: string;
    /** Use the destructive action style. */
    danger?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface PendingConfirm extends ConfirmOptions {
    resolve: (confirmed: boolean) => void;
}

/** Pending confirmations are canceled when replaced or unmounted. */
export const useConfirm = (): {confirm: ConfirmFn; confirmElement: ReactNode} => {
    const [pending, setPending] = useState<PendingConfirm | null>(null);
    const pendingRef = useRef<PendingConfirm | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            pendingRef.current?.resolve(false);
            pendingRef.current = null;
        };
    }, []);

    const confirm = useCallback<ConfirmFn>((options) => {
        if (!mountedRef.current) return Promise.resolve(false);
        pendingRef.current?.resolve(false);

        return new Promise<boolean>((resolve) => {
            const next = {...options, resolve};
            pendingRef.current = next;
            setPending(next);
        });
    }, []);

    const finish = (confirmed: boolean) => {
        const current = pendingRef.current;
        if (!current) return;
        pendingRef.current = null;
        current.resolve(confirmed);
        setPending(null);
    };

    const confirmElement = pending ? (
        <Dialog open size="s" initialFocus="cancel" onClose={() => finish(false)}>
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
