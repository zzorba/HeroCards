import React from 'react';
import { Node, OutputFunction, RenderState } from 'react-native-markdown-view';

import MarvelIcon from '../../assets/MarvelIcon';
import { isBig } from '../../styles/space';

import { WithIconName } from './types';

const BAD_ICON_NAMES: { [key: string]: string | undefined} = {
  Action: 'action',
  'per hero': 'per_hero',
};

export default function MarvelIconNode(
  node: Node & WithIconName,
  output: OutputFunction,
  state: RenderState
) {
  return (
    <MarvelIcon
      key={state.key}
      name={BAD_ICON_NAMES[node.name] || node.name}
      size={isBig ? 24 : 16}
      color="#000000"
    />
  );
}
