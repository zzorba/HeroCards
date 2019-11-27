import React from 'react';
import {
  Text,
  StyleSheet,
  View,
} from 'react-native';

import AppIcon from '../../assets/AppIcon';
import MarvelIcon from '../../assets/MarvelIcon';
import { FACTION_COLORS } from '../../constants';
import Card from '../../data/Card';
import { isBig } from '../../styles/space';

export function costIconSize(fontScale: number) {
  const scaleFactor = ((fontScale - 1) / 2 + 1);
  return (isBig ? 48 : 36) * scaleFactor;
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

  static factionIcon(card: Card): string {
    if (card.faction2_code) {
      return 'elder_sign';
    }
    if (card.faction_code === 'basic') {
      return 'elder_sign';
    }
    if (card.faction_code) {
      return card.faction_code;
    }
    return 'elder_sign';
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
    const ICON_SIZE = (isBig ? 46 : 32) * scaleFactor;
    const style = { width: costIconSize(fontScale), height: costIconSize(fontScale) };
    return (
      <View style={[styles.level, style]}>
        <View style={[styles.levelIcon, style]}>
          <AppIcon
            name={`${inverted ? 'inverted_' : ''}level_0`}
            size={ICON_SIZE}
            color={inverted ? '#FFF' : color}
          />
        </View>
        <View style={[styles.levelIcon, style, styles.cost]}>
          { card.type_code === 'resource' ? (
            <View>
              <MarvelIcon
                name={CardCostIcon.factionIcon(card)}
                color="#FFF"
                size={ICON_SIZE / 2}
              />
            </View>
          ) : (
            <Text style={[
              styles.costNumber,
              { fontSize: (isBig ? 32 : 23) * scaleFactor },
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
    top: 0,
    left: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cost: {
    paddingBottom: 6,
  },
  costNumber: {
    paddingTop: 3,
    fontFamily: 'Teutonic',
    color: '#FFF',
  },
});
