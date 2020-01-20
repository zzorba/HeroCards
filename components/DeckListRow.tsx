import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from 'ttag';

import { Deck } from '../actions/types';
import Card, { CardsMap } from '../data/Card';
import HeroImage from './core/HeroImage';
import HeroGradient from './core/HeroGradient';
import DeckTitleBarComponent from './DeckTitleBarComponent';
import DeckProblemRow from './DeckProblemRow';
import { toRelativeDateString } from '../lib/datetime';
import typography from '../styles/typography';
import { s } from '../styles/space';

interface Props {
  deck: Deck;
  fontScale: number;
  cards: CardsMap;
  hero?: Card;
  onPress?: (deck: Deck, hero?: Card) => void;
  details?: ReactNode;
  subDetails?: ReactNode;
  titleButton?: ReactNode;
  compact?: boolean;
  viewDeckButton?: boolean;
}

export default class DeckListRow extends React.Component<Props> {
  _onPress = () => {
    const {
      deck,
      hero,
      onPress,
    } = this.props;
    onPress && onPress(deck, hero);
  };

  renderDeckDetails() {
    const {
      deck,
      details,
      fontScale,
    } = this.props;
    if (details) {
      return details;
    }
    if (!deck) {
      return null;
    }

    const date: undefined | string = deck.date_update || deck.date_creation;
    const parsedDate: number | undefined = date ? Date.parse(date) : undefined;
    const dateStr = parsedDate ? toRelativeDateString(new Date(parsedDate)) : undefined;
    return (
      <View>
        { !!deck.problem && (
          <DeckProblemRow
            problem={{ reason: deck.problem }}
            color="#222"
            fontScale={fontScale}
          />
        ) }
        { !!dateStr && (
          <Text style={typography.small} >
            { t`Updated ${dateStr}` }
          </Text>
        ) }
      </View>
    );
  }

  renderContents() {
    const {
      deck,
      hero,
      titleButton,
      compact,
      subDetails,
      fontScale,
    } = this.props;
    if (!deck || !hero) {
      return (
        <View style={styles.row}>
          <ActivityIndicator
            style={styles.loading}
            size="large"
            color="#000000"
          />
        </View>
      );
    }
    return (
      <View>
        <View style={styles.column}>
          <DeckTitleBarComponent
            name={compact && hero ? hero.name : deck.name}
            hero={hero}
            button={titleButton}
            fontScale={fontScale}
            compact
          />
          <HeroGradient
            card_set_code={hero.card_set_code}
            color="background"
          >
            <View style={styles.investigatorBlock}>
              <View style={styles.investigatorBlockRow}>
                <View style={styles.image}>
                  { !!hero && <HeroImage card={hero} /> }
                </View>
                <View style={[styles.column, styles.titleColumn]}>
                  { !compact && (
                    <Text style={typography.label}>
                      { hero.name }
                    </Text>
                  ) }
                  { this.renderDeckDetails() }
                </View>
              </View>
              { subDetails }
            </View>
          </HeroGradient>
        </View>
        <HeroGradient
          card_set_code={hero.card_set_code}
          style={styles.footer}
          color="secondary"
        />
      </View>
    );
  }

  render() {
    const {
      deck,
      hero,
      viewDeckButton,
    } = this.props;
    if (!deck || !hero) {
      return (
        <View style={styles.row}>
          <ActivityIndicator
            style={styles.loading}
            size="large"
            color="#000000"
          />
        </View>
      );
    }
    if (viewDeckButton) {
      return this.renderContents();
    }
    if (Platform.OS === 'ios') {
      return (
        <TouchableOpacity onPress={this._onPress}>
          { this.renderContents() }
        </TouchableOpacity>
      );
    }
    return (
      <TouchableNativeFeedback useForeground onPress={this._onPress}>
        { this.renderContents() }
      </TouchableNativeFeedback>
    );
  }
}

const styles = StyleSheet.create({
  footer: {
    height: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  investigatorBlockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  investigatorBlock: {
    paddingTop: s,
    paddingBottom: s,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  loading: {
    marginLeft: 10,
  },
  image: {
    marginLeft: s,
    marginRight: s,
  },
  titleColumn: {
    flex: 1,
  },
});
