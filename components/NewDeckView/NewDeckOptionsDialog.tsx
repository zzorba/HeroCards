import React from 'react';
import {
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { find, forEach, map, sumBy, throttle } from 'lodash';
import { bindActionCreators, Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import DialogComponent from 'react-native-dialog';

import RequiredCardSwitch from './RequiredCardSwitch';
import { showDeckModal } from '../navHelper';
import Dialog from '../core/Dialog';
import withNetworkStatus, { NetworkStatusProps } from '../core/withNetworkStatus';
import withLoginState, { LoginStateProps } from '../withLoginState';
import withPlayerCards, { PlayerCardProps } from '../withPlayerCards';
import { saveNewDeck, NewDeckParams } from '../decks/actions';
import { Deck, Slots } from '../../actions/types';
import Card from '../../data/Card';
import { AppState } from '../../reducers';
import { t } from 'ttag';
import typography from '../../styles/typography';
import space from '../../styles/space';
import { COLORS } from '../../styles/colors';

interface OwnProps {
  componentId: string;
  toggleVisible: () => void;
  heroId?: string;
  viewRef?: View;
  onCreateDeck: (deck: Deck) => void;
}

interface ReduxActionProps {
  saveNewDeck: (params: NewDeckParams) => Promise<Deck>;
}

type Props = OwnProps &
  PlayerCardProps & ReduxActionProps &
  NetworkStatusProps & LoginStateProps;

interface State {
  saving: boolean;
  deckName?: string;
  offlineDeck: boolean;
  optionSelected: boolean[];
}

class NewDeckOptionsDialog extends React.Component<Props, State> {
  _textInputRef?: TextInput;
  _onOkayPress!: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      saving: false,
      offlineDeck: !props.signedIn || props.networkType === 'none',
      optionSelected: [true],
    };

    this._onOkayPress = throttle(this.onOkayPress.bind(this), 200);
  }

  componentDidUpdate(prevProps: Props) {
    const {
      heroId,
    } = this.props;
    if (heroId && heroId !== prevProps.heroId) {
      this.resetForm();
    }
  }

  _onDeckTypeChange = (value: boolean) => {
    this.setState({
      offlineDeck: !value,
    });
  };

  _onDeckNameChange = (value: string) => {
    this.setState({
      deckName: value,
    });
  };

  _toggleOptionsSelected = (index: number, value: boolean) => {
    const optionSelected = this.state.optionSelected.slice();
    optionSelected[index] = value;

    this.setState({
      optionSelected,
    });
  };

  _captureTextInputRef = (ref: TextInput) => {
    this._textInputRef = ref;
  };

  resetForm() {
    this.setState({
      deckName: this.deckName(),
      saving: false,
      optionSelected: [true],
    });
  }

  _showNewDeck = (deck: Deck) => {
    const {
      componentId,
      onCreateDeck,
      toggleVisible,
    } = this.props;
    const hero = this.hero();
    this.setState({
      saving: false,
    });
    if (Platform.OS === 'android') {
      toggleVisible();
    }
    // Change the deck options for required cards, if present.
    onCreateDeck && onCreateDeck(deck);
    showDeckModal(componentId, deck, hero);
  };

  getSlots() {
    const {
      cards,
    } = this.props;
    const {
      optionSelected,
    } = this.state;
    const slots: Slots = {};

    // Seed all the 'basic' requirements from the hero.
    const hero = this.hero();
    if (hero && hero.deck_requirements) {
      forEach(hero.deck_requirements.card, cardRequirement => {
        const card = cards[cardRequirement.code];
        slots[cardRequirement.code] = card.deck_limit || card.quantity || 0;
      });
    }

    if (optionSelected[0] !== true ||
      sumBy(optionSelected, x => x ? 1 : 0) !== 1) {
      // Now sub in the options that were asked for if we aren't going
      // with the defaults.
      const options = this.requiredCardOptions();
      forEach(optionSelected, (include, index) => {
        const cards = options[index];
        forEach(cards, card => {
          if (include) {
            slots[card.code] = card.deck_limit || card.quantity || 0;
          } else if (slots[card.code]) {
            delete slots[card.code];
          }
        });
      });
    }

    return slots;
  }

  onOkayPress(isRetry?: boolean) {
    const {
      signedIn,
      networkType,
      saveNewDeck,
    } = this.props;
    const {
      deckName,
      offlineDeck,
      saving,
    } = this.state;
    const hero = this.hero();
    if (hero && (!saving || isRetry)) {
      const local = (offlineDeck || !signedIn || networkType === 'none');
      this.setState({
        saving: true,
      });
      saveNewDeck({
        local,
        deckName: deckName || t`New Deck`,
        heroCode: hero.code,
        slots: this.getSlots(),
      }).then(
        this._showNewDeck,
        () => {
          // TODO: error
          this.setState({
            saving: false,
          });
        }
      );
    }
  }

  hero() {
    const {
      heroId,
      investigators,
    } = this.props;
    return heroId ? investigators[heroId] : undefined;
  }

  deckName() {
    const hero = this.hero();
    if (!hero) {
      return undefined;
    }
    switch (hero.faction_code) {
      case 'guardian':
        return t`The Adventures of ${hero.name}`;
      case 'seeker':
        return t`${hero.name} Investigates`;
      case 'mystic':
        return t`The ${hero.name} Mysteries`;
      case 'rogue':
        return t`The ${hero.name} Job`;
      case 'survivor':
        return t`${hero.name} on the Road`;
      default:
        return t`${hero.name} Does It All`;
    }
  }

  requiredCardOptions() {
    const {
      cards,
    } = this.props;
    const hero = this.hero();
    if (!hero) {
      return [];
    }
    const result: Card[][] = [[]];
    forEach(
      hero.deck_requirements ? hero.deck_requirements.card : [],
      cardRequirement => {
        result[0].push(cards[cardRequirement.code]);
        if (cardRequirement.alternates && cardRequirement.alternates.length) {
          forEach(cardRequirement.alternates, (altCode, index) => {
            while (result.length <= index + 1) {
              result.push([]);
            }
            result[index + 1].push(cards[altCode]);
          });
        }
      }
    );
    return result;
  }

  renderFormContent() {
    const {
      heroId,
      signedIn,
      refreshNetworkStatus,
      networkType,
    } = this.props;
    const {
      saving,
      deckName,
      offlineDeck,
      optionSelected,
    } = this.state;
    if (saving) {
      return (
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          animating
        />
      );
    }
    const cardOptions = this.requiredCardOptions();
    return (
      <React.Fragment>
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Name` }
        </DialogComponent.Description>
        <DialogComponent.Input
          textInputRef={this._captureTextInputRef}
          value={deckName}
          onChangeText={this._onDeckNameChange}
          returnKeyType="done"
        />
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Required Cards` }
        </DialogComponent.Description>
        { map(cardOptions, (requiredCards, index) => {
          return (
            <RequiredCardSwitch
              key={`${heroId}-${index}`}
              index={index}
              disabled={index === 0 && cardOptions.length === 1}
              label={map(requiredCards, card => card.name).join('\n')}
              value={optionSelected[index] || false}
              onValueChange={this._toggleOptionsSelected}
            />
          );
        }) }
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Deck Type` }
        </DialogComponent.Description>
        <DialogComponent.Switch
          label={t`Create on ArkhamDB`}
          value={!offlineDeck}
          disabled={!signedIn || networkType === 'none'}
          onValueChange={this._onDeckTypeChange}
          trackColor={COLORS.switchTrackColor}
        />
        { !signedIn && (
          <DialogComponent.Description style={[typography.small, space.marginBottomS, styles.networkMessage]}>
            { t`Visit Settings to sign in to ArkhamDB.` }
          </DialogComponent.Description>
        ) }
        { networkType === 'none' && (
          <TouchableOpacity onPress={refreshNetworkStatus}>
            <DialogComponent.Description style={[typography.small, { color: COLORS.red }, space.marginBottomS]}>
              { t`You seem to be offline. Refresh Network?` }
            </DialogComponent.Description>
          </TouchableOpacity>
        ) }
      </React.Fragment>
    );
  }

  render() {
    const {
      toggleVisible,
      viewRef,
      heroId,
    } = this.props;
    const {
      saving,
      optionSelected,
    } = this.state;
    const hero = this.hero();
    if (!hero) {
      return null;
    }
    const okDisabled = saving || !find(optionSelected, selected => selected);
    return (
      <Dialog
        title={t`New Deck`}
        visible={!!heroId}
        viewRef={viewRef}
      >
        { this.renderFormContent() }
        <DialogComponent.Button
          label={t`Cancel`}
          onPress={toggleVisible}
        />
        <DialogComponent.Button
          label={t`Okay`}
          color={okDisabled ? COLORS.darkGray : COLORS.lightBlue}
          disabled={okDisabled}
          onPress={this._onOkayPress}
        />
      </Dialog>
    );
  }
}

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch: Dispatch<Action>): ReduxActionProps {
  return bindActionCreators({ saveNewDeck } as any, dispatch);
}

export default withPlayerCards<OwnProps>(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(
    withLoginState<OwnProps & ReduxActionProps & PlayerCardProps>(
      withNetworkStatus(NewDeckOptionsDialog),
      { noWrapper: true }
    )
  )
);

const styles = StyleSheet.create({
  spinner: {
    height: 80,
  },
  networkMessage: {
    marginLeft: Platform.OS === 'ios' ? 28 : 8,
    marginRight: Platform.OS === 'ios' ? 28 : 8,
  },
});
