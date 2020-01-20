import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

export interface HeroColor {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const DEFAULT_COLOR: HeroColor = {
  primary: '#202366',
  accent: '#EEE31E',
  secondary: '#7A201B',
  background: '#FFF',
};

const HERO_COLORS: {
  [card_set_code: string]: HeroColor | undefined;
} = {
  'spider_man': {
    primary: '#7F1A20',
    secondary: '#1F266B',
    accent: '#dddddd',
    background: '#8f93b5',
  },
  'captain_marvel': {
    primary: '#202366',
    accent: '#EEE31E',
    secondary: '#7A201B',
    background: '#f7f18f',
  },
  'she_hulk': {
    primary: '#3A1D5D',
    accent: '#dddddd',
    secondary: '#15612F',
    background: '#8ab097',
  },
  'iron_man': {
    primary: '#901a1a',
    accent: '#F4EA15',
    secondary: '#901a1a',
    background: '#faf58a',
  },
  'black_panther': {
    primary: '#431960',
    accent: '#F7EB1F',
    secondary: '#431960',
    background: '#fbf58f',
  },
  'captain_america': {
    primary: '#124A7F',
    accent: '#FFFFFF',
    secondary: '#A2131C',
    background: '#d1898e',
  },
  'ms_marvel': {
    primary: '#ce1721',
    accent: '#F6DC0B',
    secondary: '#297BB1',
    background: '#a9cae0',
  },
};

interface Props {
  card_set_code: string | null;
  style?: ViewStyle;
  children?: ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'background';
}

export default class HeroGradient extends React.Component<Props> {
  static color(card_set_code: string | null): HeroColor {
    return (card_set_code && HERO_COLORS[card_set_code]) || DEFAULT_COLOR;
  }

  render() {
    const {
      card_set_code,
      style,
      children,
      color,
    } = this.props;
    const colors = HeroGradient.color(card_set_code);
    return (
      <View
        style={[style, { backgroundColor: colors[color] }]}
      >
        { children }
      </View>
    );
  }
}
