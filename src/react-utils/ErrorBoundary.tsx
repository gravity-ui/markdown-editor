import {ErrorBoundary} from 'react-error-boundary';

import {logger} from '../logger';

export const ErrorLoggerBoundary: React.FC<{children?: React.ReactNode}> = ({children}) => (
    <ErrorBoundary
        onError={(e) => {
            logger.error(e);
        }}
        fallbackRender={() => {
            return null;
        }}
    >
        {children}
    </ErrorBoundary>
);
