import {useEffect, useRef, useState} from 'react';

export interface AutoSaveOptions {
    enabled?: boolean;
    delay?: number;
}

export interface UseAutoSaveProps {
    initialValue: string;
    onSave: (value: string, shouldClose?: boolean) => void;
    onClose: () => void;
    autoSave?: AutoSaveOptions;
}

export interface UseAutoSaveReturn {
    value: string;
    hasUnsavedChanges: boolean;
    handleChange: (newValue: string) => void;
    handleManualSave: () => void;
    handleClearTimeout: () => void;
    isAutoSaveEnabled: boolean;
    isSaveDisabled: boolean;
}

const DEFAULT_AUTOSAVE = {
    enabled: true,
    delay: 500,
};

/**
 * autosave functionality for extensions with edit block
 */
export const useAutoSave = ({
    autoSave,
    initialValue,
    onClose,
    onSave,
}: UseAutoSaveProps): UseAutoSaveReturn => {
    const {enabled: autoSaveEnabled, delay: autoSaveDelay} = autoSave ?? DEFAULT_AUTOSAVE;
    const isAutoSaveEnabled = Boolean(autoSaveEnabled);

    const [value, setValue] = useState(initialValue || '');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

    const handleClearTimeout = () => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    };

    const handleChange = (newValue: string) => {
        setValue(newValue);
        const hasChanges = newValue !== initialValue;
        setHasUnsavedChanges(hasChanges);

        if (isAutoSaveEnabled && hasChanges) {
            handleClearTimeout();

            const delay = autoSaveDelay ?? DEFAULT_AUTOSAVE.delay;
            autoSaveTimeoutRef.current = setTimeout(() => {
                onSave(newValue);
                setHasUnsavedChanges(false);
            }, delay);
        }
    };

    const handleManualSave = () => {
        handleClearTimeout();
        onSave(value);
        onClose();
    };

    // сleanup timeout on unmount
    useEffect(() => {
        return () => {
            handleClearTimeout();
        };
    }, []);

    const isSaveDisabled = isAutoSaveEnabled && !hasUnsavedChanges;

    return {
        value,
        hasUnsavedChanges,
        handleChange,
        handleManualSave,
        handleClearTimeout,
        isAutoSaveEnabled,
        isSaveDisabled,
    };
};
