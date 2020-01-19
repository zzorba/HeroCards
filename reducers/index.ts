import { combineReducers } from 'redux';
import { concat, find, forEach, keys, map, minBy, sortBy } from 'lodash';
import { persistReducer } from 'redux-persist';
import { createSelector } from 'reselect';
import AsyncStorage from '@react-native-community/async-storage';

import signedIn from './signedIn';
import filters from './filters';
import cards from './cards';
import decks from './decks';
import packs from './packs';
import settings from './settings';
import { FilterState } from '../lib/filters';
import { Deck, Pack, SortType } from '../actions/types';

const packsPersistConfig = {
  key: 'packs',
  storage: AsyncStorage,
  blacklist: ['loading', 'error'],
};

const cardsPersistConfig = {
  key: 'cards',
  storage: AsyncStorage,
  blacklist: ['loading', 'error'],
};

const decksPersistConfig = {
  key: 'decks',
  storage: AsyncStorage,
  blacklist: ['refreshing', 'error'],
};

const settingsPeristConfig = {
  key: 'settings',
  storage: AsyncStorage,
  blacklist: [],
};

const signedInPersistConfig = {
  key: 'signedIn',
  storage: AsyncStorage,
  blacklist: ['loading', 'error'],
};

// Combine all the reducers
const rootReducer = combineReducers({
  packs: persistReducer(packsPersistConfig, packs),
  cards: persistReducer(cardsPersistConfig, cards),
  decks: persistReducer(decksPersistConfig, decks),
  signedIn: persistReducer(signedInPersistConfig, signedIn),
  settings: persistReducer(settingsPeristConfig, settings),
  filters,
});

export type AppState = ReturnType<typeof rootReducer>;

export default rootReducer;

const DEFAULT_OBJECT = {};
const DEFAULT_PACK_LIST: Pack[] = [];

const allPacksSelector = (state: AppState) => state.packs.all;

export function getShowSpoilers(state: AppState, packCode: string): boolean {
  const show_spoilers = state.packs.show_spoilers || {};
  return !!show_spoilers[packCode];
}

export function getPackFetchDate(state: AppState): number | null {
  return state.packs.dateFetched;
}

export const getAllPacks = createSelector(
  allPacksSelector,
  allPacks => sortBy(allPacks || DEFAULT_PACK_LIST, pack => pack.position)
);

export function getPack(state: AppState, packCode: string): Pack | undefined {
  if (packCode) {
    return find(
      state.packs.all || DEFAULT_PACK_LIST,
      pack => pack.code === packCode
    );
  }
  return undefined;
}

export function getPackSpoilers(state: AppState) {
  return state.packs.show_spoilers || DEFAULT_OBJECT;
}

export function getPacksInCollection(state: AppState) {
  return state.packs.in_collection || DEFAULT_OBJECT;
}

export function getAllDecks(state: AppState) {
  return state.decks.all || DEFAULT_OBJECT;
}

export function getBaseDeck(state: AppState, deckId: number): Deck | undefined {
  const decks = getAllDecks(state);
  return decks[deckId];
}

export function getLatestDeck(state: AppState, deckId: number): Deck | undefined {
  const decks = getAllDecks(state);
  return decks[deckId];
}

const EMPTY_MY_DECKS: number[] = [];

const myDecksSelector = (state: AppState) => state.decks.myDecks;
const myDecksUpdatedSelector = (state: AppState) => state.decks.dateUpdated;
const myDecksRefreshingSelector = (state: AppState) => state.decks.refreshing;
const myDecksErrorSelector = (state: AppState) => state.decks.error;
export const getMyDecksState = createSelector(
  myDecksSelector,
  myDecksUpdatedSelector,
  myDecksRefreshingSelector,
  myDecksErrorSelector,
  (myDecks, dateUpdated, refreshing, error) => {
    return {
      myDecks: myDecks || EMPTY_MY_DECKS,
      myDecksUpdated: dateUpdated ? new Date(dateUpdated) : undefined,
      refreshing: refreshing,
      error: error || undefined,
    };
  }
);

export function getEffectiveDeckId(state: AppState, id: number): number {
  const replacedLocalIds = state.decks.replacedLocalIds;
  if (replacedLocalIds && replacedLocalIds[id]) {
    return replacedLocalIds[id];
  }
  return id;
}

export function getDeck(state: AppState, id: number): Deck | null {
  if (!id) {
    return null;
  }
  if (id in state.decks.all) {
    return state.decks.all[id];
  }
  return null;
}


const getDecksAllDecksSelector = (state: AppState) => state.decks.all;
const getDecksDeckIdsSelector = (state: AppState, deckIds: number[]) => deckIds;
export const getDecks = createSelector(
  getDecksAllDecksSelector,
  getDecksDeckIdsSelector,
  (allDecks, deckIds) => {
    const decks: Deck[] = [];
    forEach(deckIds, deckId => {
      if (deckId) {
        const deck = allDecks[deckId];
        if (deck && deck.id) {
          decks.push(deck);
        }
      }
    });
    return decks;
  }
);

export function getNextLocalDeckId(state: AppState): number {
  const smallestDeckId = minBy(
    map(
      concat(
        keys(state.decks.all || []),
        keys(state.decks.replacedLocalIds || DEFAULT_OBJECT)
      ),
      x => parseInt(x, 10)
    )
  ) || 0;
  if (smallestDeckId < 0) {
    return smallestDeckId - 1;
  }
  return -1;
}

export function getFilterState(
  state: AppState,
  filterId: string
): FilterState {
  return state.filters.all[filterId];
}

export function getMythosMode(
  state: AppState,
  filterId: string
): boolean {
  return !!state.filters.mythos[filterId];
}

export function getCardSort(
  state: AppState,
  filterId: string
): SortType {
  return state.filters.sorts[filterId];
}

export function getDefaultFilterState(
  state: AppState,
  filterId: string
): FilterState {
  return state.filters.defaults[filterId];
}
