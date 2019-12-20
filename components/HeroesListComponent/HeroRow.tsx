import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from 'ttag';

import HeroGradient from '../core/HeroGradient';
import HeroImage from '../core/HeroImage';
import Card, { CardsMap } from '../../data/Card';
import typography from '../../styles/typography';

interface Props {
  hero: Card;
  cards: CardsMap;
  onPress: (card: Card) => void;
}

export default class HeroRow extends React.Component<Props> {
  _onPress = () => {
    const {
      onPress,
      hero,
    } = this.props;
    onPress(hero);
  };

  name() {
    const { hero } = this.props;
    if (hero.linked_card) {
      return `${hero.name} / ${hero.linked_card.name}`;
    }
    return hero.name;
  }

  render() {
    const {
      hero,
    } = this.props;
    return (
      <TouchableOpacity onPress={this._onPress}>
        <HeroGradient
          card_set_code={hero.card_set_code}
          style={styles.row}
          color="primary"
        >
          <View style={styles.image}>
            <HeroImage card={hero} />
          </View>
          <View style={styles.titleColumn}>
            <Text style={[typography.text, styles.titleText]}>
              { this.name() }
            </Text>
            <Text style={[typography.text, styles.detailText]}>
              { t`Deck Size: 40-50` }
            </Text>
            <Text style={[typography.text, styles.detailText]}>
              { t`15 Hero Cards` }
            </Text>
          </View>
        </HeroGradient>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderColor: 'white',
  },
  image: {
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 10,
    marginRight: 8,
  },
  titleColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 5,
    marginTop: 4,
    marginBottom: 4,
  },
  titleText: {
    color: '#FFF',
    fontFamily: 'Dosis',
    fontWeight: '600',
  },
  detailText: {
    color: '#FFF',
    fontFamily: 'Dosis',
    fontWeight: '400',
  },
});
