const knownImageHostsRegexString = '(avatars)';
const supportedImageExtensionsRegexString = '\\.(jpe?g|png|svgz?|gif|webp)';
const videoExtensions = '\\.(mp4|ogv|ogm|ogg|webm)';

export const imageUrlRegex = new RegExp(
    `^(?!.*${videoExtensions})https?:\\/\\/(\\S*?${supportedImageExtensionsRegexString}|${knownImageHostsRegexString}\\S+)$`,
);
export const imageNameRegex = new RegExp(`\\/([^/]*?)(${supportedImageExtensionsRegexString})?$`);
export const parseInsertedUrlAsImage = (text: string) =>
    imageUrlRegex.test(text)
        ? {
              imageUrl: text,
              title: text.match(imageNameRegex)?.[1],
          }
        : null;
