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
  AlertButton,
  ActivityIndicator,
  BackHandler,
  Button,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Results } from 'realm';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Navigation, EventSubscription, OptionsTopBarButton } from 'react-native-navigation';
import DialogComponent from 'react-native-dialog';
import deepDiff from 'deep-diff';
import { ngettext, msgid, t } from 'ttag';
import SideMenu from 'react-native-side-menu';
import {
  SettingsButton,
  SettingsCategoryHeader,
} from 'react-native-settings-components';

import withLoginState, { LoginStateProps } from '../withLoginState';
import CopyDeckDialog from '../CopyDeckDialog';
import Dialog from '../core/Dialog';
import withDialogs, { InjectedDialogProps } from '../core/withDialogs';
import withDimensions, { DimensionsProps } from '../core/withDimensions';
import { iconsMap } from '../../app/NavIcons';
import {
  fetchPrivateDeck,
  fetchPublicDeck,
  removeDeck,
  uploadLocalDeck,
  saveDeckChanges,
  DeckChanges,
} from '../decks/actions';
import { Deck, DeckMeta, ParsedDeck, Slots } from '../../actions/types';
import withPlayerCards, { PlayerCardProps } from '../withPlayerCards';
import DeckValidation from '../../lib/DeckValidation';
import { FACTION_DARK_GRADIENTS } from '../../constants';
import Card from '../../data/Card';
import { parseDeck } from '../../lib/parseDeck';
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
import { m } from '../../styles/space';
import typography from '../../styles/typography';
import { COLORS } from '../../styles/colors';
import { getDeckOptions, showCardCharts, showDrawSimulator } from '../navHelper';

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
  removeDeck: (id: number) => void;
  uploadLocalDeck: (deck: Deck) => Promise<Deck>;
  saveDeckChanges: (deck: Deck, changes: DeckChanges) => Promise<Deck>;
}

type Props = NavigationProps &
  DeckDetailProps &
  ReduxProps &
  ReduxActionProps &
  PlayerCardProps &
  LoginStateProps &
  InjectedDialogProps &
  DimensionsProps;

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
  upgradeCard?: Card;
  menuOpen: boolean;
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
      menuOpen: false,
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
      isPrivate,
      fetchPrivateDeck,
      fetchPublicDeck,
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
  }

  _deleteDeck = () => {
    const {
      id,
      removeDeck,
    } = this.props;

    this.setState({
      deleting: true,
    }, () => {
      Navigation.dismissAllModals();
      removeDeck(id);
    });
  };

  _toggleCopyDialog = () => {
    this.setState({
      menuOpen: false,
      copying: !this.state.copying,
    });
  };

  _savePressed = () => {
    this._saveEdits();
  };

  getRightButtons() {
    const {
      hasPendingEdits,
    } = this.state;
    const rightButtons: OptionsTopBarButton[] = [{
      id: 'menu',
      icon: iconsMap.menu,
      color: 'white',
    }];
    if (hasPendingEdits) {
      rightButtons.push({
        text: t`Save`,
        id: 'save',
        color: 'white',
        testID: t`Save`,
      });
    }
    return rightButtons;
  }

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
    if (buttonId === 'back' || buttonId === 'androidBack') {
      this._handleBackPress();
    } else if (buttonId === 'save') {
      this._saveEdits();
    } else if (buttonId === 'menu') {
      this.setState({
        menuOpen: !this.state.menuOpen,
      });
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
    this.setState({
      menuOpen: false,
    });
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
              color: FACTION_DARK_GRADIENTS[investigator ? investigator.factionCode() : 'neutral'][0],
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
      uploadLocalDeck(deck).then(newDeck => {
        this.setState({
          saving: false,
          hasPendingEdits: false,
        });
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

      const addedBasicWeaknesses = this.addedBasicWeaknesses(
        deck,
        slots,
        ignoreDeckLimitSlots
      );

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
          });
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
    });
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
    });
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
    });
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
      });
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
      menuOpen: false,
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
    });
  };

  renderEditDetailsDialog(deck: Deck, parsedDeck: ParsedDeck) {
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
    if (!deck || !hasPendingEdits) {
      return null;
    }
    return (
      <>
        <View style={styles.button}>
          <Button
            title={t`Save Changes`}
            onPress={this._savePressed}
          />
        </View>
        <View style={styles.button}>
          <Button
            title={t`Discard Changes`}
            color={COLORS.red}
            onPress={this._clearEdits}
          />
        </View>
      </>
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
      if (!card) {
        return [];
      }
      return map(
        range(0, Math.max(0, slots[code] - (ignoreDeckLimitSlots[code] || 0))),
        () => card
      );
    }));
  }

  _renderFooter = (
    slots?: Slots,
    controls?: React.ReactNode
  ) => {
    const {
      componentId,
      cards,
      fontScale,
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
        fontScale={fontScale}
        parsedDeck={parsedDeck}
        meta={meta}
        cards={cards}
        controls={controls}
      />
    );
  };

  _menuOpenChange = (menuOpen: boolean) => {
    this.setState({
      menuOpen,
    });
  };

  _doLocalDeckUpload = () => {
    this._uploadLocalDeck();
  };

  _uploadToMarvelCB = () => {
    const {
      signedIn,
      login,
      deck,
    } = this.props;
    const { hasPendingEdits } = this.state;
    if (!deck) {
      return;
    }
    this.setState({
      menuOpen: false,
    });
    if (hasPendingEdits) {
      Alert.alert(
        t`Save Local Changes`,
        t`Please save any local edits to this deck before sharing to MarvelCDB`
      );
    } else if (!signedIn) {
      Alert.alert(
        t`Sign in to MarvelCDB`,
        t`MarvelCDB is a popular deck building site where you can manage and share decks with others.\n\nSign in to access your decks or share decks you have created with others.`,
        [
          { text: 'Sign In', onPress: login },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      Alert.alert(
        t`Upload to MarvelCDB`,
        t`You can upload your deck to MarvelCDB to share with others.\n\nAfter doing this you will need network access to make changes to the deck.`,
        [
          { text: 'Upload', onPress: this._doLocalDeckUpload },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  _viewDeck = () => {
    const { deck } = this.props;
    if (deck) {
      Linking.openURL(`https://marvelcdb.com/deck/view/${deck.id}`);
    }
  };

  _deleteDeckPrompt = () => {
    const {
      deck,
    } = this.props;
    if (!deck) {
      return;
    }
    this.setState({
      menuOpen: false,
    });
    if (deck.local) {
      const options: AlertButton[] = [];
      options.push({
        text: t`Delete`,
        onPress: this._deleteDeck,
        style: 'destructive',
      });
      options.push({
        text: t`Cancel`,
        style: 'cancel',
      });

      Alert.alert(
        t`Delete deck`,
        t`Are you sure you want to delete this deck?`,
        options,
      );
    } else {
      Alert.alert(
        t`Visit MarvelCDB to delete?`,
        t`Unfortunately to delete decks you have to visit MarvelCDB at this time.`,
        [
          {
            text: t`Visit MarvelCDB`,
            onPress: () => {
              Linking.openURL(`https://marvelcdb.com/deck/view/${deck.id}`);
            },
          },
          {
            text: t`Cancel`,
            style: 'cancel',
          },
        ],
      );
    }
  };

  _showCardCharts = () => {
    const { componentId } = this.props;
    const { parsedDeck } = this.state;
    this.setState({
      menuOpen: false,
    });
    if (parsedDeck) {
      showCardCharts(componentId, parsedDeck);
    }
  };

  _showDrawSimulator = () => {
    const { componentId } = this.props;
    const { parsedDeck } = this.state;
    this.setState({
      menuOpen: false,
    });
    if (parsedDeck) {
      showDrawSimulator(componentId, parsedDeck);
    }
  };

  renderSideMenu(
    deck: Deck,
    parsedDeck: ParsedDeck
  ) {
    const {
      isPrivate,
    } = this.props;
    const {
      nameChange,
    } = this.state;
    const {
      normalCardCount,
      totalCardCount,
    } = parsedDeck;

    const editable = isPrivate && deck;
    return (
      <ScrollView style={styles.menu}>
        <SettingsCategoryHeader title={t`Deck`} />
        { editable && (
          <>
            <SettingsButton
              onPress={this._showEditDetailsVisible}
              title={t`Name`}
              description={nameChange || deck.name}
            />
          </>
        ) }
        <SettingsCategoryHeader title={t`Cards`} />
        <SettingsButton
          onPress={this._onEditPressed}
          title={t`Edit Cards`}
          description={ngettext(
            msgid`${normalCardCount} Card (${totalCardCount} Total)`,
            `${normalCardCount} Cards (${totalCardCount} Total)`,
            normalCardCount
          )}
        />
        <SettingsButton
          onPress={this._showCardCharts}
          title={t`Charts`}
        />
        <SettingsButton
          onPress={this._showDrawSimulator}
          title={t`Draw Simulator`}
        />
        <SettingsCategoryHeader title={t`Options`} />
        <SettingsButton
          onPress={this._toggleCopyDialog}
          title={t`Clone`}
        />
        { deck.local ? (
          <SettingsButton
            onPress={this._uploadToMarvelCB}
            title={t`Upload to MarvelCDB`}
          />
        ) : (
          <SettingsButton
            title={t`View on MarvelCDB`}
            onPress={this._viewDeck}
          />
        ) }
        { !!isPrivate && (
          <SettingsButton
            title={t`Delete`}
            titleStyle={styles.destructive}
            onPress={this._deleteDeckPrompt}
          />
        ) }
      </ScrollView>
    );
  }

  renderDeck(
    deck: Deck,
    parsedDeck: ParsedDeck
  ) {
    const {
      componentId,
      fontScale,
      isPrivate,
      captureViewRef,
      cards,
      signedIn,
      login,
      singleCardView,
      width,
    } = this.props;
    const {
      nameChange,
      hasPendingEdits,
      meta,
    } = this.state;

    const editable = !!isPrivate && !!deck;
    return (
      <View>
        <View style={styles.container} ref={captureViewRef}>
          <DeckViewTab
            componentId={componentId}
            fontScale={fontScale}
            deck={deck}
            editable={editable}
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
            showEditCards={this._onEditPressed}
            showEditNameDialog={this._showEditDetailsVisible}
            signedIn={signedIn}
            login={login}
            renderFooter={this._renderFooter}
            onDeckCountChange={this._onDeckCountChange}
            width={width}
          />
          { this._renderFooter() }
        </View>
        { this.renderEditDetailsDialog(deck, parsedDeck) }
      </View>
    );
  }

  render() {
    const {
      width,
      captureViewRef,
      deck,
    } = this.props;
    const {
      loaded,
      parsedDeck,
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
    const menuWidth = Math.min(width * 0.60, 240);
    return (
      <View style={styles.flex} ref={captureViewRef}>
        <SideMenu
          isOpen={this.state.menuOpen}
          onChange={this._menuOpenChange}
          menu={this.renderSideMenu(deck, parsedDeck)}
          openMenuOffset={menuWidth}
          autoClosing
          menuPosition="right"
        >
          { this.renderDeck(deck, parsedDeck) }
        </SideMenu>
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
        withDimensions(DeckDetailView)
      )
    )
  )
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
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
  errorMargin: {
    padding: m,
  },
  button: {
    margin: 8,
  },
  menu: {
    borderLeftWidth: 2,
    borderColor: COLORS.darkGray,
    backgroundColor: COLORS.white,
  },
  destructive: {
    color: COLORS.red,
  },
});
