import {markup} from '../defaults/content';

import {parseLocation} from './location';

export const getInitialMd = () => parseLocation() || markup;
