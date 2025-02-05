import type {SVGProps} from 'react';
const Tabs = (props: SVGProps<SVGSVGElement>) => (
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
            d="M5.25 3.5L4 3.5C3.17157 3.5 2.5 4.17157 2.5 5L2.5 11C2.5 11.8284 3.17157 12.5 4 12.5L12 12.5C12.8284 12.5 13.5 11.8284 13.5 11L13.5 7L10 7L6 7C5.80109 7 5.61032 6.92098 5.46967 6.78033C5.32902 6.63968 5.25 6.44891 5.25 6.25L5.25 3.5ZM6.75 3.5L9.25 3.5L9.25 5.5L6.75 5.5L6.75 3.5ZM10.75 3.5L12 3.5C12.8284 3.5 13.5 4.17157 13.5 5L13.5 5.5L10.75 5.5L10.75 3.5ZM15 5C15 3.34315 13.6569 2 12 2L4 2C2.34315 2 0.999999 3.34314 0.999999 5L0.999998 11C0.999998 12.6569 2.34314 14 4 14L12 14C13.6569 14 15 12.6569 15 11L15 5Z"
            fill="currentColor"
        />
    </svg>
);
export default Tabs;
