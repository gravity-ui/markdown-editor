import React from 'react';

import {useTheme} from '@gravity-ui/uikit';

const GPTIcon = () => {
    const theme = useTheme();

    const gradient =
        theme === 'dark' || theme === 'dark-hc' ? (
            <>
                <stop stopColor="#FF7233" />
                <stop offset="1" stopColor="#D14DFF" />
            </>
        ) : (
            <>
                <stop stopColor="#FF5001" />
                <stop offset="1" stopColor="#BD00FF" />
            </>
        );

    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g clipPath="url(#clip0_1608_24154)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 6C0 2.68629 2.68629 -4.3454e-07 6 0C9.31371 4.3454e-07 12 2.68629 12 6C12 9.31371 9.31371 12 6 12C2.68629 12 -6.0141e-07 9.31371 0 6ZM14 16C12.8954 16 12 15.1046 12 14C12 12.8954 12.8954 12 14 12C15.1046 12 16 12.8954 16 14C16 15.1046 15.1046 16 14 16Z"
                    fill="url(#paint0_linear_1608_24154)"
                />
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_1608_24154"
                    x1="17.5"
                    y1="-1"
                    x2="2.5"
                    y2="13.5"
                    gradientUnits="userSpaceOnUse"
                >
                    {gradient}
                </linearGradient>
                <clipPath id="clip0_1608_24154">
                    <rect width="16" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};
export default GPTIcon;
