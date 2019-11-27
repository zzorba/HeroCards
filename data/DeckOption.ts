import Realm from 'realm';
import { indexOf, map } from 'lodash';
import { t } from 'ttag';

import { DeckMeta } from '../actions/types';
import DeckAtLeastOption from './DeckAtLeastOption';
import { FactionCodeType, TypeCodeType } from '../constants';

export default class DeckOption {
  public static schema: Realm.ObjectSchema = {
    name: 'DeckOption',
    properties: {
      aspect_select: 'string[]',
      uses: 'string[]',
      trait: 'string[]',
      text: 'string[]',
      type_code: 'string[]',
      atleast: 'DeckAtLeastOption?',
      limit: 'int?',
      error: 'string?',
      not: 'bool?',
    },
  };

  public type_code!: TypeCodeType[];
  public uses!: string[];
  public trait!: string[];
  public text!: string[];
  public atleast?: DeckAtLeastOption;
  public limit?: number;
  public error?: string;
  public not?: boolean;
  public aspect_select!: FactionCodeType[];

  toQuery(meta?: DeckMeta) {
    let query = this.not ? 'NOT (' : '(';
    let dirty = false;
    if (this.aspect_select && this.aspect_select.length) {
      if (dirty) {
        query += ' AND';
      }
      let factions = this.aspect_select;
      if (meta &&
        meta.aspect &&
        indexOf(this.aspect_select, meta.aspect) !== -1
      ) {
        // If we have a deck select ONLY the ones they specified.
        // If not select them all.
        factions = [meta.aspect];
      }
      query += ' (';
      query +=
        map(factions, faction =>
          ` faction_code == '${faction}' OR faction2_code == '${faction}'`)
          .join(' OR');
      query += ' )';

      dirty = true;
    }
    if (this.uses && this.uses.length) {
      if (dirty) {
        query += ' AND';
      }
      query += ' (';
      query += map(this.uses, use => ` uses == '${use}'`).join(' OR');
      query += ' )';
      dirty = true;
    }
    if (this.text && this.text.length) {
      if (dirty) {
        query += ' AND';
      }
      // No regex so we have to pre-bake these unfortunately.
      if (this.text[0] === '[Hh]eals? (\\d+ damage (and|or) )?(\\d+ )?horror' ||
        this.text[0] === '[Hh]eals? (that much )?(\\d+ damage (and|or) )?(\\d+ )?horror') {
        query += ' (heals_horror == true)';
        dirty = true;
      }
    }
    if (this.trait && this.trait.length) {
      if (dirty) {
        query += ' AND';
      }
      query += ' (';
      query +=
        map(this.trait, trait => ` real_traits_normalized contains '#${trait}#'`)
          .join(' OR');
      query += ' )';
      dirty = true;
    }
    if (this.type_code && this.type_code.length) {
      if (dirty) {
        query += ' AND';
      }
      query += ' (';
      query +=
        map(this.type_code, type => ` type_code = '${type}'`).join(' OR');
      query += ' )';
      dirty = true;
    }
    query += ' )';
    return query;
  }

  static parseList(jsonList: any[]): DeckOption[] {
    return map(jsonList, json => {
      const deck_option = new DeckOption();
      deck_option.aspect_select = json.aspect_select || [];
      deck_option.uses = json.uses || [];
      deck_option.text = json.text || [];
      deck_option.trait = json.trait || [];
      deck_option.type_code = json.type || [];
      deck_option.limit = json.limit;
      deck_option.error = json.error;
      deck_option.not = json.not ? true : undefined;

      if (json.atleast) {
        const atleast = new DeckAtLeastOption();
        atleast.factions = json.atleast.factions;
        atleast.min = json.atleast.min;
        deck_option.atleast = atleast;
      }

      return deck_option;
    });
  }
}
