import {
  SET_SINGLE_CARD_VIEW,
  SetSingleCardViewAction,
} from '../../actions/types';

export function setSingleCardView(value: boolean): SetSingleCardViewAction {
  return {
    type: SET_SINGLE_CARD_VIEW,
    singleCardView: value,
  };
}
