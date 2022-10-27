import './toMatchNode';

// fix from https://github.com/jsdom/jsdom/issues/3002
document.createRange = () => {
    const range = new Range();
    range.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON() {
            return JSON.stringify(this);
        },
    });
    range.getClientRects = () => ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: jest.fn(),
    });
    return range;
};
