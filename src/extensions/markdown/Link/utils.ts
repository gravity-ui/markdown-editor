import type {ExtensionDeps} from '../../../core';

const isString = (str: unknown): str is string => typeof str === 'string';
const notEmpty = (str: string): boolean => str.length > 0;

export const normalizeUrlFactory =
    ({parser}: ExtensionDeps) =>
    (url: string) => {
        if (isString(url)) {
            url = url.trim();
            if (notEmpty(url)) {
                url = parser.normalizeLink(url);
                if (parser.validateLink(url)) {
                    return {
                        url,
                        text: parser.normalizeLinkText(url),
                    };
                }
            }
        }
        return null;
    };
