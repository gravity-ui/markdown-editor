import type {SVGProps} from 'react';
const Mono = (props: SVGProps<SVGSVGElement>) => (
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
            d="M3.5 3.88862V13.25C3.5 13.6642 3.16421 14 2.75 14C2.33579 14 2 13.6642 2 13.25V3.32392C2 2.59274 2.59274 2 3.32392 2C3.75884 2 4.16601 2.21361 4.41321 2.57145L8 7.76376L11.5868 2.57145C11.834 2.21361 12.2412 2 12.6761 2C13.4073 2 14 2.59274 14 3.32392V13.25C14 13.6642 13.6642 14 13.25 14C12.8358 14 12.5 13.6642 12.5 13.25V3.88862L8.61708 9.50961C8.47705 9.71232 8.24638 9.83333 8 9.83333C7.75362 9.83333 7.52295 9.71232 7.38292 9.50961L3.5 3.88862Z"
            fill="currentColor"
        />
    </svg>
);
export default Mono;
