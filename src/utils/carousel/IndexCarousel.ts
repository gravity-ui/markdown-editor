export class IndexCarousel {
    private static isValidLength(value: number) {
        return Number.isSafeInteger(length) && value >= 0;
    }

    private length: number;
    private _current = 0;

    constructor(length: number, start?: number) {
        if (!IndexCarousel.isValidLength(length)) {
            throw new Error('IndexCarousel: length must be greater or equal zero');
        }
        this.length = length;

        if (start !== undefined) {
            if (!Number.isSafeInteger(start)) {
                throw new Error('IndexCarousel: start must be safe integer');
            }
            if (start < 0) throw new Error('IndexCarousel: start must be greater or equal zero');
            if (start >= length) throw new Error('IndexCarousel: start must be lower than length');
            this.current = start;
        }
    }

    get current() {
        if (this.length <= 0) return -1;
        return this._current;
    }

    set current(value: number) {
        if (value < 0 || value >= this.length) {
            throw new Error('IndexCarousel: new current must be in the range from 0 to length-1');
        }
        this._current = value;
    }

    next() {
        if (this.length <= 0) return -1;
        let next = this.current + 1;
        next %= this.length;
        this.current = next;
        return next;
    }

    prev() {
        if (this.length <= 0) return -1;
        let prev = this.current - 1;
        prev += this.length;
        prev %= this.length;
        this.current = prev;
        return prev;
    }

    reset(newLength?: number) {
        if (newLength !== undefined) {
            if (!IndexCarousel.isValidLength(newLength)) {
                throw new Error('IndexCarousel: newLength must be greater or equal zero');
            }
            this.length = newLength;
        }
        this.current = 0;
    }
}
