export const STORY_CARDS_QUERY = `((deck_limit >= 0) and (spoiler == true || (subtype_code != null && restrictions == null)))`;
export const ENCOUNTER_CARDS_QUERY = '(faction_code == "encounter")';
export const PLAYER_CARDS_QUERY = '(deck_limit >= 0)';
