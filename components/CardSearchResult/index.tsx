import React, { ReactNode } from 'react';
import { flatMap, map, range, repeat } from 'lodash';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';

import MarvelIcon from '../../assets/MarvelIcon';
import CardCostIcon, { COST_ICON_SIZE } from '../core/CardCostIcon';
import Button from '../core/Button';
import Switch from '../core/Switch';
import Card from '../../data/Card';
import { createFactionIcons, FACTION_COLORS, RESOURCES, ResourceCodeType } from '../../constants';
import { COLORS } from '../../styles/colors';
import { ROW_HEIGHT, ICON_SIZE, TOGGLE_BUTTON_MODE, BUTTON_WIDTH } from './constants';
import CardQuantityComponent from './CardQuantityComponent';
import typography from '../../styles/typography';
import { isBig, s, xs } from '../../styles/space';

const SKILL_ICON_SIZE = (isBig ? 26 : 16) * DeviceInfo.getFontScale();
const SMALL_ICON_SIZE = (isBig ? 38 : 26) * DeviceInfo.getFontScale();
const SMALL_FACTION_ICONS = createFactionIcons(SMALL_ICON_SIZE);
const FACTION_ICONS = createFactionIcons(ICON_SIZE);

interface Props {
  card: Card;
  id?: string;
  count?: number;
  onPress?: (card: Card) => void;
  onPressId?: (code: string, card: Card) => void;
  onUpgrade?: (card: Card) => void;
  onDeckCountChange?: (code: string, count: number) => void;
  limit?: number;
  onToggleChange?: () => void;
  toggleValue?: boolean;
  deltaCountMode?: boolean;
  hasSecondCore?: boolean;
  showZeroCount?: boolean;
}

export default class CardSearchResult extends React.PureComponent<Props> {
  _onPress = () => {
    const {
      id,
      onPress,
      onPressId,
      card,
    } = this.props;
    Keyboard.dismiss();
    if (id && onPressId) {
      onPressId(id, card);
    } else {
      onPress && onPress(card);
    }
  };

  _onUpgradePressed = () => {
    const {
      onUpgrade,
      card,
    } = this.props;
    onUpgrade && onUpgrade(card);
  };

  _onDeckCountChange = (count: number) => {
    const {
      onDeckCountChange,
      card,
    } = this.props;
    onDeckCountChange && onDeckCountChange(card.code, count);
  };

  _renderCountButton = (count: number) => {
    return count;
  };

  renderFactionIcon(card: Card, size: number): ReactNode {
    if (!card.encounter_code && card.linked_card) {
      return this.renderFactionIcon(card.linked_card, size);
    }

    if (card.spoiler && card.encounter_code) {
      // Encounter icons?
      return null;
    }    
    if (card.isEncounterCard()) {
      return null;
    }
    if (card.faction2_code) {
      return (size === ICON_SIZE ? FACTION_ICONS : SMALL_FACTION_ICONS).dual;
    }
    return (size === ICON_SIZE ? FACTION_ICONS : SMALL_FACTION_ICONS)[card.factionCode()];
  }

  renderIcon(card: Card): ReactNode {
    if (card.hidden && card.linked_card) {
      return this.renderIcon(card.linked_card);
    }

    if (card.hasCost()) {
      return (
        <View style={styles.factionIcon}>
          <CardCostIcon card={card} />
        </View>
      );
    }
    return (
      <View style={styles.factionIcon}>
        { this.renderFactionIcon(card, ICON_SIZE) }
      </View>
    );
  }

  static resourceIcon(skill: ResourceCodeType, count: number): ReactNode[] {
    if (count === 0) {
      return [];
    }
    return map(range(0, count), key => (
      <View key={`${skill}-${key}`} style={styles.resourceIcon}>
        <MarvelIcon
          name={skill}
          size={SKILL_ICON_SIZE}
          color="#444"
        />
      </View>
    ));
  }

  renderDualFactionIcons() {
    const {
      card,
    } = this.props;
    if (!card.faction2_code) {
      return null;
    }
    return (
      <View style={styles.dualFactionIcons}>
        <View style={styles.resourceIcon}>
          <MarvelIcon
            name={card.factionCode()}
            size={15}
            color={FACTION_COLORS[card.factionCode()]}
          />
        </View>
        <View style={styles.resourceIcon}>
          <MarvelIcon
            name={card.faction2_code}
            size={15}
            color={FACTION_COLORS[card.faction2_code]}
          />
        </View>
      </View>
    );
  }

  renderResourceIcons() {
    const {
      card,
    } = this.props;
    if (!card.isPlayerDeckCard()) {
      return null;
    }
    return (
      <View style={styles.resources}>
        { flatMap(RESOURCES, (resource: ResourceCodeType) =>
          CardSearchResult.resourceIcon(resource, card.resourceCount(resource))) }
      </View>
    );
  }

  renderCardName() {
    const {
      card,
    } = this.props;
    const color = card.faction2_code ?
      FACTION_COLORS.dual :
      (FACTION_COLORS[card.factionCode()] || '#000000');
    return (
      <View style={styles.cardNameBlock}>
        <View style={styles.row}>
          <Text style={[typography.text, { color }]} numberOfLines={1} ellipsizeMode="clip">
            { card.renderName }
          </Text>
        </View>
        <View style={styles.row}>
          { this.renderResourceIcons() }
          { !!card.renderSubname && (
            <View style={styles.row}>
              <Text style={[typography.small, styles.subname, { color }]} numberOfLines={1} ellipsizeMode="clip">
                { card.renderSubname }
              </Text>
            </View>
          ) }
          { this.renderDualFactionIcons() }
        </View>
      </View>
    );
  }

  countText(count: number) {
    const {
      deltaCountMode,
    } = this.props;
    if (deltaCountMode) {
      if (count > 0) {
        return `+${count}`;
      }
      return `${count}`;
    }
    return `×${count}`;
  }

  renderCount() {
    const {
      card,
      count = 0,
      onDeckCountChange,
      onUpgrade,
      limit,
      hasSecondCore,
      showZeroCount,
    } = this.props;
    if (onDeckCountChange) {
      const deck_limit: number = Math.min(
        card.pack_code === 'core' ?
          ((card.quantity || 0) * (hasSecondCore ? 2 : 1)) :
          (card.deck_limit || 0),
        card.deck_limit || 0
      );
      return (
        <CardQuantityComponent
          count={count || 0}
          limit={Math.max(count || 0, typeof limit === 'number' ? limit : deck_limit)}
          countChanged={this._onDeckCountChange}
          showZeroCount={showZeroCount}
        />
      );
    }
    if (count !== 0) {
      return (
        <View style={styles.countText}>
          { !!onUpgrade && (
            <Button
              style={styles.upgradeButton}
              size="small"
              onPress={this._onUpgradePressed}
              icon={<MaterialCommunityIcons size={18 * DeviceInfo.getFontScale()} color="#FFF" name="arrow-up-bold" />}
            />
          ) }
          <Text style={typography.text}>
            { this.countText(count) }
          </Text>
        </View>
      );
    }
    return null;
  }

  renderContent() {
    const {
      card,
      onToggleChange,
      toggleValue,
      onPress,
      onPressId,
      onDeckCountChange,
    } = this.props;
    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity
          onPress={this._onPress}
          disabled={!onPress && !onPressId}
          style={[styles.row, styles.fullHeight]}
        >
          <View style={[
            styles.cardTextRow,
            onDeckCountChange && TOGGLE_BUTTON_MODE ?
              { paddingRight: BUTTON_WIDTH } :
              {},
          ]}>
            { this.renderIcon(card) }
            { this.renderCardName() }
          </View>
        </TouchableOpacity>
        { this.renderCount() }
        { !!onToggleChange && (
          <View style={styles.switchButton}>
            <Switch
              value={toggleValue}
              onValueChange={onToggleChange}
            />
          </View>
        ) }
      </View>
    );
  }

  render() {
    const {
      card,
    } = this.props;
    if (!card) {
      return (
        <View style={styles.rowContainer}>
          <View style={styles.cardNameBlock}>
            <View style={styles.row}>
              <Text style={typography.text}>
                Unknown Card
              </Text>
            </View>
          </View>
        </View>
      );
    }
    if (!card.name) {
      return (
        <View style={styles.rowContainer}>
          <Text>No Text</Text>;
        </View>
      );
    }

    return this.renderContent();
  }
}

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: 'transparent',
    position: 'relative',
    width: '100%',
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: COLORS.gray,
  },
  cardNameBlock: {
    marginLeft: 4,
    marginTop: 4,
    marginBottom: 4,
    marginRight: 2,
    flexDirection: 'column',
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  fullHeight: {
  },
  resources: {
    flexDirection: 'row',
  },
  dualFactionIcons: {
    marginLeft: 8,
    flexDirection: 'row',
  },
  resourceIcon: {
    marginRight: 2,
  },
  subname: {
    marginRight: s,
  },
  factionIcon: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: COST_ICON_SIZE,
    width: COST_ICON_SIZE,
    marginRight: xs,
  },
  cardTextRow: {
    flex: 2,
    flexDirection: 'row',
    paddingLeft: s,
    alignItems: 'center',
  },
  switchButton: {
    marginTop: 6,
    marginRight: 6,
  },
  countText: {
    marginRight: s,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraXp: {
    color: 'purple',
    marginRight: xs,
  },
  upgradeButton: {
    marginRight: s,
  },
});
