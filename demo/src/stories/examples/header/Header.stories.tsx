import type {Meta, StoryObj} from '@storybook/react';

import {HeaderCatalogue, HeaderEditor} from './Header';

export const Catalogue: StoryObj = {render: () => <HeaderCatalogue />};

export const Editor: StoryObj = {render: () => <HeaderEditor />};

const meta: Meta = {title: 'Examples / Header'};
export default meta;
