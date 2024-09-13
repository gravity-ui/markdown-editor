import React from 'react';

const GPTLoading = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
        <circle cx="8" cy="8" r="6" fill="url(#paint0_linear_1608_24154)">
            <animateMotion
                fill="url(#paint0_linear_1608_24154)"
                begin="0s"
                dur="1150ms"
                path="M 0 0 a 1 3 145 0 1 8 8 a 1 3 145 0 1 -8 -8"
                repeatCount="indefinite"
            />
            <animate attributeName="r" dur="1150ms" repeatCount="indefinite" values="6; 2; 6" />
        </circle>
        <circle cx="16" cy="16" r="2" fill="url(#paint0_linear_1608_24154)">
            <animateMotion
                fill="url(#paint0_linear_1608_24154)"
                begin="0s"
                dur="1150ms"
                path="M 0 0 a 1.2 2.7 157 0 1 -5 -6.7 a 1.2 2.7 157 0 1 5 6.7"
                repeatCount="indefinite"
            />
            <animate attributeName="r" dur="1150ms" repeatCount="indefinite" values="2; 6; 2" />
        </circle>
    </svg>
);

export default GPTLoading;
