import {ArrayCarousel} from './ArrayCarousel';

describe('ArrayCarousel', () => {
    it('array getter should return original array', () => {
        const array = [1];
        const carousel = new ArrayCarousel(array);
        expect(carousel.array === array).toBe(true);
    });

    it('original array should not mutate', () => {
        const array = [1];
        const carousel = new ArrayCarousel(array);
        expect(carousel.array).toStrictEqual([1]);
    });

    it('default index should be 0', () => {
        const carousel = new ArrayCarousel([1, 2, 3]);
        expect(carousel.currentIndex).toBe(0);
    });

    it('should get right item', () => {
        const carousel = new ArrayCarousel([1, 2, 3]);
        expect(carousel.currentItem).toBe(1);
    });

    it('should increment index after next()', () => {
        const carousel = new ArrayCarousel(['1', '2', '3']);
        carousel.next();
        expect(carousel.currentIndex).toBe(1);
        expect(carousel.currentItem).toBe('2');
    });

    it('should decrement index after prev()', () => {
        const carousel = new ArrayCarousel(['1', '2', '3']);
        carousel.next().next().prev();
        expect(carousel.currentIndex).toBe(1);
        expect(carousel.currentItem).toBe('2');
    });

    it('should change current index', () => {
        const carousel = new ArrayCarousel(['1', '2', '3']);
        carousel.currentIndex = 1;
        expect(carousel.currentIndex).toBe(1);
        expect(carousel.currentItem).toBe('2');
    });

    it('should set first index', () => {
        const carousel = new ArrayCarousel(['1', '2', '3']);
        carousel.currentIndex = 2;
        carousel.next();
        expect(carousel.currentIndex).toBe(0);
        expect(carousel.currentItem).toBe('1');
    });

    it('should set last index', () => {
        const carousel = new ArrayCarousel(['1', '2', '3']);
        carousel.prev();
        expect(carousel.currentIndex).toBe(2);
        expect(carousel.currentItem).toBe('3');
    });

    it('currentIndex must by -1 for empty array', () => {
        const carousel = new ArrayCarousel([]);
        expect(carousel.currentIndex).toBe(-1);
    });

    it('currentItem must by undefined for empty array', () => {
        const carousel = new ArrayCarousel([]);
        expect(carousel.currentItem).toBeUndefined();
    });
});
