type GetProportionalSizeParams = {
    width: number;
    height: number;
    imgMaxHeight: number;
};

export function getProportionalSize({
    width: _width,
    height: _height,
    imgMaxHeight,
}: GetProportionalSizeParams): {width: number; height: number} {
    let width = _width;
    let height = _height;
    const ratio = width / height;

    if (height > imgMaxHeight) {
        height = imgMaxHeight;
        width = Math.round(height * ratio);
    }

    return {width, height};
}
