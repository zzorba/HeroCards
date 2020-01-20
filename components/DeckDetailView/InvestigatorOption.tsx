import React from 'react';
import { indexOf } from 'lodash';
import { t } from 'ttag';

import AspectSelectPicker from './AspectSelectPicker';
import HeroGradient from '../core/HeroGradient';
import { DeckMeta } from '../../actions/types';
import Card from '../../data/Card';
import DeckOption from '../../data/DeckOption';

interface Props {
  investigator: Card;
  option: DeckOption;
  meta: DeckMeta;
  setMeta: (key: string, value: string) => void;
  disabled?: boolean;
}

export default class InvestigatorOption extends React.Component<Props> {
  _onChange = (selection: string) => {
    const {
      option,
      setMeta,
    } = this.props;
    if (option.aspect_select && option.aspect_select.length) {
      setMeta('aspect', selection);
    }
  };

  render() {
    const {
      investigator,
      option,
      meta,
      disabled,
    } = this.props;
    if (option.aspect_select && option.aspect_select.length) {
      const selection = (
        meta.aspect &&
        indexOf(option.aspect_select, meta.aspect) !== -1
      ) ? meta.aspect : undefined;
      return (
        <AspectSelectPicker
          name={t`Aspect`}
          aspects={option.aspect_select}
          onChange={this._onChange}
          selection={selection}
          color={HeroGradient.color(investigator.card_set_code).primary}
          disabled={disabled}
        />
      );
    }
    // Don't know how to render this 'choice'.
    return null;
  }
}
