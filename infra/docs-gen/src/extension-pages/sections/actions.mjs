import {callsOf} from '../extension-graph.mjs';
import {codeList, section} from '../markdown.mjs';

/** Renders the action names of the extension. */
export function actionsSection({calls, actions}) {
    return section('### Actions', codeList(actions), callsOf(calls, 'addAction').length > 0);
}
