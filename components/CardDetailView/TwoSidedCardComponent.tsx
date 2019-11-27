import React from 'react';
import { flatMap, map, range } from 'lodash';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Navigation } from 'react-native-navigation';
import DeviceInfo from 'react-native-device-info';
import { msgid, ngettext, t } from 'ttag';

import {
  CORE_FACTION_CODES,
  FACTION_COLORS,
  FACTION_BACKGROUND_COLORS,
} from '../../constants';
import typography from '../../styles/typography';
import space, { isBig, xs, s } from '../../styles/space';
import AppIcon from '../../assets/AppIcon';
import MarvelIcon from '../../assets/MarvelIcon';
import CardFlavorTextComponent from '../CardFlavorTextComponent';
import { InvestigatorCardsProps } from '../InvestigatorCardsView';
import CardTextComponent from '../CardTextComponent';
import Button from '../core/Button';
import CardCostIcon from '../core/CardCostIcon';
import BaseCard from '../../data/BaseCard';
import { CardFaqProps } from '../CardFaqView';

import PlayerCardImage from './PlayerCardImage';

const PLAYER_BACK = require('../../assets/player-back.png');
const ENCOUNTER_BACK = require('../../assets/encounter-back.png');
const PER_HERO_ICON = (
  <MarvelIcon name="per_investigator" size={isBig ? 22 : 12} color="#000000" />
);
const ICON_SIZE = isBig ? 44 : 28;
const SMALL_ICON_SIZE = isBig ? 26 : 16;
const RESOURCE_ICON_SIZE = isBig ? 26 : 16;

const RESOURCE_FIELDS = [
  'resource_physical',
  'resource_mental',
  'resource_energy',
  'resource_wild',
];

function num(value: number | null) {
  if (value === null) {
    return '-';
  }
  if (value < 0) {
    return 'X';
  }
  return value;
}

interface Props {
  componentId: string;
  card: BaseCard;
  linked?: boolean;
  notFirst?: boolean;
  width: number;
  fontScale: number;
}

interface State {
  showBack: boolean;
}

export default class TwoSidedCardComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showBack: false,
    };
  }

  editSpoilersPressed() {
    Navigation.push<{}>(this.props.componentId, {
      component: {
        name: 'My.Spoilers',
      },
    });
  }

  _showFaq = () => {
    const {
      componentId,
      card,
    } = this.props;
    Navigation.push<CardFaqProps>(componentId, {
      component: {
        name: 'Card.Faq',
        passProps: {
          id: card.code,
        },
        options: {
          topBar: {
            title: {
              text: t`FAQ`,
            },
            subtitle: {
              text: card.name,
            },
          },
        },
      },
    });
  };

  showInvestigatorCards() {
    const {
      componentId,
      card,
    } = this.props;

    Navigation.push<InvestigatorCardsProps>(componentId, {
      component: {
        name: 'Browse.InvestigatorCards',
        passProps: {
          investigatorCode: card.code,
        },
        options: {
          topBar: {
            title: {
              text: t`Allowed Cards`,
            },
            backButton: {
              title: t`Back`,
            },
          },
        },
      },
    });
  }

  _toggleShowBack = () => {
    this.setState({
      showBack: !this.state.showBack,
    });
  };

  renderMetadata(card: BaseCard) {
    return (
      <View style={styles.metadataBlock}>
        { !!(card.subtype_name || card.type_name) && (
          <Text style={[typography.cardText, styles.typeText]}>
            { card.subtype_name ?
              `${card.type_name}. ${card.subtype_name}` :
              card.type_name }
            { (card.type_code === 'main_scheme' || card.type_code === 'villain') ? ` ${card.stage}` : '' }
          </Text>
        ) }
        { !!card.traits && (
          <Text style={[typography.cardText, styles.traitsText]}>
            { card.traits }
          </Text>
        ) }
      </View>
    );
  }

  renderResourceIcons(card: BaseCard) {
    const resources = flatMap(RESOURCE_FIELDS, resource => {
      // @ts-ignore
      const count = card[resource] || 0;
      return range(0, count).map(() => resource);
    });

    if (resources.length === 0) {
      return null;
    }
    return (
      <View style={styles.resourceIconRow}>
        <Text style={typography.cardText}>
          { t`Resource: ` }
        </Text>
        { map(resources, (resource, idx) => (
          <MarvelIcon
            style={styles.resourceIcon}
            key={idx}
            name={resource.substring(9)}
            size={RESOURCE_ICON_SIZE}
            color="#444"
          />))
        }
      </View>
    );
  }

  renderPlaydata(card: BaseCard) {
    const costString = card.costString(this.props.linked);
    const threat = num(card.threat);
    return (
      <View style={styles.statsBlock}>
        { !!(costString) && (
          <Text style={typography.cardText}>
            { costString }
          </Text>
        ) }
        { (card.type_code === 'main_scheme' || card.type_code === 'side_scheme') && (
          <Text style={typography.cardText}>
            { t`Threat: ${threat}` }
          </Text>
        ) }
        { this.renderResourceIcons(card) }
        { this.renderHealthAndSanity(card) }
      </View>
    );
  }

  renderHealthAndSanity(card: BaseCard) {
    if (card.type_code === 'minion' || card.type_code === 'villain') {
      return (
        <Text style={typography.cardText}>
          { `${t`Fight`}: ${num(card.enemy_fight)}. ${t`Health`}: ${num(card.health)}` }
          { !!card.health_per_hero && PER_HERO_ICON }
          { `. ${t`Evade`}: ${num(card.enemy_evade)}. ` }
        </Text>
      );
    }
    if (card.health && card.health > 0) {
      return (
        <Text style={typography.cardText}>
          { `${t`Health`}: ${num(card.health)}.` }
        </Text>
      );
    }
    return null;
  }

  renderFactionIcon(card: BaseCard) {
    const color = card.isPlayerDeckCard() ? '#FFF' : '#222';

    if (card.spoiler) {
      // Encounter Icon
      return null;
    }
    if (card.isPlayerDeckCard()) {
      if (card.faction2_code) {
        return (
          <React.Fragment>
            <View style={styles.factionIcon}>
              { !!card.faction_code &&
                (CORE_FACTION_CODES.indexOf(card.faction_code) !== -1) &&
                <MarvelIcon name={card.faction_code} size={28} color="#FFF" /> }
            </View>
            <View style={styles.factionIcon}>
              { !!card.faction2_code &&
                (CORE_FACTION_CODES.indexOf(card.faction2_code) !== -1) &&
                <MarvelIcon name={card.faction2_code} size={28} color="#FFF" /> }
            </View>
          </React.Fragment>
        );
      }
      return (
        <View style={styles.factionIcon}>
          { (!!card.faction_code && CORE_FACTION_CODES.indexOf(card.faction_code) !== -1) &&
            <MarvelIcon name={card.faction_code} size={ICON_SIZE + 4} color={color} /> }
        </View>
      );
    }
    return null;
  }

  renderTitleContent(
    card: BaseCard,
    name: string,
    subname: string | null,
    factionColor?: string
  ) {
    const {
      fontScale,
    } = this.props;
    return (
      <React.Fragment>
        <View style={styles.titleRow}>
          { card.hasCost() && (
            <View style={styles.costIcon}>
              <CardCostIcon
                card={card}
                inverted
                linked={this.props.linked}
                fontScale={fontScale}
              />
            </View>
          ) }
          <View style={styles.column}>
            <Text style={[
              typography.text,
              space.marginLeftS,
              { color: factionColor ? '#FFFFFF' : '#000000' },
            ]}>
              { `${name}${card.is_unique ? ' ✷' : ''}` }
            </Text>
            { !!subname && (
              <Text style={[
                typography.small,
                space.marginLeftS,
                { color: factionColor ? '#FFFFFF' : '#000000' },
              ]}>
                { subname }
              </Text>
            ) }
          </View>
        </View>
        { this.renderFactionIcon(card) }
      </React.Fragment>
    );
  }

  renderTitle(
    card: BaseCard,
    name: string,
    subname: string | null,
  ) {
    const factionColor = card.faction2_code ? FACTION_BACKGROUND_COLORS.dual :
      (card.faction_code && FACTION_BACKGROUND_COLORS[card.faction_code]);
    return (
      <View style={[styles.cardTitle, {
        backgroundColor: factionColor || '#FFFFFF',
        borderColor: card.faction2_code ? FACTION_BACKGROUND_COLORS.dual : (factionColor || '#000000'),
      }]}>
        { this.renderTitleContent(card, name, subname, factionColor) }
      </View>
    );
  }

  backSource(card: BaseCard, isHorizontal: boolean) {
    if (card.double_sided) {
      if (isHorizontal) {
        return {
          uri: `https://marvelcdb.com${card.imagesrc}`,
          cache: 'force-cache',
        };
      }
      return {
        uri: `https://marvelcdb.com${card.backimagesrc}`,
        cache: 'force-cache',
      };
    }
    return card.deck_limit && card.deck_limit > 0 ? PLAYER_BACK : ENCOUNTER_BACK;
  }

  renderCardBack(
    card: BaseCard,
    backFirst: boolean,
    isHorizontal: boolean,
    flavorFirst: boolean,
    isFirst: boolean
  ) {
    const {
      componentId,
      width,
      fontScale,
    } = this.props;
    if (card.linked_card) {
      return (
        <View>
          <TwoSidedCardComponent
            componentId={componentId}
            card={card.linked_card}
            linked
            notFirst={!isFirst}
            width={width}
            fontScale={fontScale}
          />
        </View>
      );
    }
    if (!card.double_sided) {
      return null;
    }

    if (!backFirst && card.spoiler && !this.state.showBack) {
      return (
        <View style={[styles.buttonContainer, { width }]}>
          <Button grow text={t`Show back`} onPress={this._toggleShowBack} />
        </View>
      );
    }

    return (
      <View style={[styles.container, { width }]}>
        <View style={[styles.card, {
          backgroundColor: '#FFFFFF',
          borderColor: card.faction2_code ?
            FACTION_BACKGROUND_COLORS.dual :
            ((card.faction_code && FACTION_COLORS[card.faction_code]) || '#000000'),
        }]}>
          { this.renderTitle(card, card.back_name || card.name, null) }
          <View style={styles.cardBody}>
            <View style={styles.typeBlock}>
              <View style={styles.metadataBlock}>
                <Text style={[typography.cardText, styles.typeText]}>
                  { card.type_name }
                  { card.type_code === 'main_scheme' ?
                    ` ${card.stage}` :
                    '' }
                </Text>
                { !!card.traits && (
                  <Text style={[typography.cardText, styles.traitsText]}>
                    { card.traits }
                  </Text>
                ) }
              </View>
              { !!card.back_flavor && flavorFirst &&
                <CardFlavorTextComponent text={card.back_flavor} />
              }
              { !!card.back_text && (
                <View style={[styles.gameTextBlock, {
                  borderColor: card.faction2_code ?
                    FACTION_BACKGROUND_COLORS.dual :
                    ((card.faction_code && FACTION_COLORS[card.faction_code]) || '#000000'),
                }]}>
                  <CardTextComponent text={card.back_text} />
                </View>)
              }
              { !!card.back_flavor && !flavorFirst &&
                <CardFlavorTextComponent text={card.back_flavor} />
              }
            </View>
            { isFirst && this.renderCardFooter(card) }
          </View>
        </View>
      </View>
    );
  }

  renderFaqButton() {
    const { fontScale } = this.props;
    return (
      <Button
        grow
        text={t`FAQ`}
        onPress={this._showFaq}
        icon={<AppIcon name="faq" size={24 * fontScale} color="white" />}
      />
    );
  }

  renderCardFooter(card: BaseCard) {
    return (
      <React.Fragment>
        <View style={[styles.column, styles.flex]}>
          { !!card.illustrator && (
            <Text style={[typography.cardText, styles.illustratorText]}>
              <AppIcon name="paintbrush" size={16} color="#000000" />
              { ` ${card.illustrator}` }
            </Text>
          ) }
          { !!card.pack_name &&
            <View style={styles.setRow}>
              <Text style={typography.cardText}>
                { `${card.pack_name} #${card.position % 1000}.` }
              </Text>
              { !!card.encounter_name &&
                <Text style={typography.cardText}>
                  { `${card.encounter_name} #${card.encounter_position}.${card.quantity && card.quantity > 1 ?
                    ngettext(
                      msgid`\n${card.quantity} copy.`,
                      `\n${card.quantity} copies.`,
                      card.quantity
                    ) : ''
                  }` }
                </Text>
              }
            </View>
          }
        </View>
        <View style={styles.twoColumn}>
          <View style={[styles.halfColumn, { paddingRight: s }]}>
            { this.renderFaqButton() }
          </View>
        </View>
      </React.Fragment>
    );
  }

  renderImage(card: BaseCard) {
    return (
      <View style={styles.column}>
        <View style={styles.playerImage}>
          <PlayerCardImage
            card={card}
            componentId={this.props.componentId}
          />
        </View>
      </View>
    );
  }

  renderCardText(
    card: BaseCard,
    backFirst: boolean,
    isHorizontal: boolean,
    flavorFirst: boolean
  ) {
    return (
      <React.Fragment>
        { !!card.text && (
          <View style={[styles.gameTextBlock, {
            borderColor: card.faction2_code ?
              FACTION_BACKGROUND_COLORS.dual :
              ((card.faction_code && FACTION_COLORS[card.faction_code]) || '#000000'),
          }]}>
            <CardTextComponent text={card.text} />
          </View>)
        }
        { !!card.flavor && !flavorFirst &&
          <CardFlavorTextComponent text={card.flavor} />
        }
      </React.Fragment>
    );
  }

  renderCardFront(
    card: BaseCard,
    backFirst: boolean,
    isHorizontal: boolean,
    flavorFirst: boolean,
    isFirst: boolean
  ) {
    const { width } = this.props;
    if (card.isEncounterCard() && (card.hidden || backFirst) && (card.hidden || card.spoiler) && !this.state.showBack) {
      return (
        <View style={[styles.buttonContainer, { width }]}>
          <Button
            grow
            text={(card.hidden || backFirst) ? t`Show back` : t`Show front`}
            onPress={this._toggleShowBack}
          />
        </View>
      );
    }

    const isTablet = Platform.OS === 'ios' && DeviceInfo.isTablet();
    return (
      <View style={styles.container}>
        <View style={[
          styles.card,
          {
            borderColor: card.faction2_code ?
              FACTION_BACKGROUND_COLORS.dual :
              ((card.faction_code && FACTION_COLORS[card.faction_code]) || '#000000'),
          },
        ]}>
          { this.renderTitle(card, card.name, card.subname) }
          <View style={styles.cardBody}>
            <View style={[styles.typeBlock, {
              backgroundColor: '#FFFFFF',
            }]}>
              <View style={styles.row}>
                <View style={styles.mainColumn}>
                  { this.renderMetadata(card) }
                  { this.renderPlaydata(card) }
                  { !!(card.flavor && flavorFirst) &&
                    <CardFlavorTextComponent text={card.flavor} />
                  }
                  { isTablet && this.renderCardText(card, backFirst, isHorizontal, flavorFirst) }
                </View>
                { this.renderImage(card) }
              </View>
              { !isTablet && this.renderCardText(card, backFirst, isHorizontal, flavorFirst) }
              { isFirst && this.renderCardFooter(card) }
            </View>
          </View>
        </View>
      </View>
    );
  }

  render() {
    const {
      card,
      linked,
      notFirst,
    } = this.props;

    const isHorizontal = card.type_code === 'side_scheme' ||
      card.type_code === 'main_scheme';
    const flavorFirst = card.type_code === 'side_scheme' ||
      card.type_code === 'main_scheme';
    const backFirst = !linked &&
      (!!card.double_sided || (card.linked_card && !card.linked_card.hidden)) &&
      !(isHorizontal || !card.spoiler);

    const sideA = backFirst && this.renderCardBack(card, backFirst, isHorizontal, flavorFirst, !notFirst);
    const sideB = this.renderCardFront(card, !!backFirst, isHorizontal, flavorFirst, !notFirst && !sideA);
    const sideC = !backFirst && this.renderCardBack(card, !!backFirst, isHorizontal, flavorFirst, !notFirst && !sideA && !sideB);
    return (
      <View>
        { sideA }
        { sideB }
        { sideC }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  halfColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mainColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
  playerImage: {
    marginTop: 2,
    marginBottom: s,
    marginLeft: xs,
  },
  metadataBlock: {
    marginBottom: s,
  },
  container: {
    paddingTop: s,
    paddingLeft: s,
    paddingRight: s,
    paddingBottom: s,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 768,
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 4,
  },
  cardBody: {
    paddingTop: xs,
    paddingLeft: s,
    paddingRight: s + 1,
    paddingBottom: xs,
  },
  cardTitle: {
    paddingRight: s,
    paddingTop: xs,
    paddingBottom: xs,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameTextBlock: {
    borderLeftWidth: 4,
    paddingLeft: xs,
    marginBottom: s,
    marginRight: s,
  },
  statsBlock: {
    marginBottom: s,
  },
  slotBlock: {
    marginBottom: s,
  },
  setRow: {
    marginBottom: xs,
  },
  typeBlock: {
    marginTop: xs,
  },
  typeText: {
    fontWeight: isBig ? '500' : '700',
  },
  traitsText: {
    fontWeight: isBig ? '500' : '700',
    fontStyle: 'italic',
  },
  illustratorText: {
    marginBottom: xs,
  },
  buttonContainer: {
    paddingLeft: s,
    paddingRight: s,
    paddingTop: xs,
    paddingBottom: xs,
    flexDirection: 'row',
    justifyContent: isBig ? 'center' : 'flex-start',
    maxWidth: 768,
  },
  costIcon: {
    marginLeft: xs,
  },
  resourceIconRow: {
    flexDirection: 'row',
  },
  resourceIcon: {
    marginLeft: 2,
  },
  factionIcon: {
  },
});
