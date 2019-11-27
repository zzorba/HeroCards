import React from 'react';
import { map } from 'lodash';
import { SettingsPicker } from 'react-native-settings-components';
import { t } from 'ttag';

import { FactionCodeType, FACTION_COLORS } from '../../constants';
import Card from '../../data/Card';
import { COLORS } from '../../styles/colors';

interface Props {
  name: string;
  aspects: FactionCodeType[];
  selection?: FactionCodeType;
  onChange: (faction: FactionCodeType) => void;
  investigatorFaction?: FactionCodeType;
  disabled?: boolean;
}

export default class FactionSelectPicker extends React.Component<Props> {
  ref?: SettingsPicker<FactionCodeType>;

  _captureRef = (ref: SettingsPicker<FactionCodeType>) => {
    this.ref = ref;
  };

  _onChange = (selection: FactionCodeType) => {
    this.ref && this.ref.closeModal();
    const {
      onChange,
    } = this.props;
    onChange(selection);
  };

  _codeToLabel = (faction: string) => {
    return Card.factionCodeToName(faction, t`Select Faction`);
  };

  render() {
    const {
      aspects,
      selection,
      name,
      investigatorFaction,
      disabled,
    } = this.props;
    const options = map(aspects, aspect => {
      return {
        label: this._codeToLabel(aspect),
        value: aspect,
      };
    });
    const color = investigatorFaction ?
      FACTION_COLORS[investigatorFaction] :
      COLORS.lightBlue;
    return (
      <SettingsPicker
        ref={this._captureRef}
        disabled={disabled}
        disabledOverlayStyle={{
          backgroundColor: 'rgba(255,255,255,0.0)',
        }}
        valueStyle={{
          color: COLORS.darkGray,
        }}
        title={name}
        value={selection}
        valueFormat={this._codeToLabel}
        onValueChange={this._onChange}
        modalStyle={{
          header: {
            wrapper: {
              backgroundColor: color,
            },
            description: {
              paddingTop: 8,
            },
          },
          list: {
            itemColor: color,
          },
        }}
        options={options}
        containerStyle={{
          backgroundColor: 'transparent',
        }}
      />
    );
  }
}
