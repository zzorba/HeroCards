import React from 'react';
import {
  ActivityIndicator,
  Platform,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { find, forEach, throttle } from 'lodash';
import { bindActionCreators, Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import DialogComponent from 'react-native-dialog';
import { NetInfoStateType } from '@react-native-community/netinfo';

import { showDeckModal } from '../navHelper';
import Dialog from '../core/Dialog';
import withNetworkStatus, { NetworkStatusProps } from '../core/withNetworkStatus';
import withLoginState, { LoginStateProps } from '../withLoginState';
import withPlayerCards, { PlayerCardProps } from '../withPlayerCards';
import { saveNewDeck, NewDeckParams } from '../decks/actions';
import { Deck, Slots } from '../../actions/types';
import { FactionCodeType } from '../../constants';
import Card from '../../data/Card';
import { t } from 'ttag';
import typography from '../../styles/typography';
import space from '../../styles/space';
import { COLORS } from '../../styles/colors';
import starterDecks from '../../assets/starter-decks';

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
  aspect: FactionCodeType;
  offlineDeck: boolean;
  starterDeck: boolean;
  optionSelected: boolean[];
}

class NewDeckOptionsDialog extends React.Component<Props, State> {
  _textInputRef?: TextInput;
  _onOkayPress!: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      saving: false,
      offlineDeck: !props.signedIn || !props.isConnected || props.networkType === NetInfoStateType.none,
      optionSelected: [true],
      starterDeck: false,
      aspect: 'aggression',
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

  _onStarterDeckChange = (value: boolean) => {
    const { heroId } = this.props;
    if (heroId) {
      const aspect = starterDecks[heroId].aspect;
      this.setState({
        aspect,
      });
    }
    this.setState({
      starterDeck: value,
    });
  }

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
    const slots: Slots = {};

    // Seed all the 'basic' requirements from the hero.
    const hero = this.hero();
    if (hero) {
      if (hero.deck_requirements) {
        forEach(hero.deck_requirements.card, cardRequirement => {
          const card = cards[cardRequirement.code];
          slots[cardRequirement.code] = card.deck_limit || card.quantity || 0;
        });
      }
      forEach(cards, card => {
        if (card.deck_limit &&
          card.faction_code === 'hero' &&
          card.card_set_code === hero.card_set_code &&
          card.code !== hero.code
        ) {
          slots[card.code] = card.deck_limit;
        }
      });
    }
    return slots;
  }

  onOkayPress(isRetry?: boolean) {
    const {
      signedIn,
      networkType,
      isConnected,
      saveNewDeck,
    } = this.props;
    const {
      aspect,
      deckName,
      offlineDeck,
      saving,
      starterDeck,
    } = this.state;
    const hero = this.hero();
    if (hero && (!saving || isRetry)) {
      const local = (offlineDeck || !signedIn || !isConnected || networkType === NetInfoStateType.none);
      let slots = this.getSlots();
      if (starterDeck && starterDecks[hero.code]) {
        slots = starterDecks[hero.code].slots;
      }
      this.setState({
        saving: true,
      });
      saveNewDeck({
        local,
        deckName: deckName || this.deckName() || t`New Deck`,
        investigatorCode: hero.code,
        meta: { aspect },
        slots: slots,
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
      heroes,
    } = this.props;
    return heroId ? heroes[heroId] : undefined;
  }

  deckName(): string | undefined {
    const hero = this.hero();
    if (!hero) {
      return undefined;
    }
    const { aspect } = this.state;
    switch (aspect) {
      case 'protection':
        return t`${hero.name} Protects the World`;
      case 'justice':
        return t`${hero.name} Fights for Justice`;
      case 'aggression':
        return t`${hero.name}'s Vengeance`;
      case 'leadership':
        return t`${hero.name} Leads the Team`;
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

  _onSelectAggression = () => {
    this.setState({
      aspect: 'aggression',
    });
  };

  _onSelectLeadership = () => {
    this.setState({
      aspect: 'leadership',
    });
  };

  _onSelectJustice = () => {
    this.setState({
      aspect: 'justice',
    });
  };

  _onSelectProtection = () => {
    this.setState({
      aspect: 'protection',
    });
  };

  renderAspects() {
    const { aspect } = this.state;
    return (
      <>
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Aspect` }
        </DialogComponent.Description>
        <DialogComponent.Switch
          label={t`Aggression`}
          value={aspect === 'aggression'}
          disabled={aspect === 'aggression'}
          onValueChange={this._onSelectAggression}
          trackColor={COLORS.switchTrackColor}
        />
        <DialogComponent.Switch
          label={t`Leadership`}
          value={aspect === 'leadership'}
          disabled={aspect === 'leadership'}
          onValueChange={this._onSelectLeadership}
          trackColor={COLORS.switchTrackColor}
        />
        <DialogComponent.Switch
          label={t`Justice`}
          value={aspect === 'justice'}
          disabled={aspect === 'justice'}
          onValueChange={this._onSelectJustice}
          trackColor={COLORS.switchTrackColor}
        />
        <DialogComponent.Switch
          label={t`Protection`}
          value={aspect === 'protection'}
          disabled={aspect === 'protection'}
          onValueChange={this._onSelectProtection}
          trackColor={COLORS.switchTrackColor}
        />
      </>
    );
  }

  renderFormContent() {
    const {
      heroId,
      signedIn,
      refreshNetworkStatus,
      networkType,
      isConnected,
    } = this.props;
    const {
      saving,
      deckName,
      offlineDeck,
      starterDeck,
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
    let hasStarterDeck = false;
    if (heroId) {
      hasStarterDeck = starterDecks[heroId] !== undefined;
    }
    return (
      <React.Fragment>
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Name` }
        </DialogComponent.Description>
        <DialogComponent.Input
          textInputRef={this._captureTextInputRef}
          value={deckName}
          placeholder={this.deckName()}
          onChangeText={this._onDeckNameChange}
          returnKeyType="done"
        />
        { this.renderAspects() }
        <DialogComponent.Description style={[typography.dialogLabel, space.marginBottomS]}>
          { t`Deck Type` }
        </DialogComponent.Description>
        <DialogComponent.Switch
          label={t`Create on MarvelCDB`}
          value={!offlineDeck}
          disabled={!signedIn || !isConnected || networkType === NetInfoStateType.none}
          onValueChange={this._onDeckTypeChange}
          trackColor={COLORS.switchTrackColor}
        />
        { !signedIn && (
          <DialogComponent.Description style={[typography.small, space.marginBottomS, styles.networkMessage]}>
            { t`Visit Settings to sign in to MarvelCDB.` }
          </DialogComponent.Description>
        ) }
        { (!isConnected || networkType === NetInfoStateType.none) && (
          <TouchableOpacity onPress={refreshNetworkStatus}>
            <DialogComponent.Description style={[
              typography.small,
              { color: COLORS.red },
              space.marginBottomS,
            ]}>
              { t`You seem to be offline. Refresh Network?` }
            </DialogComponent.Description>
          </TouchableOpacity>
        ) }
        { hasStarterDeck && (
          <DialogComponent.Switch
            label={t`Use Starter Deck?`}
            value={starterDeck}
            onValueChange={this._onStarterDeckChange}
            trackColor={COLORS.switchTrackColor}
          />
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


function mapDispatchToProps(dispatch: Dispatch<Action>): ReduxActionProps {
  return bindActionCreators({ saveNewDeck } as any, dispatch);
}

export default withPlayerCards<OwnProps>(
  connect(
    null,
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
