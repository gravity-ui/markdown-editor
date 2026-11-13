import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';
import {buttonDefaults} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../i18n';

export const insertButton: StateCommand = ({state, dispatch}) => {
    const {view, color} = buttonDefaults;
    const markup = `:button[${i18n('button-placeholder')}]{view="${view}" color="${color}"}`;
    dispatch(state.update(state.replaceSelection(markup), {scrollIntoView: true}));
    return true;
};
