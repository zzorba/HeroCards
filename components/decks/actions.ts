import Config from 'react-native-config';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, ActionCreator } from 'redux';

import { newLocalDeck, updateLocalDeck } from './localHelper';
import { handleAuthErrors } from '../authHelper';
import {
  NEW_DECK_AVAILABLE,
  UPDATE_DECK,
  DELETE_DECK,
  REPLACE_LOCAL_DECK,
  ReplaceLocalDeckAction,
  NewDeckAvailableAction,
  UpdateDeckAction,
  DeleteDeckAction,
  Deck,
  DeckMeta,
  Slots,
} from '../../actions/types';
import { login } from '../../actions';
import { saveDeck, loadDeck, newCustomDeck } from '../../lib/authApi';
import { AppState, getNextLocalDeckId } from '../../reducers/index';

function setNewDeck(
  id: number,
  deck: Deck
): NewDeckAvailableAction {
  return {
    type: NEW_DECK_AVAILABLE,
    id,
    deck,
  };
}

function updateDeck(
  id: number,
  deck: Deck,
  isWrite: boolean
): UpdateDeckAction {
  return {
    type: UPDATE_DECK,
    id,
    deck,
    isWrite,
  };
}

export function removeDeck(id: number): DeleteDeckAction {
  return {
    type: DELETE_DECK,
    id,
  };
}

export function replaceLocalDeck(
  localId: number,
  deck: Deck
): ReplaceLocalDeckAction {
  return {
    type: REPLACE_LOCAL_DECK,
    localId,
    deck,
  };
}

export function fetchPrivateDeck(
  id: number
): ThunkAction<void, AppState, null, Action<string>> {
  return (dispatch) => {
    loadDeck(id).then(deck => {
      dispatch(updateDeck(id, deck, false));
    }).catch(err => {
      if (err.message === 'Not Found') {
        dispatch(removeDeck(id));
      }
    });
  };
}

export function fetchPublicDeck(
  id: number,
  useDeckEndpoint: boolean
): ThunkAction<void, AppState, null, Action<string>> {
  return (dispatch) => {
    const uri = `${Config.OAUTH_SITE}api/public/${useDeckEndpoint ? 'deck' : 'decklist'}/${id}`;
    fetch(uri, { method: 'GET' })
      .then(response => {
        if (response.ok === true) {
          return response.json();
        }
        throw new Error(`Unexpected status: ${response.status}`);
      })
      .then(json => {
        dispatch(updateDeck(id, json, false));
      }).catch((err: Error) => {
        if (!useDeckEndpoint) {
          return dispatch(fetchPublicDeck(id, true));
        }
        console.log(err);
      });
  };
}

export interface DeckChanges {
  name?: string;
  slots?: Slots;
  ignoreDeckLimitSlots?: Slots;
  problem?: string;
  meta?: DeckMeta;
}

export const saveDeckChanges: ActionCreator<
  ThunkAction<Promise<Deck>, AppState, {}, Action>
> = (
  deck: Deck,
  changes: DeckChanges
) => {
  return (dispatch: ThunkDispatch<AppState, {}, Action>): Promise<Deck> => {
    return new Promise((resolve, reject) => {
      if (deck.local) {
        const newDeck = updateLocalDeck(
          deck,
          changes.name || deck.name,
          changes.slots || deck.slots,
          changes.ignoreDeckLimitSlots || deck.ignoreDeckLimitSlots || {},
          (changes.problem !== undefined && changes.problem !== null) ? changes.problem : (deck.problem || ''),
          (changes.meta !== undefined && changes.meta !== null) ? changes.meta : deck.meta
        );
        dispatch(updateDeck(newDeck.id, newDeck, true));
        setTimeout(() => {
          resolve(newDeck);
        }, 1000);
      } else {
        const savePromise = saveDeck(
          deck.id,
          changes.name || deck.name,
          changes.slots || deck.slots,
          changes.ignoreDeckLimitSlots || deck.ignoreDeckLimitSlots || {},
          (changes.problem !== undefined && changes.problem !== null) ? changes.problem : (deck.problem || ''),
          (changes.meta !== undefined && changes.meta !== null) ? changes.meta : deck.meta
        );
        handleAuthErrors<Deck>(
          savePromise,
          // onSuccess
          (deck: Deck) => {
            dispatch(updateDeck(deck.id, deck, true));
            resolve(deck);
          },
          reject,
          () => {
            dispatch(saveDeckChanges(deck, changes))
              .then(deck => resolve(deck));
          },
          // login
          () => {
            dispatch(login());
          }
        );
      }
    });
  };
};

export interface NewDeckParams {
  local: boolean;
  deckName: string;
  investigatorCode: string;
  slots: Slots;
  ignoreDeckLimitSlots?: Slots;
  meta?: DeckMeta;
}
export const saveNewDeck: ActionCreator<
  ThunkAction<Promise<Deck>, AppState, {}, Action>
> = (
  params: NewDeckParams
) => {
  return (
    dispatch: ThunkDispatch<AppState, {}, Action>,
    getState: () => AppState
  ): Promise<Deck> => {
    return new Promise<Deck>((resolve, reject) => {
      if (params.local) {
        const nextLocalDeckId = getNextLocalDeckId(getState());
        console.log(nextLocalDeckId);
        const deck = newLocalDeck(
          nextLocalDeckId,
          params.deckName,
          params.investigatorCode,
          params.slots,
          params.meta,
        );
        dispatch(setNewDeck(deck.id, deck));
        setTimeout(() => {
          resolve(deck);
        }, 1000);
      } else {
        const newDeckPromise = newCustomDeck(
          params.investigatorCode,
          params.deckName,
          params.slots,
          params.ignoreDeckLimitSlots || {},
          'too_few_cards',
          params.meta
        );
        handleAuthErrors<Deck>(
          newDeckPromise,
          // onSuccess
          (deck: Deck) => {
            dispatch(setNewDeck(deck.id, deck));
            resolve(deck);
          },
          reject,
          () => {
            dispatch(saveNewDeck(params)).then(deck => resolve(deck));
          },
          // login
          () => {
            dispatch(login());
          }
        );
      }
    });
  };
};

export const saveClonedDeck: ActionCreator<
  ThunkAction<Promise<Deck>, AppState, {}, Action>
> = (
  local: boolean,
  cloneDeck: Deck,
  deckName: string
) => {
  return (dispatch: ThunkDispatch<AppState, {}, Action>): Promise<Deck> => {
    return new Promise<Deck>((resolve, reject) => {
      dispatch(saveNewDeck({
        local,
        deckName,
        investigatorCode: cloneDeck.investigator_code,
        slots: cloneDeck.slots,
        ignoreDeckLimitSlots: cloneDeck.ignoreDeckLimitSlots,
        meta: cloneDeck.meta,
      })).then(deck => {
        setTimeout(() => {
          dispatch(saveDeckChanges(
            deck,
            {
              slots: cloneDeck.slots,
              ignoreDeckLimitSlots: cloneDeck.ignoreDeckLimitSlots,
              problem: cloneDeck.problem,
            }
          )).then(resolve, reject);
        },
        // Slow it down to avoid ADB race conditions
        1000);
      }, reject);
    });
  };
};

export const uploadLocalDeck: ActionCreator<
  ThunkAction<Promise<Deck>, AppState, {}, Action>
> = (
  localDeck: Deck
) => {
  return (dispatch: ThunkDispatch<AppState, {}, Action>): Promise<Deck> => {
    return dispatch(saveClonedDeck(
      false,
      localDeck,
      localDeck.name
    )).then(deck => {
      dispatch(replaceLocalDeck(localDeck.id, deck));
      return deck;
    });
  };
};

export default {
  fetchPrivateDeck,
  fetchPublicDeck,
  replaceLocalDeck,
  removeDeck,
  saveDeckChanges,
  saveNewDeck,
  saveClonedDeck,
  uploadLocalDeck,
};
