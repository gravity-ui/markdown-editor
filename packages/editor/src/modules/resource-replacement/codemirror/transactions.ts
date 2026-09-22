import {Transaction} from '@codemirror/state';

import {isHistoryTransaction} from '../../../markup/codemirror/history-lock';

import {resolved} from './const';

export {isHistoryTransaction};

export function isOriginalLocalDocumentChange(tr: Transaction) {
    return (
        tr.docChanged &&
        !tr.annotation(resolved) &&
        !tr.annotation(Transaction.remote) &&
        !isHistoryTransaction(tr)
    );
}
