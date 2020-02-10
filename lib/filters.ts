import { findIndex, forEach, map } from 'lodash';

import { RESOURCES, FactionCodeType } from '../constants';


export interface ResourceFilters {
  physical: boolean;
  mental: boolean;
  energy: boolean;
  wild: boolean;
  doubleIcons: boolean;
}
export interface FilterState {
  [key: string]: string[] | boolean | [number, number] | ResourceFilters;
  factions: FactionCodeType[];
  uses: string[];
  types: string[];
  subTypes: string[];
  traits: string[];
  packs: string[];
  encounters: string[];
  illustrators: string[];
  costEnabled: boolean;
  resourceEnabled: boolean;
  unique: boolean;
  resources: ResourceFilters;
  enemyHealthEnabled: boolean;
  enemyHealthPerHero: boolean;
  enemyAttackEnabled: boolean;
  enemySchemeEnabled: boolean;
  // Misc traits
  enemyElite: boolean;
  enemyNonElite: boolean;
  enemyGuard: boolean;
  enemyQuickstrike: boolean;
  enemyTough: boolean;
  enemyRetaliate: boolean;
  // Slider controls that are dynamically sized
  cost: [number, number];
  enemyHealth: [number, number];
  enemyAttack: [number, number];
  enemyScheme: [number, number];
}

export const defaultFilterState: FilterState = {
  factions: [],
  uses: [],
  types: [],
  subTypes: [],
  traits: [],
  packs: [],
  encounters: [],
  illustrators: [],
  costEnabled: false,
  resourceEnabled: false,
  unique: false,
  resources: {
    physical: false,
    mental: false,
    energy: false,
    wild: false,
    doubleIcons: false,
  },
  enemyHealthEnabled: false,
  enemyHealthPerHero: false,
  enemyAttackEnabled: false,
  enemySchemeEnabled: false,
  // Misc traits
  enemyElite: false,
  enemyNonElite: false,
  enemyGuard: false,
  enemyTough: false,
  enemyQuickstrike: false,
  enemyRetaliate: false,

  // Slider controls that are dynamically sized
  cost: [0, 6],
  enemyHealth: [0, 10],
  enemyAttack: [0, 5],
  enemyScheme: [0, 5],
};

function safeValue(value: any) {
  return value;
}

function applyRangeFilter(
  query: string[],
  field: string,
  values: [number, number],
  linked: boolean
) {
  if (values[0] === values[1]) {
    query.push(`(${field} == ${values[0]}${linked ? ` or linked_card.${field} == ${values[0]}` : ''})`);
  } else {
    query.push(`((${field} >= ${values[0]} and ${field} <= ${values[1]})${linked ? ` or (linked_card.${field} >= ${values[0]} and linked_card.${field} <= ${values[1]})` : ''})`);
  }
}

function applyTraitFilter(filters: FilterState, query: string[]) {
  const {
    traits,
  } = filters;
  if (traits.length) {
    query.push([
      '(',
      map(traits, t => `traits_normalized CONTAINS[c] "${safeValue(t)}"`).join(' or '),
      ' or ',
      map(traits, t => `linked_card.traits_normalized CONTAINS[c] "${safeValue(t)}"`).join(' or '),
      ')',
    ].join(''));
  }
}

function applyResourcesFilter(resourceFilters: ResourceFilters, query: string[]) {
  const parts: string[] = [];
  const doubleIcons = resourceFilters.doubleIcons;
  const matchAll = doubleIcons &&
    (findIndex(RESOURCES, skill => resourceFilters[skill]) === -1);

  forEach(RESOURCES, resource => {
    if (matchAll || resourceFilters[resource]) {
      parts.push(`resource_${resource} > ${doubleIcons ? 1 : 0}`);
    }
  });

  if (parts.length) {
    query.push(`(${parts.join(' or ')})`);
  }
}

function applyEnemyFilters(filters: FilterState, query: string[]) {
  const {
    // toggle filters
    enemyElite,
    enemyNonElite,
    enemyRetaliate,
    enemyGuard,
    enemyQuickstrike,
    enemyTough,
    // range filters
    enemyHealth,
    enemyHealthEnabled,
    enemyHealthPerHero,
    enemyAttack,
    enemyAttackEnabled,
    enemyScheme,
    enemySchemeEnabled,
  } = filters;
  const oldLength = query.length;
  if (enemyElite && !enemyNonElite) {
    query.push(`(traits_normalized CONTAINS[c] 'elite' or linked_card.traits_normalized CONTAINS[c] 'elite')`);
  }
  if (enemyNonElite && !enemyElite) {
    query.push(`((type_code == 'enemy' and !(traits_normalized CONTAINS[c] 'elite')) or (linked_card.type_code == 'enemy' and !(linked_card.traits_normalized CONTAINS[c] 'elite')))`);
  }
  if (enemyRetaliate) {
    query.push(`(real_text CONTAINS 'Retaliate.' or linked_card.real_text CONTAINS 'Retaliate.')`);
  }
  if (enemyQuickstrike) {
    query.push(`(real_text CONTAINS 'Quickstrike.' or linked_card.real_text CONTAINS 'Quickstrike.')`);
  }
  if (enemyTough) {
    query.push(`(real_text CONTAINS 'Tough.' or linked_card.real_text CONTAINS 'Tough.')`);
  }
  if (enemyGuard) {
    query.push(`(real_text CONTAINS 'Guard' or linked_card.real_text CONTAINS 'Guard')`);
  }
  if (enemyAttackEnabled) {
    applyRangeFilter(query, 'attack', enemyAttack, true);
  }
  if (enemySchemeEnabled) {
    applyRangeFilter(query, 'scheme', enemyScheme, true);
  }
  if (enemyHealthEnabled) {
    applyRangeFilter(query, 'health', enemyHealth, true);
    query.push(`((type_code == 'minion' and health_per_hero == ${enemyHealthPerHero}) or (linked_card.type_code == 'enemy' && linked_card.health_per_investigator == ${enemyHealthPerHero}))`);
  }
  if (query.length !== oldLength ||
    (enemyElite && enemyNonElite)) {
    query.push(`(type_code == 'minion' or linked_card.type_code == 'minion')`);
  }
}

function applyCostFilter(filters: FilterState, query: string[]) {
  const {
    costEnabled,
    cost,
  } = filters;
  if (costEnabled) {
    applyRangeFilter(query, 'cost', cost, false);
  }
}

function applyFilter(values: string[], field: string, query: string[]) {
  if (values.length) {
    query.push(`(${map(values, value => `${field} == "${safeValue(value)}"`).join(' or ')})`);
  }
}

function applyPlayerCardFilters(filters: FilterState, query: string[]) {
  const {
    uses,
    unique,
  } = filters;
  applyFilter(uses, 'uses', query);
  if (unique) {
    query.push('((is_unique == true or linked_card.is_unique == true) && type_code != "enemy")');
  }
}

export function filterToQuery(filters: FilterState): string[] {
  const query = [];
  if (filters.factions.length) {
    query.push(`(${map(filters.factions, value => `faction_code == "${safeValue(value)}" or faction2_code == "${safeValue(value)}"`).join(' or ')})`);
  }
  applyFilter(filters.types, 'type_name', query);
  applyFilter(filters.subTypes, 'subtype_name', query);
  applyPlayerCardFilters(filters, query);
  applyFilter(filters.packs, 'pack_name', query);
  applyFilter(filters.encounters, 'card_set_name', query);
  applyFilter(filters.illustrators, 'illustrator', query);
  if (filters.resourceEnabled) {
    applyResourcesFilter(filters.resources, query);
  }
  applyCostFilter(filters, query);
  applyTraitFilter(filters, query);
  applyEnemyFilters(filters, query);
  return query;
}

export default {
  filterToQuery,
};
