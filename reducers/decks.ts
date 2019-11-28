import { concat, uniq, filter, forEach, map, reverse, sortBy } from 'lodash';

import {
  LOGOUT,
  MY_DECKS_START_REFRESH,
  MY_DECKS_CACHE_HIT,
  MY_DECKS_ERROR,
  SET_MY_DECKS,
  NEW_DECK_AVAILABLE,
  DELETE_DECK,
  UPDATE_DECK,
  CLEAR_DECKS,
  REPLACE_LOCAL_DECK,
  DecksActions,
  NewDeckAvailableAction,
  ReplaceLocalDeckAction,
  UpdateDeckAction,
  Deck,
  DecksMap,
} from '../actions/types';

interface DecksState {
  all: DecksMap;
  myDecks: number[];
  replacedLocalIds?: {
    [id: number]: number;
  };
  dateUpdated: number | null;
  refreshing: boolean;
  error: string | null;
  lastModified?: string;
}

const DEFAULT_DECK_STATE: DecksState = {
  all: {},
  myDecks: [],
  replacedLocalIds: {},
  dateUpdated: null,
  refreshing: false,
  error: null,
  lastModified: undefined,
};

function sortMyDecks(myDecks: number[], allDecks: DecksMap): number[] {
  return reverse(
    sortBy(
      myDecks,
      deckId => allDecks[deckId].date_update || allDecks[deckId].date_creation
    )
  );
}

export default function(
  state = DEFAULT_DECK_STATE,
  action: DecksActions
) {
  if (action.type === LOGOUT || action.type === CLEAR_DECKS) {
    const all: DecksMap = {};
    forEach(state.all, (deck, id: any) => {
      if (deck && deck.local) {
        all[id] = deck;
      }
    });
    const myDecks = filter(state.myDecks, id => !!all[id]);
    return Object.assign(
      {},
      DEFAULT_DECK_STATE,
      {
        all,
        myDecks,
      },
    );
  }
  if (action.type === MY_DECKS_START_REFRESH) {
    return Object.assign({},
      state,
      {
        refreshing: true,
        error: null,
      },
    );
  }
  if (action.type === MY_DECKS_CACHE_HIT) {
    return Object.assign({},
      state,
      {
        refreshing: false,
        dateUpdated: action.timestamp.getTime(),
        error: null,
      },
    );
  }
  if (action.type === MY_DECKS_ERROR) {
    return Object.assign({},
      state,
      {
        refreshing: false,
        error: action.error,
        lastModified: undefined,
      },
    );
  }
  if (action.type === SET_MY_DECKS) {
    const allDecks: DecksMap = Object.assign({}, state.all);
    forEach(action.decks, deck => {
      allDecks[deck.id] = deck;
    });
    const localDeckIds: number[] = filter(
      state.myDecks,
      id => allDecks[id] ? !!allDecks[id].local : false);

    const actionDeckIds: number[] = map(
      action.decks,
      deck => deck.id
    );
    return Object.assign({},
      state,
      {
        all: allDecks,
        myDecks: sortMyDecks(concat(localDeckIds, actionDeckIds), allDecks),
        dateUpdated: action.timestamp.getTime(),
        lastModified: action.lastModified,
        refreshing: false,
        error: null,
      },
    );
  }
  if (action.type === REPLACE_LOCAL_DECK) {
    const deck = action.deck;
    const all = {
      ...state.all,
      [deck.id]: deck,
    };
    delete all[action.localId];
    const myDecks = uniq(map(state.myDecks || [], deckId => {
      if (deckId === action.localId) {
        return deck.id;
      }
      return deckId;
    }));

    const replacedLocalIds = {
      ...(state.replacedLocalIds || {}),
      [action.localId]: deck.id,
    };
    return Object.assign({},
      state,
      {
        all,
        myDecks: sortMyDecks(myDecks, all),
        replacedLocalIds,
      },
    );
  }
  if (action.type === DELETE_DECK) {
    const all = Object.assign({}, state.all);
    let deck = all[action.id];
    const toDelete = [action.id];
    delete all[action.id];
    const toDeleteSet = new Set(toDelete);
    const myDecks = filter(
      state.myDecks,
      deckId => !toDeleteSet.has(deckId));

    return Object.assign({},
      state,
      {
        all,
        myDecks,
        // There's a bug on MarvelCDB cache around deletes,
        // so drop lastModified when we detect a delete locally.
        lastModified: undefined,
      },
    );
  }
  if (action.type === UPDATE_DECK) {
    const deck = action.deck;
    const newState = Object.assign({},
      state,
      {
        all: Object.assign(
          {},
          state.all,
          { [action.id]: deck },
        ),
      },
    );
    if (action.isWrite) {
      // Writes get moved to the head of the list.
      newState.myDecks = [
        action.id,
        ...filter(state.myDecks, deckId => deckId !== action.id),
      ];
    }
    return newState;
  }
  if (action.type === NEW_DECK_AVAILABLE) {
    const deck = action.deck;
    return Object.assign({},
      state,
      {
        all: Object.assign(
          {},
          state.all,
          { [action.id]: deck },
        ),
        myDecks: [
          action.id,
          state.myDecks,
        ],
      });
  }
  return state;
}
