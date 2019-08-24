import React from 'react';
import {
  find,
  findIndex,
  flatMap,
  forEach,
  keys,
  map,
  range,
  throttle,
} from 'lodash';
import {
  Alert,
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import { Navigation, EventSubscription } from 'react-native-navigation';
import DialogComponent from 'react-native-dialog';
import DeviceInfo from 'react-native-device-info';
import deepDiff from 'deep-diff';
import { t } from 'ttag';

import withLoginState, { LoginStateProps } from '../withLoginState';
import CopyDeckDialog from '../CopyDeckDialog';
import Dialog from '../core/Dialog';
import withDialogs, { InjectedDialogProps } from '../core/withDialogs';
import Button from '../core/Button';
import { iconsMap } from '../../app/NavIcons';
import {
  fetchPrivateDeck,
  fetchPublicDeck,
  removeDeck,
  uploadLocalDeck,
  saveDeckChanges,
  DeckChanges,
} from '../decks/actions';
import { Deck, DeckMeta, Slots } from '../../actions/types';
import withPlayerCards, { PlayerCardProps } from '../withPlayerCards';
import DeckValidation from '../../lib/DeckValidation';
import { FACTION_DARK_GRADIENTS } from '../../constants';
import { parseDeck, ParsedDeck } from '../parseDeck';
import { EditDeckProps } from '../DeckEditView';
import EditDeckDetailsDialog from './EditDeckDetailsDialog';
import DeckViewTab from './DeckViewTab';
import DeckNavFooter from '../DeckNavFooter';
import { NavigationProps } from '../types';
import {
  getDeck,
  getEffectiveDeckId,
  AppState,
} from '../../reducers';
import { m, s, iconSizeScale } from '../../styles/space';
import typography from '../../styles/typography';

export interface DeckDetailProps {
  id: number;
  title?: string;
  isPrivate?: boolean;
  modal?: boolean;
}

interface ReduxProps {
  singleCardView: boolean;
  deck?: Deck;
}

interface ReduxActionProps {
  fetchPrivateDeck: (id: number) => void;
  fetchPublicDeck: (id: number, useDeckEndpoint: boolean) => void;
  removeDeck: (id: number, deleteAllVersions?: boolean) => void;
  uploadLocalDeck: (deck: Deck) => Promise<Deck>;
  saveDeckChanges: (deck: Deck, changes: DeckChanges) => Promise<Deck>;
}

type Props = NavigationProps &
  DeckDetailProps &
  ReduxProps &
  ReduxActionProps &
  PlayerCardProps &
  LoginStateProps &
  InjectedDialogProps;

interface State {
  parsedDeck?: ParsedDeck;
  slots: Slots;
  meta: DeckMeta;
  ignoreDeckLimitSlots: Slots;
  loaded: boolean;
  saving: boolean;
  saveError?: string;
  copying: boolean;
  deleting: boolean;
  nameChange?: string;
  hasPendingEdits: boolean;
  visible: boolean;
  editDetailsVisible: boolean;
}

class DeckDetailView extends React.Component<Props, State> {
  _navEventListener?: EventSubscription;
  _uploadLocalDeck!: (isRetry?: boolean) => void;
  _saveEditsAndDismiss!: (isRetry?: boolean) => void;
  _saveEdits!: (isRetry?: boolean) => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      meta: {},
      slots: {},
      ignoreDeckLimitSlots: {},
      loaded: false,
      saving: false,
      copying: false,
      deleting: false,
      hasPendingEdits: false,
      visible: true,
      editDetailsVisible: false,
    };
    this._uploadLocalDeck = throttle(this.uploadLocalDeck.bind(this), 200);
    this._saveEditsAndDismiss = throttle(this.saveEdits.bind(this, true), 200);
    this._saveEdits = throttle(this.saveEdits.bind(this, false), 200);

    const leftButtons = props.modal ? [
      Platform.OS === 'ios' ? {
        text: t`Done`,
        id: 'back',
        color: 'white',
      } : {
        icon: iconsMap['arrow-left'],
        id: 'androidBack',
        color: 'white',
      },
    ] : [];

    if (props.modal) {
      Navigation.mergeOptions(props.componentId, {
        topBar: {
          title: {
            text: props.title,
            color: '#FFFFFF',
          },
          leftButtons,
          rightButtons: this.getRightButtons(),
        },
      });
    }
    this._navEventListener = Navigation.events().bindComponent(this);
  }

  componentDidAppear() {
    this.setState({
      visible: true,
    });
  }

  componentDidDisappear() {
    this.setState({
      visible: false,
    });
  }

  componentDidMount() {
    const {
      id,
      isPrivate,
      fetchPublicDeck,
      fetchPrivateDeck,
      deck,
      modal,
    } = this.props;
    if (modal) {
      BackHandler.addEventListener('hardwareBackPress', this._handleBackPress);
    }
    if (id >= 0 && (!deck || !deck.local)) {
      if (isPrivate) {
        fetchPrivateDeck(id);
      } else {
        fetchPublicDeck(id, false);
      }
    }
    if (deck && deck.investigator_code) {
      this.loadCards(deck);
    }
  }

  componentWillUnmount() {
    if (this.props.modal) {
      BackHandler.removeEventListener('hardwareBackPress', this._handleBackPress);
    }
    this._navEventListener && this._navEventListener.remove();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      deck,
      id,
    } = this.props;
    if (deck !== prevProps.deck) {
      if (!deck) {
        if (!this.state.deleting && id > 0) {
          Alert.alert(
            t`Deck has been deleted`,
            t`It looks like you deleted this deck from MarvelCDB.`,
            [{
              text: t`OK`,
              onPress: () => {
                Navigation.dismissAllModals();
              },
            }],
          );
        }
      }
    }
    if (deck) {
      if (deck !== prevProps.deck) {
        this.loadCards(deck);
      }
    }
  }

  _deleteDeck = (deleteAllVersions: boolean) => {
    const {
      id,
      removeDeck,
    } = this.props;

    this.setState({
      deleting: true,
    }, () => {
      Navigation.dismissAllModals();
      removeDeck(id, deleteAllVersions);
    });
  };

  _toggleCopyDialog = () => {
    this.setState({
      copying: !this.state.copying,
    });
  };

  getRightButtons() {
    const {
      isPrivate,
      deck,
    } = this.props;
    const {
      hasPendingEdits,
    } = this.state;
    const rightButtons = [];
    const editable = isPrivate && deck && !deck.next_deck;
    if (hasPendingEdits) {
      rightButtons.push({
        text: t`Save`,
        id: 'save',
        color: 'white',
        testID: t`Save`,
      });
    } else {
      rightButtons.push({
        id: 'copy',
        icon: iconsMap['content-copy'],
        color: 'white',
        testID: t`Clone Deck`,
      });
    }
    if (editable) {
      rightButtons.push({
        id: 'edit',
        icon: iconsMap.edit,
        color: 'white',
        testID: t`Edit Deck`,
      });
    }
    return rightButtons;
  }

  _syncNavigationButtons = () => {
    const {
      componentId,
    } = this.props;

    Navigation.mergeOptions(componentId, {
      topBar: {
        rightButtons: this.getRightButtons(),
      },
    });
  };

  _handleBackPress = () => {
    if (!this.state.visible) {
      return false;
    }
    if (this.state.hasPendingEdits) {
      Alert.alert(
        t`Save deck changes?`,
        t`Looks like you have made some changes that have not been saved.`,
        [{
          text: t`Save Changes`,
          onPress: () => {
            this._saveEditsAndDismiss();
          },
        }, {
          text: t`Discard Changes`,
          style: 'destructive',
          onPress: () => {
            Navigation.dismissAllModals();
          },
        }, {
          text: t`Cancel`,
          style: 'cancel',
        }],
      );
    } else {
      Navigation.dismissAllModals();
    }
    return true;
  };

  navigationButtonPressed({ buttonId }: { buttonId: string }) {
    if (buttonId === 'edit') {
      this._onEditPressed();
    } else if (buttonId === 'back' || buttonId === 'androidBack') {
      this._handleBackPress();
    } else if (buttonId === 'save') {
      this._saveEdits();
    } else if (buttonId === 'copy') {
      this._toggleCopyDialog();
    }
  }

  _onEditPressed = () => {
    const {
      componentId,
      deck,
      cards,
    } = this.props;
    if (!deck) {
      return;
    }
    const investigator = cards[deck.investigator_code];
    const {
      slots,
      meta,
      ignoreDeckLimitSlots,
    } = this.state;
    Navigation.push<EditDeckProps>(componentId, {
      component: {
        name: 'Deck.Edit',
        passProps: {
          deck,
          meta,
          slots: slots,
          ignoreDeckLimitSlots: ignoreDeckLimitSlots,
          updateSlots: this._updateSlots,
        },
        options: {
          statusBar: {
            style: 'light',
          },
          topBar: {
            title: {
              text: t`Edit Deck`,
              color: 'white',
            },
            backButton: {
              title: t`Back`,
              color: 'white',
            },
            background: {
              color: FACTION_DARK_GRADIENTS[investigator ? investigator.factionCode() : 'basic'][0],
            },
          },
        },
      },
    });
  };

  uploadLocalDeck(isRetry?: boolean) {
    const {
      deck,
      uploadLocalDeck,
    } = this.props;
    const {
      parsedDeck,
      saving,
    } = this.state;
    if (!parsedDeck || !deck) {
      return;
    }
    if (!saving || isRetry) {
      this.setState({
        saving: true,
      });
      uploadLocalDeck(deck).then(() => {
        this.setState({
          saving: false,
          hasPendingEdits: false,
        }, this._syncNavigationButtons);
      }, () => {
        this.setState({
          saving: false,
        });
      });
    }
  }

  _dismissSaveError = () => {
    this.setState({
      saveError: undefined,
      saving: false,
    });
  };

  _handleSaveError = (err: Error) => {
    this.setState({
      saving: false,
      saveError: err.message || 'Unknown Error',
    });
  };

  saveEdits(dismissAfterSave: boolean, isRetry?: boolean) {
    const {
      deck,
    } = this.props;
    if (!this.state.saving || isRetry) {
      const {
        parsedDeck,
        nameChange,
        meta,
      } = this.state;
      if (!deck || !parsedDeck) {
        return;
      }
      const {
        slots,
        ignoreDeckLimitSlots,
      } = parsedDeck;

      const problemObj = this.getProblem();
      const problem = problemObj ? problemObj.reason : '';

      this.setState({
        saving: true,
      });
      this.props.saveDeckChanges(
        deck,
        {
          name: nameChange,
          slots,
          ignoreDeckLimitSlots,
          problem,
          meta,
        }
      ).then(() => {
        if (dismissAfterSave) {
          Navigation.dismissAllModals();
        } else {
          this.setState({
            saving: false,
            nameChange: undefined,
            hasPendingEdits: false,
          }, this._syncNavigationButtons);
        }
      }, this._handleSaveError);
    }
  }

  _clearEdits = () => {
    const {
      deck,
    } = this.props;
    if (!deck) {
      return;
    }
    this.setState({
      meta: deck.meta || {},
      nameChange: undefined,
    }, () => {
      this._updateSlots(deck.slots, true);
    });
  };

  slotDeltas(
    deck: Deck,
    slots: Slots,
    ignoreDeckLimitSlots: Slots
  ) {
    const result: {
      removals: Slots;
      additions: Slots;
      ignoreDeckLimitChanged: boolean;
    } = {
      removals: {},
      additions: {},
      ignoreDeckLimitChanged: false,
    };
    forEach(deck.slots, (deckCount, code) => {
      const currentDeckCount = slots[code] || 0;
      if (deckCount > currentDeckCount) {
        result.removals[code] = deckCount - currentDeckCount;
      }
    });
    forEach(slots, (currentCount, code) => {
      const ogDeckCount = deck.slots[code] || 0;
      if (ogDeckCount < currentCount) {
        result.additions[code] = currentCount - ogDeckCount;
      }
      const ogIgnoreCount = ((deck.ignoreDeckLimitSlots || {})[code] || 0);
      if (ogIgnoreCount !== (ignoreDeckLimitSlots[code] || 0)) {
        result.ignoreDeckLimitChanged = true;
      }
    });
    return result;
  }

  addedBasicWeaknesses(
    deck: Deck,
    slots: Slots,
    ignoreDeckLimitSlots: Slots
  ): string[] {
    const {
      cards,
    } = this.props;
    const deltas = this.slotDeltas(deck, slots, ignoreDeckLimitSlots);
    const addedWeaknesses: string[] = [];
    forEach(deltas.additions, (addition, code) => {
      if (cards[code] && cards[code].subtype_code === 'basicweakness') {
        forEach(range(0, addition), () => addedWeaknesses.push(code));
      }
    });
    return addedWeaknesses;
  }

  hasPendingEdits(
    slots: Slots,
    ignoreDeckLimitSlots: Slots,
    meta: DeckMeta,
    nameChange?: string,
  ): boolean {
    const {
      deck,
    } = this.props;
    if (!deck) {
      return false;
    }
    const metaChanges = deepDiff(meta, deck.meta || {});
    const deltas = this.slotDeltas(deck, slots, ignoreDeckLimitSlots);
    return (nameChange && deck.name !== nameChange) ||
      keys(deltas.removals).length > 0 ||
      keys(deltas.additions).length > 0 ||
      deltas.ignoreDeckLimitChanged ||
      (!!metaChanges && metaChanges.length > 0);
  }

  _setMeta = (key: string, value: string) => {
    const {
      meta,
    } = this.state;
    const updatedMeta = {
      ...meta,
      [key]: value,
    };
    this.setState({
      meta: updatedMeta,
      hasPendingEdits: this.hasPendingEdits(
        this.state.slots,
        this.state.ignoreDeckLimitSlots,
        updatedMeta,
        this.state.nameChange),
    }, this._syncNavigationButtons);
  };

  _updateIgnoreDeckLimitSlots = (newIgnoreDeckLimitSlots: Slots) => {
    const {
      deck,
      cards,
    } = this.props;
    const {
      slots,
    } = this.state;
    if (!deck) {
      return;
    }
    const parsedDeck = parseDeck(deck, slots, newIgnoreDeckLimitSlots, cards);
    this.setState({
      ignoreDeckLimitSlots: newIgnoreDeckLimitSlots,
      parsedDeck,
      hasPendingEdits: this.hasPendingEdits(
        slots,
        newIgnoreDeckLimitSlots,
        this.state.meta,
        this.state.nameChange),
    }, this._syncNavigationButtons);
  };

  _onDeckCountChange = (code: string, count: number) => {
    const {
      slots,
    } = this.state;
    const newSlots = {
      ...slots,
      [code]: count,
    };
    if (count === 0) {
      delete newSlots[code];
    }
    this._updateSlots(newSlots);
  };

  _updateSlots = (newSlots: Slots, resetIgnoreDeckLimitSlots?: boolean) => {
    const {
      deck,
      cards,
    } = this.props;
    if (!deck) {
      return;
    }
    const ignoreDeckLimitSlots = resetIgnoreDeckLimitSlots ?
      (deck.ignoreDeckLimitSlots || {}) :
      this.state.ignoreDeckLimitSlots;
    const parsedDeck = parseDeck(deck, newSlots, ignoreDeckLimitSlots, cards);
    this.setState({
      slots: newSlots,
      ignoreDeckLimitSlots: ignoreDeckLimitSlots,
      parsedDeck,
      hasPendingEdits: this.hasPendingEdits(
        newSlots,
        ignoreDeckLimitSlots,
        this.state.meta,
        this.state.nameChange),
    }, this._syncNavigationButtons);
  };

  loadCards(deck: Deck) {
    const {
      cards,
    } = this.props;
    const {
      slots,
    } = this.state;
    if (findIndex(keys(slots), code => deck.slots[code] !== slots[code]) !== -1 ||
      findIndex(keys(deck.slots), code => deck.slots[code] !== slots[code]) !== -1) {
      const parsedDeck = parseDeck(deck, deck.slots, deck.ignoreDeckLimitSlots || {}, cards);
      this.setState({
        slots: deck.slots,
        meta: deck.meta || {},
        ignoreDeckLimitSlots: deck.ignoreDeckLimitSlots || {},
        parsedDeck,
        hasPendingEdits: false,
        loaded: true,
      }, this._syncNavigationButtons);
    }
  }

  renderCopyDialog() {
    const {
      componentId,
      viewRef,
      id,
      signedIn,
    } = this.props;
    const {
      copying,
    } = this.state;
    return (
      <CopyDeckDialog
        componentId={componentId}
        deckId={copying ? id : undefined}
        toggleVisible={this._toggleCopyDialog}
        viewRef={viewRef}
        signedIn={signedIn}
      />
    );
  }
  _showEditDetailsVisible = () => {
    this.setState({
      editDetailsVisible: true,
    });
  };
  _toggleEditDetailsVisible = () => {
    this.setState({
      editDetailsVisible: !this.state.editDetailsVisible,
    });
  };

  _updateDeckDetails = (name: string) => {
    const {
      slots,
      ignoreDeckLimitSlots,
      meta,
    } = this.state;
    const pendingEdits = this.hasPendingEdits(
      slots,
      ignoreDeckLimitSlots,
      meta,
      name,
    );
    this.setState({
      nameChange: name,
      hasPendingEdits: pendingEdits,
      editDetailsVisible: false,
    }, this._syncNavigationButtons);
  };

  renderEditDetailsDialog(deck: Deck) {
    const {
      viewRef,
    } = this.props;
    const {
      editDetailsVisible,
      nameChange,
    } = this.state;
    return (
      <EditDeckDetailsDialog
        viewRef={viewRef}
        visible={editDetailsVisible}
        toggleVisible={this._toggleEditDetailsVisible}
        name={nameChange || deck.name}
        updateDetails={this._updateDeckDetails}
      />
    );
  }

  renderSavingDialog() {
    const {
      viewRef,
    } = this.props;
    const {
      saving,
      saveError,
    } = this.state;
    if (saveError) {
      return (
        <Dialog title={t`Error`} visible={saving} viewRef={viewRef}>
          <Text style={[styles.errorMargin, typography.small]}>
            { saveError }
          </Text>
          <DialogComponent.Button
            label={t`Okay`}
            onPress={this._dismissSaveError}
          />
        </Dialog>
      );

    }
    return (
      <Dialog title={t`Saving`} visible={saving} viewRef={viewRef}>
        <ActivityIndicator
          style={styles.spinner}
          size="large"
          animating
        />
      </Dialog>
    );
  }

  renderButtons() {
    const {
      deck,
    } = this.props;
    const {
      hasPendingEdits,
    } = this.state;
    if (!deck || deck.next_deck) {
      return null;
    }
    return (
      <React.Fragment>
        <View style={styles.twoColumn}>
          <View style={styles.halfColumn}>
            <Button
              style={styles.button}
              grow
              text={t`Edit`}
              color="purple"
              size="small"
              icon={<MaterialIcons size={20 * iconSizeScale * DeviceInfo.getFontScale()} color="#FFFFFF" name="edit" />}
              onPress={this._onEditPressed}
            />
          </View>

        </View>
        { hasPendingEdits && (
          <View style={[styles.twoColumn, styles.topSpace]}>
            <View style={styles.halfColumn}>
              <Button
                style={styles.button}
                text={t`Save`}
                color="green"
                size="small"
                grow
                onPress={this._saveEdits}
              />
            </View>
            <View style={styles.halfColumn}>
              <Button
                text={t`Discard Edits`}
                color="red"
                grow
                size="small"
                onPress={this._clearEdits}
              />
            </View>
          </View>
        ) }
      </React.Fragment>
    );
  }

  getProblem() {
    const {
      cards,
      deck,
    } = this.props;
    const {
      parsedDeck,
      loaded,
      meta,
    } = this.state;
    if (!deck || !loaded || !parsedDeck) {
      return null;
    }

    const {
      slots,
      ignoreDeckLimitSlots,
      investigator,
    } = parsedDeck;

    const validator = new DeckValidation(investigator, meta);
    return validator.getProblem(flatMap(keys(slots), code => {
      const card = cards[code];
      return map(
        range(0, Math.max(0, slots[code] - (ignoreDeckLimitSlots[code] || 0))),
        () => card
      );
    }));
  }

  _renderFooter = (slots?: Slots, controls?: React.ReactNode) => {
    const {
      componentId,
      cards,
    } = this.props;
    const {
      parsedDeck,
      meta,
    } = this.state;
    if (!parsedDeck) {
      return null;
    }
    return (
      <DeckNavFooter
        componentId={componentId}
        parsedDeck={parsedDeck}
        meta={meta}
        cards={cards}
        controls={controls}
      />
    );
  };

  render() {
    const {
      deck,
      componentId,
      isPrivate,
      captureViewRef,
      cards,
      signedIn,
      login,
      singleCardView,
    } = this.props;
    const {
      loaded,
      parsedDeck,
      nameChange,
      hasPendingEdits,
      meta,
    } = this.state;

    if (!deck || !loaded || !parsedDeck) {
      return (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator
            style={styles.spinner}
            size="small"
            animating
          />
        </View>
      );
    }
    return (
      <View>
        <View style={styles.container} ref={captureViewRef}>
          <DeckViewTab
            componentId={componentId}
            deck={deck}
            meta={meta}
            setMeta={this._setMeta}
            deckName={nameChange || deck.name}
            singleCardView={singleCardView}
            parsedDeck={parsedDeck}
            problem={this.getProblem() || undefined}
            hasPendingEdits={hasPendingEdits}
            cards={cards}
            isPrivate={!!isPrivate}
            buttons={this.renderButtons()}
            showEditNameDialog={this._showEditDetailsVisible}
            signedIn={signedIn}
            login={login}
            deleteDeck={this._deleteDeck}
            uploadLocalDeck={this._uploadLocalDeck}
            renderFooter={this._renderFooter}
            onDeckCountChange={this._onDeckCountChange}
          />
          { this._renderFooter() }
        </View>
        { this.renderEditDetailsDialog(deck) }
        { this.renderSavingDialog() }
        { this.renderCopyDialog() }
      </View>
    );
  }
}

function mapStateToProps(
  state: AppState,
  props: NavigationProps & DeckDetailProps
): ReduxProps {
  const id = getEffectiveDeckId(state, props.id);
  const deck = getDeck(state, id) || undefined;
  return {
    singleCardView: state.settings.singleCardView || false,
    deck,
  };
}

function mapDispatchToProps(dispatch: Dispatch): ReduxActionProps {
  return bindActionCreators({
    fetchPrivateDeck,
    fetchPublicDeck,
    removeDeck,
    uploadLocalDeck,
    saveDeckChanges,
  } as any, dispatch) as ReduxActionProps;
}

export default connect<ReduxProps, ReduxActionProps, NavigationProps & DeckDetailProps, AppState>(
  mapStateToProps,
  mapDispatchToProps
)(
  withPlayerCards<ReduxProps & ReduxActionProps & NavigationProps & DeckDetailProps>(
    withDialogs(
      withLoginState(
        DeckDetailView
      )
    )
  )
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: '100%',
    width: '100%',
    backgroundColor: 'white',
  },
  spinner: {
    height: 80,
  },
  activityIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'white',
  },
  button: {
    marginRight: s,
  },
  errorMargin: {
    padding: m,
  },
  topSpace: {
    marginTop: s,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  halfColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
