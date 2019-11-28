import Realm from 'realm';
import { filter, keys, map } from 'lodash';
import { t } from 'ttag';

import BaseCard from './BaseCard';
import CardRestrictions from './CardRestrictions';
import DeckRequirement from './DeckRequirement';
import DeckOption from './DeckOption';

const USES_REGEX = new RegExp('.*Uses\\s*\\([0-9]+\\s(.+)\\)\\..*');

export default class Card extends BaseCard {
  public static schema: Realm.ObjectSchema = {
    name: 'Card',
    primaryKey: 'id',
    properties: BaseCard.SCHEMA,
  };

  static parseRestrictions(json?: { investigator?: { [key: string]: string} }) {
    if (json && json.investigator && keys(json.investigator).length) {
      return CardRestrictions.parse(json);
    }
    return null;
  }

  static factionHeaderOrder(json: any) {
    const BASE_ORDER = [
      t`Hero`,
      t`Aggression`,
      t`Justice`,
      t`Leadership`,
      t`Protection`,
      t`Basic`,
      t`Encounter`,
    ];

    return BASE_ORDER.indexOf(Card.factionSortHeader(json));
  }

  static factionCodeToName(code: string, defaultName: string) {
    switch(code) {
      case 'hero':
        return t`Hero`;
      case 'aggression':
        return t`Aggression`;
      case 'justice':
        return t`Justice`;
      case 'leadership':
        return t`Leadership`;
      case 'protection':
        return t`Protection`;
      case 'basic':
        return t`Basic`;
      case 'encounter':
        return t`Encounter`;
      default:
        return defaultName;
    }
  }

  static factionSortHeader(json: any) {
    if (json.spoiler) {
      return t`Encounter`;
    }
    if (json.faction_code === 'hero' && json.card_set_name) {
      return json.card_set_name;
    }
    if (!json.faction_code || !json.faction_name) {
      return t`Unknown`;
    }
    if (json.faction2_code && json.faction2_name) {
      const faction1 = Card.factionCodeToName(json.faction_code, json.faction_name);
      const faction2 = Card.factionCodeToName(json.faction2_code, json.faction2_name);
      return `${faction1} / ${faction2}`;
    }
    return Card.factionCodeToName(json.faction_code, json.faction_name);
  }

  static typeHeaderOrder() {
    return [
      t`Hero`,
      t`Ally`,
      t`Event`,
      t`Support`,
      t`Upgrade`,
      t`Obligation`,
      t`Scenario`,
      t`Main Scheme`,
      t`Side Scheme`,
      t`Minion`,
      t`Treachery`,
      t`Attachment`,
    ];
  }

  static typeSortHeader(json: any): string {
    if (json.hidden && json.linked_card) {
      return Card.typeSortHeader(json.linked_card);
    }
    switch(json.subtype_code) {
      case 'basicweakness':
        return t`Basic Weakness`;
      case 'weakness':
        if (json.spoiler) {
          return t`Story`;
        }
        return t`Weakness`;
      default:
        switch(json.type_code) {
          case 'hero':
            return t`Hero`;
          case 'alter_ego':
            return t`Alter-Ego`;
          case 'ally':
            return t`Ally`;
          case 'event':
            return t`Event`;
          case 'resource':
            return t`Resource`;
          case 'support':
            return t`Support`;
          case 'upgrade':
            return t`Upgrade`;
          case 'obligation':
            return t`Obligation`;
          default:
            return t`Scenario`;
        }
    }
  }

  static fromJson(
    json: any,
    packsByCode: {
      [pack_code: string]: {
        position: number;
      };
    },
    lang: string
  ): Card {
    const deck_requirements = json.deck_requirements ?
      DeckRequirement.parse(json.deck_requirements) :
      null;
    const deck_options = json.deck_options ?
      DeckOption.parseList(json.deck_options) :
      [];

    const name = json.name.replace('', '');
    let renderName = name;
    let renderSubname = json.subname;
    const linked_card = json.linked_card ?
      Card.fromJson(json.linked_card, packsByCode, lang) :
      null;
    if (linked_card) {
      linked_card.back_linked = true;
      if (json.hidden && !linked_card.hidden) {
        renderName = linked_card.name;
      }
    }

    const real_traits_normalized = json.real_traits ? map(
      filter(
        map(json.real_traits.split('.'), trait => trait.toLowerCase().trim()),
        trait => trait),
      trait => `#${trait}#`).join(',') : null;
    const traits_normalized = json.traits ? map(
      filter(
        map(json.traits.split('.'), trait => trait.toLowerCase().trim()),
        trait => trait),
      trait => `#${trait}#`).join(',') : null;
    const restrictions = Card.parseRestrictions(json.restrictions);
    const uses_match = json.real_text && json.real_text.match(USES_REGEX);
    const uses = uses_match ? uses_match[1].toLowerCase() : null;

    const sort_by_type = Card.typeHeaderOrder().indexOf(Card.typeSortHeader(json));
    const sort_by_faction = Card.factionHeaderOrder(json);
    const pack = packsByCode[json.pack_code] || null;
    const sort_by_pack = pack ? (pack.position) : -1;
    const spoiler = !!(json.spoiler || (linked_card && linked_card.spoiler));

    return Object.assign(
      {},
      json,
      {
        id: json.code,
        name,
        renderName,
        renderSubname,
        deck_requirements,
        deck_options,
        linked_card,
        spoiler,
        traits_normalized,
        real_traits_normalized,
        uses,
        has_restrictions: !!restrictions,
        restrictions,
        sort_by_type,
        sort_by_faction,
        sort_by_pack,
      },
    );
  }
}

export type CardKey = keyof Card;
export interface CardsMap {
  [code: string]: Card;
}
