import {useEffect, useLayoutEffect} from 'react';

const canUseDOM = Boolean(
    typeof window !== 'undefined' && window.document && window.document.createElement,
);

export const useClientLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;
