import { forEach } from 'lodash';

import { Results } from 'realm';
import Card from '../../data/Card';
import { defaultFilterState } from '../../lib/filters';

function update(value: number | null, minMax: [number, number]): [number, number] {
  if (value === null || value < 0) {
    return minMax;
  }
  return [
    Math.min(value, minMax[0]),
    Math.max(value, minMax[1]),
  ];
}

export default function calculateDefaultFilterState(cards: Results<Card> | Card[]) {
  const result: { [field: string]: [number, number]} = {
    cost: [10, 0],
    health: [10, 0],
    enemy_attack: [10, 0],
    enemy_scheme: [10, 0],
  };
  forEach(cards, card => {
    result.cost = update(card.cost, result.cost);

    if (card.type_code === 'minion') {
      result.health = update(card.health, result.health);
      result.enemy_attack = update(card.attack, result.enemy_attack);
      result.enemy_scheme = update(card.scheme, result.enemy_scheme);
    }
    if (card.linked_card) {
      result.cost = update(card.linked_card.cost, result.cost);
      if (card.linked_card.type_code === 'minion') {
        result.health = update(card.linked_card.health, result.health);
        result.enemy_attack = update(card.linked_card.attack, result.enemy_attack);
        result.enemy_scheme = update(card.linked_card.scheme, result.enemy_scheme);
      }
    }
  });

  return Object.assign(
    {},
    defaultFilterState,
    {
      cost: result.cost,
      enemyHealth: result.health,
      enemyAttack: result.enemy_attack,
      enemyScheme: result.enemy_scheme,
    },
  );
}
