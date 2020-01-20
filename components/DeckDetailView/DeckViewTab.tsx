import React, { ReactNode } from 'react';
import { filter, forEach, map, sumBy } from 'lodash';
import {
  StyleSheet,
  SectionList,
  View,
  TouchableOpacity,
  Text,
  SectionListData,
} from 'react-native';
import { SettingsSwitch } from 'react-native-settings-components';
import { t } from 'ttag';

import { CardId, Deck, DeckMeta, DeckProblem, ParsedDeck, SplitCards, Slots } from '../../actions/types';
import { showCard, showCardSwipe } from '../navHelper';
import HeroImage from '../core/HeroImage';
import InvestigatorOptionsModule from './InvestigatorOptionsModule';
import CardSectionHeader, { CardSectionHeaderData } from './CardSectionHeader';
import CardSearchResult from '../CardSearchResult';
import DeckValidation from '../../lib/DeckValidation';
import Card, { CardsMap } from '../../data/Card';
import typography from '../../styles/typography';
import { COLORS } from '../../styles/colors';
import { isBig, s } from '../../styles/space';
import DeckProblemRow from '../DeckProblemRow';

interface SectionCardId extends CardId {
  special: boolean;
}

interface CardSection extends CardSectionHeaderData {
  id: string;
  data: SectionCardId[];
}

function deckToSections(
  halfDeck: SplitCards,
  cards: CardsMap,
  validation: DeckValidation,
  showHeroCards: boolean,
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
      const filteredCards = filter(cardSplitGroup, c => {
        const card = cards[c.id];
        return showHeroCards || (card && card.faction_code !== 'hero');
      });
      const count = sumBy(filteredCards, c => c.quantity);
      if (count > 0) {
        result.push({
          id: `${localizedName}-${special ? '-special' : ''}`,
          title: `${localizedName} (${count})`,
          data: map(filteredCards, c => {
            return {
              ...c,
              special,
            };
          }),
        });
      }
    }
  });
  return result;
}

interface Props {
  componentId: string;
  fontScale: number;
  deck: Deck;
  parsedDeck: ParsedDeck;
  meta: DeckMeta;
  hasPendingEdits?: boolean;
  cards: CardsMap;
  editable: boolean;
  isPrivate: boolean;
  buttons?: ReactNode;
  showEditNameDialog: () => void;
  deckName: string;
  singleCardView: boolean;
  signedIn: boolean;
  login: () => void;
  problem?: DeckProblem;
  renderFooter: (slots?: Slots) => React.ReactNode;
  onDeckCountChange: (code: string, count: number) => void;
  setMeta: (key: string, value: string) => void;
  showEditCards: () => void;
  width: number;
}

interface State {
  showHeroCards: boolean;
}

export default class DeckViewTab extends React.Component<Props, State> {
  state: State = {
    showHeroCards: false,
  };

  _keyForCard = (item: SectionCardId) => {
    return item.id;
  };

  _showInvestigator = () => {
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
        deck,
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
        true,
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
      deck,
      investigator,
      renderFooter,
    );
  };

  _renderSectionHeader = ({ section }: {
    section: SectionListData<CardSection>;
  }) => {
    const {
      fontScale,
      meta,
    } = this.props;
    return (
      <CardSectionHeader
        key={section.id}
        section={section as CardSectionHeaderData}
        meta={meta}
        fontScale={fontScale}
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
      fontScale,
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
        fontScale={fontScale}
      />
    );
  };

  renderProblem() {
    const {
      problem,
      fontScale,
    } = this.props;

    if (!problem) {
      return null;
    }
    return (
      <View style={styles.problemBox}>
        <DeckProblemRow
          problem={problem}
          color={COLORS.white}
          fontSize={14}
          fontScale={fontScale}
        />
      </View>
    );
  }

  data(): CardSection[] {
    const {
      parsedDeck: {
        normalCards,
        investigator,
      },
      meta,
      showEditCards,
      cards,
    } = this.props;
    const { showHeroCards } = this.state;
    const validation = new DeckValidation(investigator, meta);
    return [
      {
        id: 'cards',
        superTitle: t`Deck Cards`,
        data: [],
        onPress: showEditCards,
      },
      ...deckToSections(normalCards, cards, validation, showHeroCards, false),
    ];
  }

  renderInvestigatorStats() {
    const {
      parsedDeck: {
        investigator,
      },
    } = this.props;

    const health = investigator.health || 0;
    const handSize = investigator.hand_size || 0;
    return (
      <>
        <View style={styles.skillRow}>
          <Text style={typography.mediumGameFont}>
            { investigator.name }
          </Text>
        </View>
        <View style={styles.skillRow}>
          <Text style={typography.mediumGameFont}>
            ATK { investigator.attack || 0 }
          </Text>
          <Text style={typography.mediumGameFont}>
            THW { investigator.thwart || 0 }
          </Text>
          <Text style={typography.mediumGameFont}>
            DEF { investigator.defense || 0 }
          </Text>
        </View>
        <View style={styles.skillRow}>
          <Text style={typography.mediumGameFont}>
            { t`Health: ${health}` }
          </Text>
          <Text style={typography.mediumGameFont}>
            { t`Hand Size: ${handSize}` }
          </Text>
        </View>
      </>
    );
  }

  _setShowHeroCards = (value: boolean) => {
    this.setState({
      showHeroCards: value,
    });
  };

  renderInvestigatorOptions() {
    const {
      parsedDeck: {
        investigator,
      },
      meta,
      setMeta,
      editable,
    } = this.props;
    return (
      <View>
        <InvestigatorOptionsModule
          investigator={investigator}
          meta={meta}
          setMeta={setMeta}
          disabled={!editable}
        />
        <SettingsSwitch
          title={t`Required Hero Cards`}
          onValueChange={this._setShowHeroCards}
          value={this.state.showHeroCards}
        />
      </View>
    );
  }

  renderInvestigatorBlock() {
    const {
      componentId,
      parsedDeck: {
        investigator,
      },
    } = this.props;

    return (
      <View style={styles.column}>
        <TouchableOpacity onPress={this._showInvestigator}>
          <View style={styles.header}>
            <View style={styles.image}>
              <HeroImage
                card={investigator}
                componentId={componentId}
              />
            </View>
            <View style={styles.metadata}>
              { this.renderInvestigatorStats() }
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  _renderHeader = () => {
    const {
      buttons,
    } = this.props;

    return (
      <View style={styles.headerWrapper}>
        <View style={styles.headerBlock}>
          { this.renderProblem() }
          <View style={styles.container}>
            { this.renderInvestigatorBlock() }
            { isBig && (
              <View style={[styles.column, styles.buttonColumn]}>
                { buttons }
              </View>
            ) }
          </View>
          { this.renderInvestigatorOptions() }
          { !isBig && buttons }
        </View>
      </View>
    );
  };

  render() {
    const sections = this.data();
    return (
      <SectionList
        ListHeaderComponent={this._renderHeader}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        initialNumToRender={25}
        renderItem={this._renderCard}
        keyExtractor={this._keyForCard}
        renderSectionHeader={this._renderSectionHeader}
        sections={sections}
      />
    );
  }
}

const styles = StyleSheet.create({
  header: {
    marginTop: s,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerWrapper: {
    position: 'relative',
  },
  column: {
    flex: 1,
  },
  buttonColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metadata: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 300,
  },
  image: {
    marginRight: s,
  },
  container: {
    marginLeft: s,
    marginRight: s,
    flexDirection: 'row',
  },
  problemBox: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: s,
    paddingLeft: s,
    backgroundColor: COLORS.red,
  },
  headerBlock: {
    paddingBottom: s,
    position: 'relative',
  },
  skillRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
