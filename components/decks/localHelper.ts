import { Deck, DeckMeta, Slots } from '../../actions/types';

export function newLocalDeck(
  id: number,
  name: string,
  investigator_code: string,
  slots: Slots,
  meta?: DeckMeta
): Deck {
  const timestamp = (new Date()).toISOString();
  return {
    id,
    date_creation: timestamp,
    date_update: timestamp,
    name,
    investigator_code,
    slots,
    meta,
    ignoreDeckLimitSlots: {},
    local: true,
    problem: 'too_few_cards',
    version: '0.1',
  };
}

export function updateLocalDeck(
  deck: Deck,
  name: string,
  slots: Slots,
  ignoreDeckLimitSlots: Slots,
  problem: string,
  meta?: DeckMeta,
) {
  const versionParts = (deck.version || '0.1').split('.');
  // @ts-ignore
  versionParts[1]++;
  const timestamp = (new Date()).toISOString();
  return Object.assign(
    {},
    deck,
    {
      name,
      date_update: timestamp,
      slots,
      ignoreDeckLimitSlots,
      problem,
      version: versionParts.join('.'),
      meta,
    },
  );
}

export default {
  newLocalDeck,
  updateLocalDeck,
};
