import {HeaderFormat, type HeaderFormatValue} from './const';

export type Blob = {
    width: number;
    height: number;
    right: number;
    /** Одна из вертикальных привязок; вторая остаётся `auto`. */
    top?: number;
    bottom?: number;
    radius: string;
    rotate: number;
};

/**
 * Курируемые раскладки (`seed = 0`) — те же числа, что в прототипе портала: дизайнер подбирал их
 * под конкретные паддинги, поэтому генератор их не воспроизводит.
 */
const CURATED: Record<HeaderFormatValue, Blob[]> = {
    [HeaderFormat.Large]: [
        {width: 360, height: 300, right: -96, top: 26, radius: '120px 120px 120px 200px', rotate: -20},
        {width: 190, height: 190, right: 250, top: 24, radius: '50%', rotate: 0},
        {width: 150, height: 150, right: 150, bottom: -56, radius: '50%', rotate: 0},
    ],
    [HeaderFormat.Small]: [
        {width: 228, height: 188, right: -70, top: -18, radius: '90px 90px 90px 150px', rotate: -20},
        {width: 108, height: 108, right: 170, top: -22, radius: '50%', rotate: 0},
        {width: 92, height: 92, right: 120, bottom: -46, radius: '50%', rotate: 0},
    ],
};

/** github.com/bryc/code/blob/master/jshash/PRNG.md — детерминированный PRNG на 32 бита. */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

type Profile = {count: [number, number]; size: [number, number]; right: [number, number]; y: [number, number]};

const PROFILES: Record<HeaderFormatValue, Profile[]> = {
    [HeaderFormat.Large]: [
        {count: [2, 3], size: [170, 240], right: [-130, 170], y: [-110, 120]},
        {count: [5, 7], size: [70, 130], right: [-60, 300], y: [-70, 150]},
        {count: [3, 5], size: [90, 200], right: [-100, 260], y: [-90, 130]},
    ],
    [HeaderFormat.Small]: [
        {count: [2, 3], size: [110, 170], right: [-90, 120], y: [-70, 70]},
        {count: [4, 6], size: [50, 95], right: [-40, 200], y: [-50, 80]},
        {count: [3, 4], size: [60, 140], right: [-70, 170], y: [-60, 75]},
    ],
};

function makeRadius(rand: () => number): string {
    const roll = rand();
    if (roll < 0.08) return '50%';
    if (roll < 0.32) {
        const corner = Math.round(55 + rand() * 45);
        const rest = Math.round(150 + rand() * 80);
        return `${rest}px ${rest}px ${corner}px ${rest}px`;
    }
    const p = () => Math.round(18 + rand() * 64);
    return `${p()}% ${p()}% ${p()}% ${p()}% / ${p()}% ${p()}% ${p()}% ${p()}%`;
}

export function getBlobs(seed: number, format: HeaderFormatValue): Blob[] {
    if (!seed) return CURATED[format];

    const rand = mulberry32(seed);
    const between = ([min, max]: [number, number]) => min + rand() * (max - min);

    const profiles = PROFILES[format];
    const profile = profiles[Math.floor(rand() * profiles.length)];
    const count = Math.round(between(profile.count));

    return Array.from({length: count}, () => {
        const width = Math.round(between(profile.size));
        const radius = makeRadius(rand);
        const y = Math.round(between(profile.y));
        return {
            width,
            height: radius === '50%' ? width : Math.round(width * (0.7 + rand() * 0.6)),
            right: Math.round(between(profile.right)),
            ...(y < 0 ? {bottom: -y} : {top: y}),
            radius,
            rotate: Math.round((rand() - 0.5) * 90),
        };
    });
}
