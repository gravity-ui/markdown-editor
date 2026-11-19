import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {oneChildPerHeader} from '../../../oneChildPerHeader';
import {headerImageNodeType} from '../../HeaderImageSpecs';

/** A banner keeps one image: a change that puts a second image into a banner is rejected. */
export const headerImageGuardPlugin = () =>
    new Plugin({filterTransaction: oneChildPerHeader(headerImageNodeType)});
