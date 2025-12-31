import {IndexCarousel} from './IndexCarousel';

export class ArrayCarousel<T> {
    private _array: readonly T[];
    private indexCarousel: IndexCarousel;

    constructor(array: readonly T[]) {
        if (!Array.isArray(array)) {
            throw new Error('ArrayCarousel: "array" argument must be array');
        }
        this._array = array;
        this.indexCarousel = new IndexCarousel(array.length);
    }

    get array(): readonly T[] {
        return this._array;
    }

    get currentIndex(): number {
        return this.indexCarousel.current;
    }

    set currentIndex(value: number) {
        this.indexCarousel.current = value;
    }

    get currentItem(): T | undefined {
        return this.array[this.currentIndex];
    }

    next(): this {
        this.indexCarousel.next();
        return this;
    }

    prev(): this {
        this.indexCarousel.prev();
        return this;
    }
}
