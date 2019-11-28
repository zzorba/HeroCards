import { FactionCodeType, ResourceCodeType } from '../constants';
import { FilterState } from '../lib/filters';
import Card from '../data/Card';

export const SORT_BY_TYPE = 'Type';
export const SORT_BY_FACTION = 'Faction';
export const SORT_BY_COST = 'Cost';
export const SORT_BY_PACK = 'Pack';
export const SORT_BY_TITLE = 'Title';
export const SORT_BY_CARD_SET = 'Card Set';

export type SortType =
  typeof SORT_BY_TYPE |
  typeof SORT_BY_FACTION |
  typeof SORT_BY_COST |
  typeof SORT_BY_PACK |
  typeof SORT_BY_TITLE |
  typeof SORT_BY_CARD_SET;

export interface CardId {
  id: string;
  quantity: number;
}

export type FactionCounts = {
  [faction in FactionCodeType]?: [number, number];
};

export type ResourceCounts = {
  [resource in ResourceCodeType]?: number;
};

export interface SplitCards {
  Ally?: CardId[];
  Event?: CardId[];
  Resource?: CardId[];
  Support?: CardId[];
  Upgrade?: CardId[];
}
export type CardSplitType = keyof SplitCards;

export interface ParsedDeck {
  investigator: Card;
  deck: Deck;
  slots: Slots;
  normalCardCount: number;
  totalCardCount: number;
  packs: number;
  factionCounts: FactionCounts;
  costHistogram: number[];
  resourceCounts: ResourceCounts;
  normalCards: SplitCards;
  specialCards: SplitCards;
  ignoreDeckLimitSlots: Slots;
}

export interface Slots {
  [code: string]: number;
}
const INVESTIGATOR = 'hero';
const TOO_MANY_COPIES = 'too_many_copies';
const INVALID_CARDS = 'invalid_cards';
const TOO_FEW_CARDS = 'too_few_cards';
const TOO_MANY_CARDS = 'too_many_cards';
const DECK_OPTIONS_LIMIT = 'deck_options_limit';

export type DeckProblemType =
  typeof INVESTIGATOR |
  typeof TOO_MANY_COPIES |
  typeof INVALID_CARDS |
  typeof TOO_FEW_CARDS |
  typeof TOO_MANY_CARDS |
  typeof DECK_OPTIONS_LIMIT;

export interface DeckProblem {
  reason: DeckProblemType;
  problems?: string[];
}

export interface DeckMeta {
  aspect?: FactionCodeType;
}
export interface Deck {
  id: number;
  name: string;
  investigator_code: string;
  local?: boolean;
  meta?: DeckMeta;
  date_update: string;
  date_creation: string;
  slots: Slots;
  ignoreDeckLimitSlots: Slots;
  problem?: DeckProblemType;
  version?: string;
}

export interface DecksMap {
  [id: number]: Deck;
}

export interface Pack {
  id: string;
  name: string;
  code: string;
  position: number;
  available: string;
  known: number;
  total: number;
  url: string;
}

export const SET_SINGLE_CARD_VIEW = 'SET_SINGLE_CARD_VIEW';
export interface SetSingleCardViewAction {
  type: typeof SET_SINGLE_CARD_VIEW;
  singleCardView: boolean;
}

export const PACKS_FETCH_START = 'PACKS_FETCH_START';
export interface PacksFetchStartAction {
  type: typeof PACKS_FETCH_START;
}
export const PACKS_FETCH_ERROR = 'PACKS_FETCH_ERROR';
export interface PacksFetchErrorAction {
  type: typeof PACKS_FETCH_ERROR;
  error: string;
}
export const PACKS_AVAILABLE = 'PACKS_AVAILABLE';
export interface PacksAvailableAction {
  type: typeof PACKS_AVAILABLE;
  packs: Pack[];
  lang: string;
  timestamp: Date;
  lastModified?: string;
}

export interface CardCache {
  cardCount: number;
  lastModified?: string;
}

export const PACKS_CACHE_HIT = 'PACKS_CACHE_HIT';
export interface PacksCacheHitAction {
  type: typeof PACKS_CACHE_HIT;
  timestamp: Date;
}
export const CARD_FETCH_START = 'CARD_FETCH_START';
export interface CardFetchStartAction {
  type: typeof CARD_FETCH_START;
}

export const CARD_FETCH_SUCCESS = 'CARD_FETCH_SUCCESS';
export interface CardFetchSuccessAction {
  type: typeof CARD_FETCH_SUCCESS;
  cache?: CardCache;
  lang: string;
}

export const CARD_FETCH_ERROR = 'CARD_FETCH_ERROR';
export interface CardFetchErrorAction {
  type: typeof CARD_FETCH_ERROR;
  error: string;
}

export const UPDATE_PROMPT_DISMISSED = 'UPDATE_PROMPT_DISMISSED';
export interface UpdatePromptDismissedAction {
  type: typeof UPDATE_PROMPT_DISMISSED;
  timestamp: Date;
}

export const NEW_DECK_AVAILABLE = 'NEW_DECK_AVAILABLE';
export interface NewDeckAvailableAction {
  type: typeof NEW_DECK_AVAILABLE;
  id: number;
  deck: Deck;
}
export const REPLACE_LOCAL_DECK = 'REPLACE_LOCAL_DECK';
export interface ReplaceLocalDeckAction {
  type: typeof REPLACE_LOCAL_DECK;
  localId: number;
  deck: Deck;
}
export const UPDATE_DECK = 'UPDATE_DECK';
export interface UpdateDeckAction {
  type: typeof UPDATE_DECK;
  id: number;
  deck: Deck;
  isWrite: boolean;
}
export const DELETE_DECK = 'DELETE_DECK';
export interface DeleteDeckAction {
  type: typeof DELETE_DECK;
  id: number;
}
export const CLEAR_DECKS = 'CLEAR_DECKS';
export interface ClearDecksAction {
  type: typeof CLEAR_DECKS;
}
export const SET_MY_DECKS = 'SET_MY_DECKS';
export interface SetMyDecksAction {
  type: typeof SET_MY_DECKS;
  decks: Deck[];
  lastModified: string;
  timestamp: Date;
}
export const MY_DECKS_START_REFRESH = 'MY_DECKS_START_REFRESH';
export interface MyDecksStartRefreshAction {
  type: typeof MY_DECKS_START_REFRESH;
}

export const MY_DECKS_CACHE_HIT = 'MY_DECKS_CACHE_HIT';
export interface MyDecksCacheHitAction {
  type: typeof MY_DECKS_CACHE_HIT;
  timestamp: Date;
}
export const MY_DECKS_ERROR = 'MY_DECKS_ERROR';
export interface MyDecksErrorAction {
  type: typeof MY_DECKS_ERROR;
  error: string;
}
export const SET_IN_COLLECTION = 'SET_IN_COLLECTION';
export interface SetInCollectionAction {
  type: typeof SET_IN_COLLECTION;
  code?: string;
  value: boolean;
}
export const SET_PACK_SPOILER = 'SET_PACK_SPOILER';
export interface SetPackSpoilerAction {
  type: typeof SET_PACK_SPOILER;
  code?: string;
  value: boolean;
}

export const LOGIN_STARTED = 'LOGIN_STARTED';
interface LoginStartedAction {
  type: typeof LOGIN_STARTED;
}

export const LOGIN = 'LOGIN';
interface LoginAction {
  type: typeof LOGIN;
}

export const LOGIN_ERROR = 'LOGIN_ERROR';
interface LoginErrorAction {
  type: typeof LOGIN_ERROR;
  error: Error | string;
}

export const LOGOUT = 'LOGOUT';
interface LogoutAction {
  type: typeof LOGOUT;
}

export const CLEAR_FILTER = 'CLEAR_FILTER';
export interface ClearFilterAction {
  type: typeof CLEAR_FILTER;
  id: string;
  clearTraits?: string[];
}
export const TOGGLE_FILTER = 'TOGGLE_FILTER';
export interface ToggleFilterAction {
  type: typeof TOGGLE_FILTER;
  id: string;
  key: keyof FilterState;
  value: boolean;
}
export const UPDATE_FILTER = 'UPDATE_FILTER';
export interface UpdateFilterAction {
  type: typeof UPDATE_FILTER;
  id: string;
  key: keyof FilterState;
  value: any;
}
export const TOGGLE_MYTHOS = 'TOGGLE_MYTHOS';
export interface ToggleMythosAction {
  type: typeof TOGGLE_MYTHOS;
  id: string;
  value: boolean;
}
export const UPDATE_CARD_SORT = 'UPDATE_CARD_SORT';
export interface UpdateCardSortAction {
  type: typeof UPDATE_CARD_SORT;
  id: string;
  sort: SortType;
}

export const ADD_FILTER_SET = 'ADD_FILTER_SET';
export interface AddFilterSetAction {
  type: typeof ADD_FILTER_SET;
  id: string;
  filters: FilterState;
  sort?: SortType;
  mythosToggle?: boolean;
}

export const SYNC_FILTER_SET = 'SYNC_FILTER_SET';
export interface SyncFilterSetAction {
  type: typeof SYNC_FILTER_SET;
  id: string;
  filters: FilterState;
}

export const REMOVE_FILTER_SET = 'REMOVE_FILTER_SET';
export interface RemoveFilterSetAction {
  type: typeof REMOVE_FILTER_SET;
  id: string;
}

export type FilterActions =
  ClearFilterAction |
  ToggleFilterAction |
  UpdateFilterAction |
  AddFilterSetAction |
  SyncFilterSetAction |
  RemoveFilterSetAction |
  ToggleMythosAction |
  UpdateCardSortAction;

export type PacksActions =
  PacksFetchStartAction |
  PacksFetchErrorAction |
  PacksCacheHitAction |
  PacksAvailableAction |
  SetInCollectionAction |
  SetPackSpoilerAction |
  UpdatePromptDismissedAction;

export type SignInActions =
  LoginAction |
  LoginStartedAction |
  LoginErrorAction |
  LogoutAction;

export type DecksActions =
  LogoutAction |
  MyDecksStartRefreshAction |
  MyDecksCacheHitAction |
  MyDecksErrorAction |
  SetMyDecksAction |
  NewDeckAvailableAction |
  DeleteDeckAction |
  UpdateDeckAction |
  ClearDecksAction |
  ReplaceLocalDeckAction;
