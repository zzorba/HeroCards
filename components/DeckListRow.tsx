import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ngettext, msgid, t } from 'ttag';

import { Deck } from '../actions/types';
import Card, { CardsMap } from '../data/Card';
import InvestigatorImage from './core/InvestigatorImage';
import FactionGradient from './core/FactionGradient';
import DeckTitleBarComponent from './DeckTitleBarComponent';
import DeckProblemRow from './DeckProblemRow';
import { toRelativeDateString } from '../lib/datetime';
import { parseDeck, ParsedDeck } from './parseDeck';
import typography from '../styles/typography';
import { s } from '../styles/space';

interface Props {
  deck: Deck;
  previousDeck?: Deck;
  cards: CardsMap;
  investigator?: Card;
  onPress?: (deck: Deck, investigator?: Card) => void;
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
      investigator,
      onPress,
    } = this.props;
    onPress && onPress(deck, investigator);
  };

  renderDeckDetails() {
    const {
      deck,
      cards,
      details,
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
          <DeckProblemRow problem={{ reason: deck.problem }} color="#222" />
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
      investigator,
      titleButton,
      compact,
      subDetails,
    } = this.props;
    if (!deck || !investigator) {
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
      <React.Fragment>
        <View style={styles.column}>
          <DeckTitleBarComponent
            name={compact && investigator ? investigator.name : deck.name}
            investigator={investigator}
            button={titleButton}
            compact
          />
          <FactionGradient
            faction_code={investigator.factionCode()}
          >
            <View style={styles.investigatorBlock}>
              <View style={styles.investigatorBlockRow}>
                <View style={styles.image}>
                  { !!investigator && <InvestigatorImage card={investigator} /> }
                </View>
                <View style={[styles.column, styles.titleColumn]}>
                  { !compact && (
                    <Text style={typography.label}>
                      { investigator.name }
                    </Text>
                  ) }
                  { this.renderDeckDetails() }
                </View>
              </View>
              { subDetails }
            </View>
          </FactionGradient>
        </View>
        <FactionGradient
          faction_code={investigator.factionCode()}
          style={styles.footer}
          dark
        />
      </React.Fragment>
    );
  }

  render() {
    const {
      deck,
      investigator,
      viewDeckButton,
    } = this.props;
    if (!deck || !investigator) {
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
      <TouchableOpacity onPress={this._onPress} disabled={viewDeckButton}>
        { this.renderContents() }
      </TouchableOpacity>
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
