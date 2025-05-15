## useFilesGallery

The hook for opening the gallery from html content with images and videos

### PropTypes

_GalleryProvider_:

| Property     | Type                          | Required | Values | Default | Description         |
| :----------- | :---------------------------- | :------- | :----- |:--------| :------------------ |
| theme        | `ThemeProviderProps['theme']` |          |        |         | The gallery theme   |
| className    | `String`                      |          |        |         | The modal class     |
| container    | `HTMLElement`                 |          |        |         | The modal container |
| emptyMessage | `String`                      |          |        | No data | No data message     |

_useFilesGallery_

| Property    | Type                                 | Required | Values | Default | Description                                                                                                                 |
| :---------- | :----------------------------------- | :------- | :----- | :------ | :-------------------------------------------------------------------------------------------------------------------------- |
| customFiles | `(GalleryItem & { url?: string })[]` |          |        |         | The additional files list (pass the url to be able to exclude the items from content if they are found in the custom files) |

_useFilesGallery returns function `openFilesGallery` with the following args_:

| Property | Type                               | Required | Values | Default | Description     |
| :------- | :--------------------------------- | :------- | :----- | :------ | :-------------- |
| event    | `React.MouseEvent<HTMLDivElement>` | Yes      |        |         | The click event |

### Usage

First you should install @gravity-ui/components library and wrap your content into the GalleryProvider to be able to use the hook

```tsx
import {GalleryProvider} from '@gravity-ui/components';

<GalleryProvider theme="dark" emptyMessage="Seems like your gallery is empty!">
  children
</GalleryProvider>;
```

Then use the hook inside your component

```tsx
import {YfmStaticView, useFilesGallery} from '@gravity-ui/markdown-editor/view';

const {openFilesGallery} = useFilesGallery();


<div onClick={openFilesGallery}>
  <YfmStaticView {...props} />
</div>;
```

If you want to display some custom files, which are not inside the content, provide them with arguments (if the custom file url is equal to the file url from content, the custom file config will be applied instead)

```tsx
import {YfmStaticView, useFilesGallery} from '@gravity-ui/markdown-editor/view';
import {getGalleryItemImage} from '@gravity-ui/components'

const customImages = [
  'https://i.pinimg.com/originals/d8/bd/b4/d8bdb45a931b4265bec8e8d3f15021bf.jpg',
  'https://i.pinimg.com/originals/c2/31/a0/c231a069c5e24099723564dae736f438.jpg',
];

const customFiles = customImages.map((image) => ({
  url: image,
  ...getGalleryItemImage({src: image, name: image}),
}));

const {openFilesGallery} = useFilesGallery(customFiles);

<div onClick={openFilesGallery}>
  <YfmStaticView {...props} />
</div>;
```
