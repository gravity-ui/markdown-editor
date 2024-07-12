import {useThemeValue} from '@gravity-ui/uikit';

export const useYfmHtmlGravityStyles = () => {
    const theme = useThemeValue();

    return {
        slyles: {},
        innerClassName: theme,
    };
};
