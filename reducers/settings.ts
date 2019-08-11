import {
  SET_SINGLE_CARD_VIEW,
  SetSingleCardViewAction,
} from '../actions/types';

interface SettingsState {
  singleCardView?: boolean;
}

const DEFAULT_SETTINGS_STATE: SettingsState = {
  singleCardView: false,
};

type SettingAction = SetSingleCardViewAction;


export default function(
  state: SettingsState = DEFAULT_SETTINGS_STATE,
  action: SettingAction
): SettingsState {
  switch (action.type) {
    case SET_SINGLE_CARD_VIEW: {
      return {
        ...state,
        singleCardView: action.singleCardView,
      };
    }
    default: {
      return state;
    }
  }
}
