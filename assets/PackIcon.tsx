import React from 'react';

import MarvelIcon from './MarvelIcon';

interface Props {
  pack_code: string;
  size: number;
  color: string;
}

export default function PackIcon({ pack_code, size, color }: Props) {
  return (
    <MarvelIcon
      name={pack_code}
      size={size}
      color={color}
    />
  );
}
