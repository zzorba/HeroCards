import React from 'react';
import {
  Text,
  StyleSheet,
  View,
} from 'react-native';

import MarvelIcon from '../../assets/MarvelIcon';
import { FACTION_COLORS } from '../../constants';
import Card from '../../data/Card';
import { isBig } from '../../styles/space';

export function costIconSize(fontScale: number) {
  const scaleFactor = ((fontScale - 1) / 2 + 1);
  return (isBig ? 48 : 42) * scaleFactor;
}

interface Props {
  card: Card;
  fontScale: number;
  inverted?: boolean;
  linked?: boolean;
}
export default class CardCostIcon extends React.Component<Props> {
  cardCost() {
    const {
      card,
      linked,
    } = this.props;
    if (card.type_code === 'resource') {
      return '';
    }
    if (card.double_sided || linked || card.linked_card) {
      return '-';
    }
    return `${card.cost !== null ? card.cost : 'X'}`;
  }

  static factionIcon(): string {
    return 'special';
  }

  color() {
    const {
      card,
    } = this.props;
    if (card.faction2_code) {
      return FACTION_COLORS.dual;
    }
    if (card.faction_code) {
      return FACTION_COLORS[card.faction_code];
    }
    return FACTION_COLORS.neutral;
  }

  render() {
    const {
      card,
      fontScale,
      inverted,
    } = this.props;
    const color = this.color();
    const scaleFactor = ((fontScale - 1) / 2 + 1);
    const ICON_SIZE = (isBig ? 46 : 42) * scaleFactor;
    const style = { width: costIconSize(fontScale), height: costIconSize(fontScale) };
    return (
      <View style={[styles.level, style]}>
        <View style={[styles.levelIcon, style]}>
          <MarvelIcon
            name="pow"
            size={ICON_SIZE}
            color={inverted ? '#FFF' : color}
          />
        </View>
        <View style={[styles.levelIcon, style, styles.costIcon]}>
          { card.type_code === 'resource' ? (
            <View>
              <MarvelIcon
                name="special"
                color="#FFF"
                size={ICON_SIZE / 2}
              />
            </View>
          ) : (
            <Text style={[
              styles.costNumber,
              { fontSize: (isBig ? 32 : 20) * scaleFactor },
              { color: inverted ? color : '#FFF' },
            ]} allowFontScaling={false}>
              { this.cardCost() }
            </Text>
          ) }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  level: {
    position: 'relative',
  },
  levelIcon: {
    position: 'absolute',
    top: -4,
    left: -4,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  costIcon: {
    paddingBottom: 2,
    left: -2,
  },
  costNumber: {
    paddingTop: 4,
    fontWeight: '600',
    fontFamily: 'Dosis',
    color: '#FFF',
  },
});
