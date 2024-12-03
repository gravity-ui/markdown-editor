import * as React from 'react';
import type {SVGProps} from 'react';
const TextColor = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16}
        height={16}
        fill="none"
        viewBox="0 0 16 16"
        {...props}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.0002 2.25C7.45455 2.25 6.96959 2.59776 6.79454 3.11457L4.28985 10.5094C4.15696 10.9017 4.36728 11.3275 4.7596 11.4604C5.15192 11.5932 5.57768 11.3829 5.71056 10.9906L6.3848 9L9.61561 9L10.2898 10.9906C10.4227 11.3829 10.8485 11.5932 11.2408 11.4604C11.6331 11.3275 11.8434 10.9017 11.7106 10.5094L9.20587 3.11457C9.03082 2.59776 8.54586 2.25 8.0002 2.25ZM9.10754 7.5L8.0002 4.23071L6.89286 7.5L9.10754 7.5Z"
            fill="currentColor"
        />
        <path
            d="M13 13.5L3 13.5"
            stroke="var(--g-md-text-color-icon-color, currentColor)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);
export default TextColor;
