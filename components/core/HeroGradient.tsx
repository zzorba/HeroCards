import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

interface HeroColor {
  primary: string;
  secondary: string;
  accent: string;
}

const HERO_GRADIENTS: {
  [card_set_code: string]: HeroColor | undefined;
} = {
  'spider_man': {
    primary: '#7F1A20',
    secondary: '#1F266B',
    accent: '#dddddd',
  },
  'captain_marvel': {
    primary: '#202366',
    accent: '#EEE31E',
    secondary: '#7A201B',
  },
  'she_hulk': {
    primary: '#3A1D5D',
    accent: '#dddddd',
    secondary: '#15612F',
  },
  'iron_man': {
    primary: '#901a1a',
    accent: '#F4EA15',
    secondary: '#901a1a',
  },
  'black_panther': {
    primary: '#431960',
    accent: '#F7EB1F',
    secondary: '#431960',
  },
  'captain_america': {
    primary: '#124A7F',
    accent: '#FFFFFF',
    secondary: '#A2131C',
  },
  'ms_marvel': {
    primary: '#ce1721',
    accent: '#F6DC0B',
    secondary: '#297BB1',
  },
};

interface Props {
  card_set_code: string | null;
  style?: ViewStyle;
  children?: ReactNode;
  color: 'primary' | 'secondary' | 'accent';
}

export default function HeroGradient({
  card_set_code,
  style,
  children,
  color,
}: Props) {
  const colors = (
    card_set_code &&
    HERO_GRADIENTS[card_set_code]
  ) || {
    primary: '#202366',
    accent: '#EEE31E',
    secondary: '#7A201B',
  };
  return (
    <View
      style={[style, { backgroundColor: colors[color] }]}
    >
      { children }
    </View>
  );
}
