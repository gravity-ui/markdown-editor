import {IndexCarousel} from './IndexCarousel';

describe('IndexCarousel', () => {
    it('default current must be 0', () => {
        const carousel = new IndexCarousel(10);
        expect(carousel.current).toBe(0);
    });

    it('current must equal start', () => {
        const carousel = new IndexCarousel(10, 5);
        expect(carousel.current).toBe(5);
    });

    it('call next() must increment current', () => {
        const carousel = new IndexCarousel(10, 5);
        expect(carousel.next()).toBe(6);
        expect(carousel.current).toBe(6);
    });

    it('call prev() must decrement current', () => {
        const carousel = new IndexCarousel(10, 5);
        expect(carousel.prev()).toBe(4);
        expect(carousel.current).toBe(4);
    });

    it('call reset() must reset current to zero', () => {
        const carousel = new IndexCarousel(10, 5);
        carousel.reset();
        expect(carousel.current).toBe(0);
    });

    it('call reset() with newLength must overwrite inner length', () => {
        const carousel = new IndexCarousel(10, 5);
        carousel.reset(2);
        carousel.prev();
        expect(carousel.current).toBe(1);
    });

    it('if length is zero current must be -1', () => {
        const carousel = new IndexCarousel(0);
        expect(carousel.current).toBe(-1);
    });

    it('if length is zero call next() must return -1', () => {
        const carousel = new IndexCarousel(0);
        expect(carousel.next()).toBe(-1);
    });

    it('if length is zero call prev() must return -1', () => {
        const carousel = new IndexCarousel(0);
        expect(carousel.prev()).toBe(-1);
    });

    it('call next() must set current to first available index', () => {
        const carousel = new IndexCarousel(2, 1);
        expect(carousel.next()).toBe(0);
        expect(carousel.current).toBe(0);
    });

    it('call prev() must set current to last available index', () => {
        const carousel = new IndexCarousel(2, 0);
        expect(carousel.prev()).toBe(1);
        expect(carousel.current).toBe(1);
    });
});
