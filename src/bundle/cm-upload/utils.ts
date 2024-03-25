export async function getImageDimensions(imgFile: File) {
    const img = await loadImage(imgFile);
    return {width: img.naturalWidth, height: img.naturalHeight};
}

export async function loadImage(imgFile: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(imgFile);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = (_e, _s, _l, _c, error) => reject(error);
    });
}
