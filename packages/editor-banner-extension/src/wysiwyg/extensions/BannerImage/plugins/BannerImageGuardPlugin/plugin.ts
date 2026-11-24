import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {oneChildPerBanner} from '../../../oneChildPerBanner';
import {bannerImageNodeType} from '../../BannerImageSpecs';

/** A banner keeps one image: a change that puts a second image into a banner is rejected. */
export const bannerImageGuardPlugin = () =>
    new Plugin({filterTransaction: oneChildPerBanner(bannerImageNodeType)});
