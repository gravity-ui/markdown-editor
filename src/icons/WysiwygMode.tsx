import type {SVGProps} from 'react';
const WysiwygMode = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={16}
        height={16}
        fill="none"
        viewBox="0 0 16 16"
        {...props}
    >
        <path
            d="M5.25002 4.75L5.25002 11.25M5.25002 4.75L8.5 4.75M5.25002 4.75L2.00004 4.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
        />
        <path
            d="M12.5 3C12.5 3 12.5 9.57107 12.5 12.5M12.5 3L14 2M12.5 3L11 2M12.5 12.5L14 13.5M12.5 12.5L11 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
        />
    </svg>
);
export default WysiwygMode;
