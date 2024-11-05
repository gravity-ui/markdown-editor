import {initialMdContent} from '../constants/md-content';

import {parseLocation} from './location';

export const getInitialMd = () => parseLocation() || initialMdContent;
