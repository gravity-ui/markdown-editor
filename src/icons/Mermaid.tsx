import type {SVGProps} from 'react';
const Mermaid = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={491}
        height={491}
        viewBox="0 0 491 491"
        style={{
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            strokeLinejoin: 'round',
            strokeMiterlimit: 2,
        }}
        {...props}
    >
        <path
            d="M 490.16 405.55 C 490.16 452.248 452.248 490.16 405.55 490.16 L 84.61 490.16 C 37.912 490.16 0 452.248 0 405.55 L 0 84.61 C 0 37.912 37.912 0 84.61 0 L 405.55 0 C 452.248 0 490.16 37.912 490.16 84.61 Z M 407.48 111.18 C 335.587 108.103 269.573 152.338 245.08 220 C 220.587 152.338 154.573 108.103 82.68 111.18 C 80.285 168.229 107.577 222.632 154.74 254.82 C 178.908 271.419 193.35 298.951 193.27 328.27 L 193.27 379.13 L 296.9 379.13 L 296.9 328.27 C 296.816 298.953 311.255 271.42 335.42 254.82 C 382.596 222.644 409.892 168.233 407.48 111.18 Z"
            fill="currentColor"
        />
    </svg>
);
export default Mermaid;
