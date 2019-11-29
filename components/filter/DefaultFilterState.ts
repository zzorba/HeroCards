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
    enemy_damage: [10, 0],
    enemy_horror: [10, 0],
    enemy_fight: [10, 0],
    enemy_evade: [10, 0],
  };
  forEach(cards, card => {
    result.cost = update(card.cost, result.cost);

    if (card.type_code === 'minion') {
      result.health = update(card.health, result.health);
      result.enemy_damage = update(card.enemy_damage, result.enemy_damage);
      result.enemy_horror = update(card.enemy_horror, result.enemy_horror);
      result.enemy_fight = update(card.enemy_fight, result.enemy_fight);
      result.enemy_evade = update(card.enemy_evade, result.enemy_evade);
    }
    if (card.linked_card) {
      result.cost = update(card.linked_card.cost, result.cost);
      if (card.linked_card.type_code === 'minion') {
        result.health = update(card.linked_card.health, result.health);
        result.enemy_damage = update(card.linked_card.enemy_damage, result.enemy_damage);
        result.enemy_horror = update(card.linked_card.enemy_horror, result.enemy_horror);
        result.enemy_fight = update(card.linked_card.enemy_fight, result.enemy_fight);
        result.enemy_evade = update(card.linked_card.enemy_evade, result.enemy_evade);
      }
    }
  });

  return Object.assign(
    {},
    defaultFilterState,
    {
      cost: result.cost,
      enemyHealth: result.health,
      enemyDamage: result.enemy_damage,
      enemyHorror: result.enemy_horror,
      enemyFight: result.enemy_fight,
      enemyEvade: result.enemy_evade,
    },
  );
}
