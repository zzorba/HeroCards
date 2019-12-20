import React from 'react';
import { Platform } from 'react-native';
import { Navigation, Options } from 'react-native-navigation';
import { t } from 'ttag';

import { DeckChartsProps } from './DeckChartsView';
import { DrawSimulatorProps } from './DrawSimulatorView';
import { CardDetailProps } from './CardDetailView';
import { CardDetailSwipeProps } from './CardDetailSwipeView';
import { DeckDetailProps } from './DeckDetailView';
import { Deck, ParsedDeck, Slots } from '../actions/types';
import { deckColor } from '../constants';
import Card from '../data/Card';
import { iconsMap } from '../app/NavIcons';
import { COLORS } from '../styles/colors';


function basicDeckOptions(
  deck: Deck,
  titleAndSubtitle: any,
  modal?: boolean,
): Options {
  return {
    statusBar: {
      style: 'light',
    },
    topBar: {
      backButton: {
        title: t`Back`,
        color: '#FFFFFF',
      },
      leftButtons: modal ? [
        Platform.OS === 'ios' ? {
          text: t`Done`,
          id: 'back',
          color: 'white',
        } : {
          icon: iconsMap['arrow-left'],
          id: 'androidBack',
          color: 'white',
        },
      ] : [],
      ...titleAndSubtitle,
      background: {
        color: deckColor(deck.meta),
      },
    },
    bottomTabs: {
      visible: false,
      drawBehind: true,
      animate: true,
    },
  };
}
export function getDeckEditOptions(deck: Deck) {
  return basicDeckOptions(
    deck,
    {
      title: {
        fontWeight: 'bold',
        text: (t`Edit Deck`),
        color: 'white',
      },
      subtitle: {
        text: deck.name,
        color: 'white',
      },
    },
    false
  );
}

export function getDeckOptions(
  deck: Deck,
  hero?: Card,
  modal?: boolean,
  title?: string
): Options {
  return basicDeckOptions(
    deck,
    {
      title: {
        fontWeight: 'bold',
        text: (hero ? hero.name : t`Deck`),
        color: 'white',
      },
      subtitle: {
        text: title,
        color: 'white',
      },
    },
    modal
  );
}

export function showDeckModal(
  componentId: string,
  deck: Deck,
  investigator?: Card
) {
  const passProps: DeckDetailProps = {
    id: deck.id,
    isPrivate: true,
    modal: true,
    title: investigator ? investigator.name : t`Deck`,
  };

  Navigation.showModal({
    stack: {
      children: [{
        component: {
          name: 'Deck',
          passProps,
          options: getDeckOptions(deck, investigator, true, deck.name),
        },
      }],
    },
  });
}

export function showCard(
  componentId: string,
  code: string,
  card: Card,
  showSpoilers?: boolean
) {
  Navigation.push<CardDetailProps>(componentId, {
    component: {
      name: 'Card',
      passProps: {
        id: code,
        pack_code: card.pack_code,
        showSpoilers: !!showSpoilers,
      },
      options: {
        topBar: {
          backButton: {
            title: t`Back`,
          },
        },
      },
    },
  });
}

export function showCardCharts(
  componentId: string,
  parsedDeck: ParsedDeck
) {
  Navigation.push<DeckChartsProps>(componentId, {
    component: {
      name: 'Deck.Charts',
      passProps: {
        parsedDeck,
      },
      options: getDeckOptions(
        parsedDeck.deck,
        parsedDeck.investigator,
        false,
        t`Charts`
      ),
    },
  });
}

export function showDrawSimulator(
  componentId: string,
  parsedDeck: ParsedDeck
) {
  const {
    slots,
    investigator,
  } = parsedDeck;
  Navigation.push<DrawSimulatorProps>(componentId, {
    component: {
      name: 'Deck.DrawSimulator',
      passProps: {
        slots,
      },
      options: getDeckOptions(
        parsedDeck.deck,
        investigator,
        false,
        t`Draw`
      ),
    },
  });
}

export function showCardSwipe(
  componentId: string,
  cards: Card[],
  index: number,
  showSpoilers?: boolean,
  deckCardCounts?: Slots,
  onDeckCountChange?: (code: string, count: number) => void,
  deck?: Deck,
  hero?: Card,
  renderFooter?: (slots?: Slots, controls?: React.ReactNode) => React.ReactNode,
) {
  const options = deck ?
    getDeckOptions(deck, hero, false, '') :
    {
      topBar: {
        backButton: {
          title: t`Back`,
          color: COLORS.navButton,
        },
      },
    };
  Navigation.push<CardDetailSwipeProps>(componentId, {
    component: {
      name: 'Card.Swipe',
      passProps: {
        cards,
        initialIndex: index,
        showSpoilers: !!showSpoilers,
        deckCardCounts,
        onDeckCountChange,
        renderFooter,
      },
      options,
    },
  });
}

export default {
  showDeckModal,
  getDeckOptions,
  showCard,
};
