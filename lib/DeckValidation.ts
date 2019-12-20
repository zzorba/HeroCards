import {
  groupBy,
  mapValues,
  forEach,
  find,
  findKey,
  filter,
  indexOf,
} from 'lodash';

import { DeckMeta, DeckProblem, DeckProblemType } from '../actions/types';
import Card from '../data/Card';
import DeckOption from '../data/DeckOption';


// Code taken from:
// https://github.com/Kamalisk/MarvelCDB/blob/4c194c54fcbc381e45b93f0f1bcb65a37ae581a9/src/AppBundle/Resources/public/js/app.deck.js
/* eslint-disable */

interface DeckOptionsCount {
  limit: number,
  atleast: {
    [faction_code: string]: number,
  };
}

export default class DeckValidation {
  investigator: Card;
  meta?: DeckMeta;
  problem_list: string[] = [];
  deck_options_counts: DeckOptionsCount[] = [];

  constructor(investigator: Card, meta?: DeckMeta) {
    this.investigator = investigator;
    this.meta = meta;
  }

  getDeckSize(): [number, number] {
    var size: [number, number] = [40, 50];
    return size;
  }

  getPhysicalDrawDeck(cards: Card[]) {
    return filter(cards, card => (
      card &&
      !card.double_sided &&
      card.type_code !== 'hero' &&
      card.type_code !== 'alter_ego'
    ));
  }

  getDrawDeck(cards: Card[]) {
    return filter(
      this.getPhysicalDrawDeck(cards),
      card => !!card
    );
  }

  getDrawDeckSize(cards: Card[]) {
    var draw_deck = this.getDrawDeck(cards);
	  return draw_deck.length;
  }

  getCopiesAndDeckLimit(cards: Card[]) {
    return mapValues(
      groupBy(this.getDrawDeck(cards), card => card ? card.real_name : 'Unknown Card'),
      group => {
        return {
          nb_copies: group.length,
          deck_limit: group[0].deck_limit || 0,
        };
      });
  }

  getProblem(cards: Card[]): DeckProblem | null {
    const reason = this.getProblemHelper(cards);
    if (!reason) {
      return null;
    }
    return {
      reason,
      problems: [...this.problem_list],
    };
  }

  getProblemHelper(cards: Card[]): DeckProblemType | null {
    if (!this.meta || !this.meta.aspect) {
      return 'aspect';
    }
	  // get investigator data
  	var card = this.investigator;
  	// store list of all problems
  	this.problem_list = [];
  	if (card && card.deck_requirements){
  		//console.log(card.deck_requirements);
  		// must have the required cards
  		if (card.deck_requirements.card){
  			var req_count = 0;
  			var req_met_count = 0;
  			forEach(card.deck_requirements.card, possible => {
  				req_count++;
          if (find(cards, theCard =>
            theCard.code === possible.code ||
            find(possible.alternates, alt => alt === theCard.code))) {
            req_met_count++;
          }
  			});
  			if (req_met_count < req_count) {
  				return 'hero';
  			}
  		}
  	} else {

  	}
    const [minDeckSize, maxDeckSize] = this.getDeckSize();

  	// too many copies of one card
  	if(findKey(
        this.getCopiesAndDeckLimit(cards),
        value => value.nb_copies > value.deck_limit) != null) {
      return 'too_many_copies';
    }

  	// no invalid card
    const invalidCards = this.getInvalidCards(cards);
  	if(invalidCards.length > 0) {
      // console.log('Invalid cards:' + map(invalidCards, card => card.code))
  		return 'invalid_cards';
  	}

    const deck_options = this.deckOptions();
  	for (var i = 0; i < deck_options.length; i++) {
      const option = deck_options[i];
      if (!option) {
        continue;
      }
  		if (this.deck_options_counts[i].limit && option.limit){
  			if (this.deck_options_counts[i].limit > option.limit){
  				if (option.error) {
  					this.problem_list.push(option.error);
  				}
  				return 'hero';
  			}
  		}
      const atleast = option.atleast;
  		if (atleast) {
  			if (atleast.factions && atleast.min){
  				var faction_count = 0;
          forEach(this.deck_options_counts[i].atleast, (value) => {
  					if (value >= atleast.min){
  						faction_count++;
  					}
  				})
  				if (faction_count < atleast.factions){
  					if (option.error){
  						this.problem_list.push(option.error);
  					}
  					return 'hero';
  				}
  			}
  		}
  	}

    const drawDeckSize = this.getDrawDeckSize(cards);
  		// at least 60 others cards
  	if(drawDeckSize < minDeckSize) {
  		return 'too_few_cards';
  	}

  	// at least 60 others cards
  	if(drawDeckSize > maxDeckSize) {
  		return 'too_many_cards';
  	}
    return null;
  }

  getInvalidCards(cards: Card[]) {
    this.deck_options_counts = [];
  	if (this.investigator) {
  		for (var i = 0; i < this.investigator.heroSelectOptions().length; i++){
  			this.deck_options_counts.push({
          limit: 0,
          atleast: {}
        });
  		}
  	}
  	return filter(cards, card => !this.canIncludeCard(card, true));
  }

  deckOptions(): DeckOption[] {
    var deck_options: DeckOption[] = [];
  	if (this.investigator) {
      forEach(this.investigator.heroSelectOptions(),
        deck_option => deck_options.push(deck_option)
      );
    }
    return deck_options;
  }

  canIncludeCard(
    card: Card,
    processDeckCounts: boolean
  ): boolean {
    const investigator = this.investigator;

  	// hide investigators
  	if (card.type_code === 'hero') {
  		return false;
  	}
  	if (card.faction_code === 'encounter') {
  		return false;
  	}

  	// reject cards restricted
  	if (card.restrictions &&
        card.restrictions.investigators &&
        !find(card.restrictions.investigators, code => code === investigator.code)) {
  		return false;
  	}

    // reject cards from other heroes
    if (card.faction_code === 'hero' && card.card_set_code) {
      return (card.card_set_code === investigator.card_set_code);
    }

  	//var investigator = app.data.cards.findById(investigator_code);
    const deck_options: DeckOption[] = this.deckOptions();
    if (deck_options.length) {
  		// console.log(card);
  		for (var i = 0; i < deck_options.length; i++) {
        const finalOption = (i === deck_options.length - 1);
  			var option = deck_options[i];
        if (option.aspect_select && option.aspect_select.length) {
          let selected_faction: string = option.aspect_select[0]
          if (this.meta &&
            this.meta.aspect &&
            indexOf(option.aspect_select, this.meta.aspect) !== -1
          ) {
            selected_faction = this.meta.aspect;
          }
          if (card.faction_code != selected_faction &&
            card.faction2_code != selected_faction){
            // console.log(`${card.faction_code} does not match selected faction: ${selected_faction}`);
            continue;
          }
        }
        if (option.aspect && option.aspect.length) {
          var aspect_valid = false;
  				for(var j = 0; j < option.aspect.length; j++){
  					var aspect = option.aspect[j];
  					if (card.faction_code == aspect ||
              card.faction2_code == aspect){
  						aspect_valid = true;
  					}
  				}
  				if (!aspect_valid){
  					continue;
  				}
        }
  			if (option.type_code && option.type_code.length){
  				// needs to match at least one faction
  				var type_valid = false;
  				for(var j = 0; j < option.type_code.length; j++){
  					var type = option.type_code[j];
  					if (card.type_code == type){
  						type_valid = true;
  					}
  				}

  				if (!type_valid){
  					continue;
  				}
  				//console.log("faction valid");
  			}

  			if (option.trait && option.trait.length){
  				// needs to match at least one trait
  				var trait_valid = false;

  				for(var j = 0; j < option.trait.length; j++){
  					var trait = option.trait[j];
  					//console.log(card.traits, trait.toUpperCase()+".");

  					if (card.real_traits && card.real_traits.toUpperCase().indexOf(trait.toUpperCase()+".") !== -1){
  						trait_valid = true;
  					}
  				}

  				if (!trait_valid){
  					continue;
  				}
  				//console.log("faction valid");
  			}

  			if (option.uses && option.uses.length){
  				// needs to match at least one trait
  				var uses_valid = false;

  				for(var j = 0; j < option.uses.length; j++){
  					var uses = option.uses[j];
  					//console.log(card.traits, trait.toUpperCase()+".");

  					if (card.real_text && card.real_text.toUpperCase().indexOf(""+uses.toUpperCase()+").") !== -1){
  						uses_valid = true;
  					}
  				}

  				if (!uses_valid){
  					continue;
  				}
  				//console.log("faction valid");
  			}

        if (option.text && option.text.length) {
          var text_valid = false;
          for(var j = 0; j < option.text.length; j++){
            var text = option.text[j];
            if (card.real_text && card.real_text.toLowerCase().match(text)){
              text_valid = true;
  					}
          }
          if (!text_valid) {
            continue;
          }
        }
  			if (option.not){
  				return false;
  			} else {
          if (processDeckCounts && option.atleast && card.faction_code) {
            if (!this.deck_options_counts[i].atleast[card.faction_code]) {
              this.deck_options_counts[i].atleast[card.faction_code] = 0;
            }
            this.deck_options_counts[i].atleast[card.faction_code] += 1;

            if (card.faction2_code){
              if (!this.deck_options_counts[i].atleast[card.faction2_code]){
                this.deck_options_counts[i].atleast[card.faction2_code] = 0;
              }
              this.deck_options_counts[i].atleast[card.faction2_code] += 1;
            }
          }
  				if (processDeckCounts && option.limit) {
            if (finalOption || this.deck_options_counts[i].limit < option.limit) {
				      this.deck_options_counts[i].limit += 1;
              return true;
            }
  				} else {
            return true;
          }
  			}
  		}
  	}

  	return false;
  }
}
