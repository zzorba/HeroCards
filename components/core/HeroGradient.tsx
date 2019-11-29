import React, { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


const HERO_GRADIENTS: {
  [card_set_code: string]: string[] | undefined;
} = {
  'spider_man': [
    '#7F1A20',
    '#dddddd',
    '#1F266B',
    '#1F266B',
  ],
  'captain_marvel': [
    '#202366',
    '#EEE31E',
    '#7A201B',
    '#7A201B',
  ],
  'she_hulk': [
    '#3A1D5D',
    '#dddddd',
    '#15612F',
    '#15612F',
  ],
  'iron_man': [
    '#901a1a',
    '#F4EA15',
    '#901a1a',
    '#901a1a',
  ],
  'black_panther': [
    '#431960',
    '#F7EB1F',
    '#431960',
    '#431960',
  ],
  'captain_america': [
    '#124A7F',
    '#FFFFFF',
    '#A2131C',
    '#A2131C',
  ],
  'ms_marvel': [
    '#ce1721',
    '#F6DC0B',
    '#297BB1',
    '#297BB1',
  ],
};
interface Props {
  card_set_code: string | null;
  style?: ViewStyle;
  children?: ReactNode;
  dark?: boolean;
}

export default function HeroGradient({
  card_set_code,
  style,
  children,
}: Props) {
  const colors = (
    card_set_code &&
    HERO_GRADIENTS[card_set_code]
  ) || [
    '#202366',
    '#EEE31E',
    '#7A201B',
    '#7A201B',
  ];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
      locations={[0.49, 0.50, 0.51, 1]}
      style={style}
    >
      { children }
    </LinearGradient>
  );
}
