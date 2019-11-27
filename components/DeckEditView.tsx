import React from 'react';
import Realm, { Results } from 'realm';
import { find, head } from 'lodash';
import { connectRealm, CardResults } from 'react-native-realm';

import { Deck, DeckMeta, Slots } from '../actions/types';
import withDimensions, { DimensionsProps } from './core/withDimensions';
import { queryForInvestigator } from '../lib/InvestigatorRequirements';
import Card, { CardsMap } from '../data/Card';
import { parseDeck } from '../lib/parseDeck';
import CardSearchComponent from './CardSearchComponent';
import DeckNavFooter from './DeckNavFooter';
import { NavigationProps } from './types';

export interface EditDeckProps {
  deck: Deck;
  slots: Slots;
  meta: DeckMeta;
  ignoreDeckLimitSlots: Slots;
  updateSlots: (slots: Slots) => void;
}

interface RealmProps {
  realm: Realm;
  investigator?: Card;
  cards: Results<Card>;
}

type Props = NavigationProps & EditDeckProps & RealmProps & DimensionsProps;

interface State {
  deckCardCounts: Slots;
  slots: Slots;
}

class DeckEditView extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      deckCardCounts: props.slots || {},
      slots: props.slots,
    };
  }

  _syncDeckCardCounts = () => {
    this.props.updateSlots(this.state.deckCardCounts);
  };

  componentDidUpdate(prevProps: Props) {
    const {
      slots,
    } = this.props;
    if (slots !== prevProps.slots) {
      /* eslint-disable react/no-did-update-set-state */
      this.setState({
        deckCardCounts: slots,
      });
    }
  }

  _onDeckCountChange = (code: string, count: number) => {
    const newSlots = Object.assign(
      {},
      this.state.deckCardCounts,
      { [code]: count },
    );
    if (count === 0) {
      delete newSlots[code];
    }
    this.setState({
      deckCardCounts: newSlots,
    }, this._syncDeckCardCounts);
  };

  _renderFooter = (updatedDeckCardCounts?: Slots, controls?: React.ReactNode) => {
    const {
      componentId,
      deck,
      ignoreDeckLimitSlots,
      cards,
      meta,
      fontScale,
    } = this.props;
    const deckCardCounts = updatedDeckCardCounts || this.state.deckCardCounts;
    const cardsInDeck: CardsMap = {};
    cards.forEach(card => {
      if (deckCardCounts[card.code] || deck.investigator_code === card.code) {
        cardsInDeck[card.code] = card;
      }
    });
    const pDeck = parseDeck(
      deck,
      deckCardCounts,
      ignoreDeckLimitSlots,
      cardsInDeck,
    );
    return (
      <DeckNavFooter
        componentId={componentId}
        fontScale={fontScale}
        meta={meta}
        parsedDeck={pDeck}
        cards={cardsInDeck}
        controls={controls}
      />
    );
  }

  baseQuery() {
    const {
      meta,
      investigator,
    } = this.props;
    const {
      deckCardCounts,
    } = this.state;
    const parts = investigator ? [
      `(${queryForInvestigator(investigator, meta)})`,
    ] : [];
    return `(${parts.join(' or ')})`;
  }

  render() {
    const {
      componentId,
      cards,
      deck,
    } = this.props;

    const {
      deckCardCounts,
    } = this.state;
    const investigator = find(cards, card => card.code === deck.investigator_code);
    return (
      <CardSearchComponent
        componentId={componentId}
        baseQuery={this.baseQuery()}
        originalDeckSlots={deck.slots}
        investigator={investigator}
        deckCardCounts={deckCardCounts}
        onDeckCountChange={this._onDeckCountChange}
        renderFooter={this._renderFooter}
        modal
      />
    );
  }
}

export default connectRealm<NavigationProps & EditDeckProps, RealmProps, Card>(
  withDimensions(DeckEditView),
  {
    schemas: ['Card'],
    mapToProps(
      results: CardResults<Card>,
      realm: Realm,
      props: NavigationProps & EditDeckProps
    ) {
      return {
        realm,
        investigator: head(results.cards.filtered(`(code == '${props.deck.investigator_code}')`)),
        cards: results.cards,
      };
    },
  },
);
