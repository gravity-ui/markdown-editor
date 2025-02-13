import {useEffect} from 'react';

import type {MarkdownEditorInstance} from '../../src';

export function useLogs(editor: MarkdownEditorInstance) {
    useEffect(() => {
        function onLogAction(data: MdEditorLogger.ActionData) {
            console.info(`Action: ${data.action}`, data);
        }

        editor.logger.on('log', console.log);
        editor.logger.on('warn', console.warn);
        editor.logger.on('error', console.error);
        editor.logger.on('metrics', console.info);
        editor.logger.on('action', onLogAction);

        return () => {
            editor.logger.off('log', console.log);
            editor.logger.off('warn', console.warn);
            editor.logger.off('error', console.error);
            editor.logger.off('metrics', console.info);
            editor.logger.off('action', onLogAction);
        };
    }, [editor]);
}
