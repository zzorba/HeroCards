import React, { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
} from 'react-native';

import Card from '../data/Card';
import HeroGradient from './core/HeroGradient';
import typography from '../styles/typography';
import { s } from '../styles/space';

interface Props {
  name: string;
  fontScale: number;
  hero?: Card;
  compact?: boolean;
  button?: ReactNode;
}

export default function DeckTitleBarComponent({
  name,
  hero,
  compact,
  button,
}: Props) {
  const card_set_code = (hero && hero.card_set_code) || 'hero';
  return (
    <HeroGradient
      card_set_code={card_set_code}
      style={styles.titleBar}
      color="primary"
    >
      <Text
        style={[
          typography.text,
          styles.title,
          { color: '#FFFFFF' },
        ]}
        numberOfLines={compact ? 1 : 2}
        ellipsizeMode="tail"
      >
        { name }
      </Text>
      { !!button && button }
    </HeroGradient>
  );
}


const styles = StyleSheet.create({
  titleBar: {
    width: '100%',
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    marginLeft: s,
    flex: 1,
  },
});
