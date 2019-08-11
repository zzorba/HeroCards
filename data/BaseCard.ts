import { filter } from 'lodash';
import { t } from 'ttag';

import { FactionCodeType, TypeCodeType, ResourceCodeType } from '../constants';
import CardRestrictions from './CardRestrictions';
import DeckRequirement from './DeckRequirement';
import DeckOption from './DeckOption';

export default class BaseCard {
  protected static SCHEMA = {
    id: 'string',
    code: { type: 'string', indexed: true },
    pack_code: 'string',
    pack_name: 'string',
    type_code: { type: 'string', indexed: true },
    type_name: 'string',
    subtype_code: 'string?',
    subtype_name: 'string?',
    slot: 'string?',
    faction_code: { type: 'string', optional: true, indexed: true },
    faction_name: 'string?',
    faction2_code: { type: 'string', optional: true, indexed: true },
    faction2_name: 'string?',
    position: 'int',
    attack: 'int?',
    attack_cost: 'int?',
    thwart: 'int?',
    thwart_cost: 'int?',
    defense: 'int?',
    recover: 'int?',
    hand_size: 'int?',
    boost: 'int?',
    boost_text: 'string?',
    scheme: 'string?',
    encounter_name: 'string?',
    encounter_position: 'int?',
    renderName: 'string',
    renderSubname: 'string?',
    name: 'string',
    real_name: 'string',
    subname: 'string?',
    illustrator: 'string?',
    text: 'string?',
    flavor: 'string?',
    cost: 'int?',
    real_text: 'string?',
    back_name: 'string?',
    back_text: 'string?',
    back_flavor: 'string?',
    quantity: 'int?',
    spoiler: 'bool?',
    stage: 'int?', // Act/Agenda deck
    base_threat: 'int?',
    escalation_threat: 'int?',
    escalation_threat_fixed: 'bool?',
    scheme_acceleration: 'int?',
    scheme_crisis: 'int?',
    scheme_hazard: 'int?',
    threat: 'int?',
    threat_fixed: 'int?',
    health: 'int?',
    health_per_hero: 'bool?',
    deck_limit: 'int?',
    traits: 'string?',
    real_traits: 'string?',
    is_unique: 'bool?',
    exile: 'bool?',
    hidden: 'bool?',
    double_sided: 'bool',
    url: 'string?',
    octgn_id: 'string?',
    imagesrc: 'string?',
    backimagesrc: 'string?',
    resource_energy: 'int?',
    resource_physical: 'int?',
    resource_mental: 'int?',
    resource_wild: 'int?',
    linked_to_code: 'string?',
    linked_to_name: 'string?',

    // Parsed data (from original)
    restrictions: 'CardRestrictions?',
    deck_requirements: 'DeckRequirement?',
    deck_options: 'DeckOption[]',
    linked_card: 'Card',
    back_linked: 'bool?',

    // Derived data.
    has_restrictions: 'bool',
    traits_normalized: 'string?',
    real_traits_normalized: 'string?',
    uses: 'string?',
    sort_by_type: 'int',
    sort_by_faction: 'int',
    sort_by_pack: 'int',
  };
  public id!: string;
  public code!: string;
  public pack_code!: string;
  public pack_name!: string;
  public type_code!: TypeCodeType;
  public type_name!: string;
  public subtype_code?: 'basicweakness' | 'weakness';
  public subtype_name!: string | null;
  public faction_code?: FactionCodeType;
  public faction_name!: string | null;
  public faction2_code?: FactionCodeType;
  public faction2_name!: string | null;
  public position!: number;
  public enemy_damage!: number | null;
  public enemy_horror!: number | null;
  public enemy_fight!: number | null;
  public enemy_evade!: number | null;
  public encounter_code!: string | null;
  public encounter_name!: string | null;
  public encounter_position!: number | null;
  public renderName!: string;
  public renderSubname!: string | null;
  public name!: string;
  public real_name!: string;
  public subname!: string | null;
  public illustrator!: string | null;
  public text!: string | null;
  public flavor!: string | null;
  public cost!: number | null;
  public real_text!: string | null;
  public back_name!: string | null;
  public back_text!: string | null;
  public back_flavor!: string | null;
  public quantity!: number | null;
  public spoiler?: boolean;
  public stage!: number | null;
  public health!: number | null;
  public health_per_hero?: boolean;
  public deck_limit!: number | null;
  public traits!: string | null;
  public real_traits!: string | null;
  public is_unique?: boolean;
  public hidden?: boolean;
  public double_sided?: boolean;
  public url!: string | null;
  public octgn_id!: string | null;
  public imagesrc!: string | null;
  public backimagesrc!: string | null;
  public resource_physical!: number | null;
  public resource_mental!: number | null;
  public resource_energy!: number | null;
  public resource_wild!: number | null;
  public linked_to_code!: string | null;
  public linked_to_name!: string | null;

  // Parsed data (from original)
  public restrictions?: CardRestrictions;
  public deck_requirements?: DeckRequirement;
  public deck_options!: DeckOption[];
  public linked_card?: BaseCard;
  public back_linked?: boolean;

  // Derived data.
  public has_restrictions!: boolean;
  public traits_normalized!: string | null;
  public real_traits_normalized!: string | null;
  public uses!: string | null;
  public sort_by_type!: number;
  public sort_by_faction!: number;
  public sort_by_pack!: number;


  factionCode(): FactionCodeType {
    return this.faction_code || 'basic';
  }

  costString(linked?: boolean) {
    if (this.type_code !== 'ally' &&
      this.type_code !== 'event') {
      return '';
    }
    if (this.double_sided ||
      linked ||
      (this.cost === null && (
        this.subtype_code === 'weakness' ||
        this.subtype_code === 'basicweakness'))) {
      return t`Cost: -`;
    }
    const costString = this.cost !== null ? this.cost : 'X';
    return t`Cost: ${costString}`;
  }

  resourceCount(skill: ResourceCodeType): number {
    switch (skill) {
      case 'physical': return this.resource_physical || 0;
      case 'mental': return this.resource_mental || 0;
      case 'energy': return this.resource_energy || 0;
      case 'wild': return this.resource_wild || 0;
      default: {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const _exhaustiveCheck: never = skill;
        return 0;
      }
    }
  }

  heroOptions(): DeckOption[] {
    if (this.type_code === 'hero' && this.deck_options) {
      return filter(this.deck_options, option => {
        return option.faction_select && option.faction_select.length > 0;
      });
    }
    return [];
  }
}
