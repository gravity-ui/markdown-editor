const knownImageHostsRegexString = '(jing|avatars)';

const supportedImageExtensionsRegexString = '\\.(jpe?g|png|svgz?|gif|webp)';

export const imageUrlRegex = new RegExp(
    `^https?:\\/\\/(\\S*?${supportedImageExtensionsRegexString}|${knownImageHostsRegexString}\\S+)$`,
);

export const imageNameRegex = new RegExp(`\\/([^/]*?)(${supportedImageExtensionsRegexString})?$`);

export const parseInsertedUrlAsImage = (text: string) =>
    imageUrlRegex.test(text) ? {imageUrl: text, title: text.match(imageNameRegex)?.[1]} : null;
