import React, { ReactNode } from 'react';
import { head, find, forEach, keys, map, sum, sumBy } from 'lodash';
import {
  Alert,
  AlertButton,
  Button,
  Linking,
  StyleSheet,
  SectionList,
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  SectionListData,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/dist/MaterialIcons';
import DeviceInfo from 'react-native-device-info';
import { msgid, ngettext, t } from 'ttag';

import AppIcon from '../../assets/AppIcon';
import { Deck, DeckMeta, DeckProblem, Slots } from '../../actions/types';
import { CardId, ParsedDeck, SplitCards } from '../parseDeck';
import { showCard, showCardSwipe } from '../navHelper';
import InvestigatorImage from '../core/InvestigatorImage';
import InvestigatorOptionsModule from './InvestigatorOptionsModule';
import CardSectionHeader, { CardSectionHeaderData } from './CardSectionHeader';
import CardSearchResult from '../CardSearchResult';
import DeckValidation from '../../lib/DeckValidation';
import Card, { CardsMap } from '../../data/Card';
import typography from '../../styles/typography';
import { COLORS } from '../../styles/colors';
import { s, sizeScale } from '../../styles/space';

const SMALL_EDIT_ICON_SIZE = 18 * sizeScale * DeviceInfo.getFontScale();

interface SectionCardId extends CardId {
  special: boolean;
}

interface CardSection extends CardSectionHeaderData {
  id: string;
  data: SectionCardId[];
}

function deckToSections(
  halfDeck: SplitCards,
  special: boolean
): CardSection[] {
  const result: CardSection[] = [];
  forEach({
    [t`Ally`]: halfDeck.Ally,
    [t`Event`]: halfDeck.Event,
    [t`Resource`]: halfDeck.Resource,
    [t`Support`]: halfDeck.Support,
    [t`Upgrade`]: halfDeck.Upgrade,
  }, (cardSplitGroup, localizedName) => {
    if (cardSplitGroup) {
      const count = sumBy(cardSplitGroup, c => c.quantity);
      result.push({
        id: `${localizedName}-${special ? '-special' : ''}`,
        title: `${localizedName} (${count})`,
        data: map(cardSplitGroup, c => {
          return {
            ...c,
            special,
          };
        }),
      });
    }
  });
  return result;
}

const DECK_PROBLEM_MESSAGES = {
  too_few_cards: t`Not enough cards.`,
  too_many_cards: t`Too many cards.`,
  too_many_copies: t`Too many copies of a card with the same name.`,
  invalid_cards: t`Contains forbidden cards (cards not permitted by Faction)`,
  deck_options_limit: t`Contains too many limited cards.`,
  investigator: t`Doesn't comply with the Investigator requirements.`,
};

interface Props {
  componentId: string;
  deck: Deck;
  parsedDeck: ParsedDeck;
  meta: DeckMeta;
  hasPendingEdits?: boolean;
  cards: CardsMap;
  isPrivate: boolean;
  buttons?: ReactNode;
  showEditNameDialog: () => void;
  deckName: string;
  singleCardView: boolean;
  signedIn: boolean;
  login: () => void;
  deleteDeck: (allVersions: boolean) => void;
  uploadLocalDeck: () => void;
  problem?: DeckProblem;
  renderFooter: (slots?: Slots) => React.ReactNode;
  onDeckCountChange: (code: string, count: number) => void;
  setMeta: (key: string, value: string) => void;
}

export default class DeckViewTab extends React.Component<Props> {
  _keyForCard = (item: SectionCardId) => {
    return item.id;
  };

  _deleteDeckPrompt = () => {
    const {
      deck,
      deleteDeck,
    } = this.props;
    if (deck.local) {
      const options: AlertButton[] = [];
      const isLatestUpgrade = deck.previous_deck && !deck.next_deck;
      if (isLatestUpgrade) {
        options.push({
          text: t`Delete this upgrade (${deck.version})`,
          onPress: () => {
            deleteDeck(false);
          },
          style: 'destructive',
        });
        options.push({
          text: t`Delete all versions`,
          onPress: () => {
            deleteDeck(true);
          },
          style: 'destructive',
        });
      } else {
        const isUpgraded = !!deck.next_deck;
        options.push({
          text: isUpgraded ? t`Delete all versions` : t`Delete`,
          onPress: () => {
            deleteDeck(true);
          },
          style: 'destructive',
        });
      }
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

  _uploadToMarvelCDB = () => {
    const {
      signedIn,
      login,
      deck,
      hasPendingEdits,
      uploadLocalDeck,
    } = this.props;
    if (hasPendingEdits) {
      Alert.alert(
        t`Save Local Changes`,
        t`Please save any local edits to this deck before sharing to MarvelCDB`
      );
    } else if (deck.next_deck || deck.previous_deck) {
      Alert.alert(
        t`Unsupported Operation`,
        t`This deck contains next/previous versions with upgrades, so we cannot upload it to MarvelCDB at this time. If you would like to upload it, you can use Copy to upload a clone of the current deck.`
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
          { text: 'Upload', onPress: uploadLocalDeck },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  _viewDeck = () => {
    Linking.openURL(`https://marvelcdb.com/deck/view/${this.props.deck.id}`);
  };

  _showHero = () => {
    const {
      parsedDeck: {
        investigator,
      },
      componentId,
    } = this.props;
    showCard(
      componentId,
      investigator.code,
      investigator,
      false,
    );
  };

  _showSwipeCard = (id: string, card: Card) => {
    const {
      componentId,
      parsedDeck: {
        investigator,
        slots,
      },
      renderFooter,
      onDeckCountChange,
      singleCardView,
    } = this.props;
    if (singleCardView) {
      showCard(
        componentId,
        card.code,
        card,
        true
      );
      return;
    }
    const [sectionId, cardIndex] = id.split('.');
    let index = 0;
    const cards: Card[] = [];
    forEach(this.data(), section => {
      if (sectionId === section.id) {
        index = cards.length + parseInt(cardIndex, 10);
      }
      forEach(section.data, item => {
        const card = this.props.cards[item.id];
        cards.push(card);
      });
    });
    showCardSwipe(
      componentId,
      cards,
      index,
      false,
      slots,
      onDeckCountChange,
      investigator,
      renderFooter,
    );
  };

  _renderSectionHeader = ({ section }: {
    section: SectionListData<CardSection>;
  }) => {
    const {
      parsedDeck: {
        investigator,
      },
    } = this.props;
    return (
      <CardSectionHeader
        key={section.id}
        section={section as CardSectionHeaderData}
        investigator={investigator}
      />
    );
  }

  _renderCard = ({ item, index, section }: {
    item: SectionCardId;
    index: number;
    section: SectionListData<CardSection>;
  }) => {
    const {
      parsedDeck: {
        ignoreDeckLimitSlots,
      },
    } = this.props;
    const card = this.props.cards[item.id];
    if (!card) {
      return null;
    }
    const count = (item.special && ignoreDeckLimitSlots[item.id] > 0) ?
      ignoreDeckLimitSlots[item.id] :
      (item.quantity - (ignoreDeckLimitSlots[item.id] || 0));
    const id = `${section.id}.${index}`;
    return (
      <CardSearchResult
        key={id}
        card={card}
        id={id}
        onPressId={this._showSwipeCard}
        count={count}
      />
    );
  };

  renderProblem() {
    const {
      parsedDeck: {
        investigator,
      },
      problem,
    } = this.props;

    if (!problem) {
      return null;
    }
    return (
      <View style={[styles.problemBox,
        { backgroundColor: COLORS.red },
      ]}>
        <View style={styles.problemRow}>
          <View style={styles.warningIcon}>
            <AppIcon name="warning" size={14 * DeviceInfo.getFontScale()} color={COLORS.white} />
          </View>
          <Text
            numberOfLines={2}
            style={[styles.problemText, { color: COLORS.white }]}
          >
            { head(problem.problems) || DECK_PROBLEM_MESSAGES[problem.reason] }
          </Text>
        </View>
      </View>
    );
  }

  data(): CardSection[] {
    const {
      parsedDeck: {
        normalCards,
        specialCards,
        investigator,
        slots,
      },
      meta,
      cards,
    } = this.props;

    const validation = new DeckValidation(investigator, meta);

    return [
      ...deckToSections(normalCards, false),
      {
        id: 'special',
        superTitle: t`Special Cards`,
        data: [],
      },
      ...deckToSections(specialCards, true),
    ];
  }

  renderMetadata() {
    const {
      parsedDeck: {
        normalCardCount,
        totalCardCount,
      },
    } = this.props;
    return (
      <View style={styles.metadata}>
        <Text style={typography.small}>
          { ngettext(
            msgid`${normalCardCount} card (${totalCardCount} total)`,
            `${normalCardCount} cards (${totalCardCount} total)`,
            normalCardCount
          ) }
        </Text>
      </View>
    );
  }

  renderInvestigatorOptions() {
    const {
      parsedDeck: {
        investigator,
      },
      meta,
      setMeta,
    } = this.props;
    return (
      <InvestigatorOptionsModule
        investigator={investigator}
        meta={meta}
        setMeta={setMeta}
      />
    );
  }

  render() {
    const {
      componentId,
      deck,
      deckName,
      cards,
      parsedDeck: {
        investigator,
      },
      isPrivate,
      buttons,
      showEditNameDialog,
    } = this.props;

    const sections = this.data();
    const detailsEditable = (isPrivate && !deck.next_deck);
    return (
      <ScrollView>
        <View>
          { this.renderProblem() }
          <View style={styles.container}>
            { detailsEditable ? (
              <TouchableOpacity onPress={showEditNameDialog}>
                <View style={styles.nameRow}>
                  <View style={styles.investigatorWrapper}>
                    <Text
                      style={[typography.text, typography.bold]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      { deckName }
                    </Text>
                  </View>
                  <View style={styles.editIcon}>
                    <MaterialIcons name="edit" color="#222222" size={SMALL_EDIT_ICON_SIZE} />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={[typography.text, typography.bold]}>
                { `${deckName}  ` }
              </Text>
            ) }
            <View style={styles.header}>
              <TouchableOpacity onPress={this._showHero}>
                <View style={styles.image}>
                  <InvestigatorImage card={investigator} componentId={componentId} />
                </View>
              </TouchableOpacity>
              <View style={styles.metadata}>
                { detailsEditable ? (
                  <TouchableOpacity onPress={showEditNameDialog}>
                    { this.renderMetadata() }
                  </TouchableOpacity>
                ) : (
                  this.renderMetadata()
                ) }
              </View>
            </View>
          </View>
          { this.renderInvestigatorOptions() }
          <View style={styles.container}>
            { buttons }
          </View>
          <View style={styles.cards}>
            <SectionList
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              initialNumToRender={25}
              renderItem={this._renderCard}
              keyExtractor={this._keyForCard}
              renderSectionHeader={this._renderSectionHeader}
              sections={sections}
            />
          </View>
          { deck.local ? (
            <View style={styles.button}>
              <Button
                title={t`Upload to MarvelCDB`}
                onPress={this._uploadToMarvelCDB}
              />
            </View>
          ) : (
            <View style={styles.button}>
              <Button
                title={t`View on MarvelCDB`}
                onPress={this._viewDeck}
              />
            </View>
          ) }
          { isPrivate && (
            <View style={styles.button}>
              <Button
                title={t`Delete Deck`}
                color={COLORS.red}
                onPress={this._deleteDeckPrompt}
              />
            </View>
          ) }
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    marginTop: s,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  button: {
    margin: s,
  },
  metadata: {
    flexDirection: 'column',
    flex: 1,
  },
  image: {
    marginRight: s,
  },
  investigatorWrapper: {
    flex: 1,
  },
  container: {
    marginLeft: s,
    marginRight: s,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  problemBox: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: s,
    paddingLeft: s,
  },
  problemText: {
    color: COLORS.white,
    fontSize: 14,
    flex: 1,
  },
  warningIcon: {
    marginRight: 4,
  },
  cards: {
    marginTop: s,
    borderTopWidth: 1,
    borderColor: '#bdbdbd',
  },
  nameRow: {
    marginTop: s,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editIcon: {
    width: SMALL_EDIT_ICON_SIZE,
    height: SMALL_EDIT_ICON_SIZE,
  },
});
