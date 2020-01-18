import React from 'react';
import { keys, forEach, filter, indexOf, map } from 'lodash';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { connect } from 'react-redux';

import { t } from 'ttag';
import { Pack } from '../../../actions/types';
import FactionChooser from './FactionChooser';
import ResourceChooser from './ResourceChooser';
import FilterChooserButton from '../FilterChooserButton';
import SliderChooser from '../SliderChooser';
import ToggleFilter from '../../core/ToggleFilter';
import withFilterFunctions, { FilterProps } from '../withFilterFunctions';
import NavButton from '../../core/NavButton';
import { CORE_FACTION_CODES, FactionCodeType } from '../../../constants';
import { getAllPacks, AppState } from '../../../reducers';
import { COLORS } from '../../../styles/colors';

const CARD_FACTION_CODES: FactionCodeType[] = [
  ...CORE_FACTION_CODES,
  'basic',
  'encounter',
];

interface ReduxProps {
  allPacks: Pack[];
}

type Props = ReduxProps & FilterProps;

interface State {
  loading: boolean;
  hasCost: boolean;
  hasResource: boolean;
  allUses: string[];
  allFactions: FactionCodeType[];
  allTraits: string[];
  allTypes: string[];
  allTypeCodes: string[];
  allSubTypes: string[];
  allPacks: string[];
  allEncounters: string[];
  allIllustrators: string[];
  levels: number[];
}

class CardFilterView extends React.Component<Props, State> {
  static get options() {
    return {
      topBar: {
        title: {
          text: t`Filter`,
          color: COLORS.navButton,
        },
      },
    };
  }

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: true,
      hasCost: false,
      hasResource: false,
      allUses: [],
      allFactions: CARD_FACTION_CODES,
      allTraits: [],
      allTypes: [],
      allTypeCodes: [],
      allSubTypes: [],
      allPacks: [],
      allEncounters: [],
      allIllustrators: [],
      levels: [],
    };
  }

  componentDidMount() {
    const {
      cards,
    } = this.props;
    setTimeout(() => {
      const allFactions = filter(CARD_FACTION_CODES, faction_code =>
        cards.filtered(`faction_code == '${faction_code}'`).length > 0);
      let hasCost = false;
      let hasResource = false;
      const typesMap: { [key: string]: boolean } = {};
      const typeCodesMap: { [key: string]: boolean } = {};
      const usesMap: { [key: string]: boolean } = {};
      const subTypesMap: { [key: string]: boolean } = {};
      const traitsMap: { [key: string]: boolean } = {};
      const packsMap: { [key: string]: boolean } = {};
      const encountersMap: { [key: string]: boolean } = {};
      const illustratorsMap: { [key: string]: boolean } = {};
      forEach(cards, card => {
        if (card.cost !== null) {
          hasCost = true;
        }
        if (!hasResource && (
          card.resource_physical ||
          card.resource_mental ||
          card.resource_energy ||
          card.resource_wild
        )) {
          hasResource = true;
        }
        if (card.traits) {
          forEach(
            filter(map(card.traits.split('.'), t => t.trim()), t => !!t),
            t => {
              traitsMap[t] = true;
            });
        }
        if (card.subtype_name) {
          subTypesMap[card.subtype_name] = true;
        }
        if (card.uses) {
          usesMap[card.uses] = true;
        }
        if (card.pack_name) {
          packsMap[card.pack_name] = true;
        }
        if (card.card_set_name) {
          encountersMap[card.card_set_name] = true;
        }
        if (card.illustrator) {
          illustratorsMap[card.illustrator] = true;
        }
        typesMap[card.type_name] = true;
        typeCodesMap[card.type_code] = true;
      });

      this.setState({
        loading: false,
        allFactions,
        hasCost,
        hasResource,
        allUses: keys(usesMap).sort(),
        allTraits: keys(traitsMap).sort(),
        allTypes: keys(typesMap).sort(),
        allTypeCodes: keys(typeCodesMap).sort(),
        allSubTypes: keys(subTypesMap).sort(),
        allPacks: keys(packsMap).sort(),
        allEncounters: keys(encountersMap).sort(),
        allIllustrators: keys(illustratorsMap).sort(),
      });
    }, 0);
  }

  _onPacksPress = () => {
    this.props.pushFilterView('SearchFilters.Packs');
  };

  _onEnemyPress = () => {
    this.props.pushFilterView('SearchFilters.Enemy');
  };

  _onLocationPress = () => {
    this.props.pushFilterView('SearchFilters.Location');
  };

  static rangeText(name: string, values: [number, number]) {
    if (values[0] === values[1]) {
      return `${name}(${values[0]})`;
    }
    return `${name}(${values[0]}-${values[1]})`;
  }

  selectedPacksText() {
    const {
      filters: {
        packs,
      },
      allPacks,
    } = this.props;
    if (!allPacks.length || !packs.length) {
      return t`Packs: All`;
    }
    const selectedPackNames = new Set(packs);
    const selectedPacks = filter(
      allPacks,
      pack => selectedPackNames.has(pack.name)
    );
    const parts: string[] = [];
    forEach(selectedPacks, pack => {
      parts.push(pack.name);
    });
    const allPacksString = parts.join(', ');
    return t`Packs: ${allPacksString}`;
  }

  enemyFilterText() {
    const {
      filters: {
        enemyElite,
        enemyNonElite,
        enemyHunter,
        enemyNonHunter,
        enemyParley,
        enemyRetaliate,
        enemyAlert,
        enemySpawn,
        enemyPrey,
        enemyAloof,
        enemyMassive,
        enemyHealthEnabled,
        enemyHealth,
        enemyHealthPerHero,
        enemyDamageEnabled,
        enemyDamage,
        enemyHorrorEnabled,
        enemyHorror,
        enemyFightEnabled,
        enemyFight,
        enemyEvadeEnabled,
        enemyEvade,
      },
    } = this.props;
    const parts = [];
    if (enemyElite) {
      parts.push(t`Elite`);
    }
    if (enemyNonElite) {
      parts.push(t`Non-Elite`);
    }
    if (enemyHunter) {
      parts.push(t`Hunter`);
    }
    if (enemyNonHunter) {
      parts.push(t`Non-Hunter`);
    }
    if (enemyParley) {
      parts.push(t`Parley`);
    }
    if (enemyRetaliate) {
      parts.push(t`Retaliate`);
    }
    if (enemyAlert) {
      parts.push(t`Alert`);
    }
    if (enemySpawn) {
      parts.push(t`Spawn`);
    }
    if (enemyPrey) {
      parts.push(t`Prey`);
    }
    if (enemyAloof) {
      parts.push(t`Aloof`);
    }
    if (enemyMassive) {
      parts.push(t`Massive`);
    }
    if (enemyHealthEnabled) {
      if (enemyHealthPerHero) {
        parts.push(CardFilterView.rangeText(t`HPI`, enemyHealth));
      } else {
        parts.push(CardFilterView.rangeText(t`Health`, enemyHealth));
      }
    }
    if (enemyDamageEnabled) {
      parts.push(CardFilterView.rangeText(t`Damage`, enemyDamage));
    }
    if (enemyHorrorEnabled) {
      parts.push(CardFilterView.rangeText(t`Horror`, enemyHorror));
    }
    if (enemyFightEnabled) {
      parts.push(CardFilterView.rangeText(t`Fight`, enemyFight));
    }
    if (enemyEvadeEnabled) {
      parts.push(CardFilterView.rangeText(t`Evade`, enemyEvade));
    }

    if (parts.length === 0) {
      return t`Enemies: All`;
    }
    const searchParts = parts.join(', ');
    return t`Enemies: ${searchParts}`;
  }


  render() {
    const {
      componentId,
      width,
      defaultFilterState,
      filters: {
        uses,
        factions,
        traits,
        types,
        subTypes,
        packs,
        encounters,
        illustrators,
        resources,
        resourceEnabled,
        cost,
        costEnabled,
        unique,
      },
      onToggleChange,
      onFilterChange,
      fontScale,
    } = this.props;
    const {
      loading,
      allUses,
      allFactions,
      allTraits,
      allTypes,
      allTypeCodes,
      allSubTypes,
      allPacks,
      allEncounters,
      allIllustrators,
      hasCost,
      hasResource,
    } = this.state;

    if (loading) {
      return (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator
            style={[{ height: 80 }]}
            size="small"
            animating
          />
        </View>
      );
    }

    return (
      <ScrollView>
        <FactionChooser
          factions={allFactions}
          selection={factions}
          onFilterChange={onFilterChange}
        />
        <View>
          { (types.length > 0 || allTypes.length > 0) && (
            <FilterChooserButton
              componentId={componentId}
              fontScale={fontScale}
              title={t`Types`}
              values={allTypes}
              selection={types}
              setting="types"
              onFilterChange={onFilterChange}
            />
          ) }
          { (subTypes.length > 0 || allSubTypes.length > 0) && (
            <FilterChooserButton
              componentId={componentId}
              fontScale={fontScale}
              title={t`SubTypes`}
              values={allSubTypes}
              selection={subTypes}
              setting="subTypes"
              onFilterChange={onFilterChange}
            />
          ) }
        </View>
        { hasCost && (
          <SliderChooser
            label={t`Cost`}
            fontScale={fontScale}
            width={width}
            values={cost}
            enabled={costEnabled}
            setting="cost"
            onFilterChange={onFilterChange}
            toggleName="costEnabled"
            onToggleChange={onToggleChange}
            max={defaultFilterState.cost[1]}
          />
        ) }
        { hasResource && (
          <ResourceChooser
            fontScale={fontScale}
            resources={resources}
            onFilterChange={onFilterChange}
            enabled={resourceEnabled}
            onToggleChange={onToggleChange}
          />
        ) }
        <View>
          { (traits.length > 0 || allTraits.length > 0) && (
            <FilterChooserButton
              fontScale={fontScale}
              title={t`Traits`}
              componentId={componentId}
              values={allTraits}
              selection={traits}
              setting="traits"
              onFilterChange={onFilterChange}
            />
          ) }
          { indexOf(allTypeCodes, 'enemy') !== -1 && (
            <NavButton
              fontScale={fontScale}
              text={this.enemyFilterText()}
              onPress={this._onEnemyPress}
            />
          ) }
        </View>
        { (uses.length > 0 || allUses.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            fontScale={fontScale}
            title={t`Uses`}
            values={allUses}
            selection={uses}
            setting="uses"
            onFilterChange={onFilterChange}
          />
        ) }
        <View style={styles.toggleStack}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleColumn}>
              <ToggleFilter
                label={t`Unique`}
                setting="unique"
                value={unique}
                onChange={onToggleChange}
              />
            </View>
          </View>
        </View>
        { (encounters.length > 0 || allEncounters.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            fontScale={fontScale}
            title={t`Encounter Sets`}
            values={allEncounters}
            selection={encounters}
            setting="encounters"
            onFilterChange={onFilterChange}
          />
        ) }
        { (packs.length > 0 || allPacks.length > 1) && (
          <NavButton
            text={this.selectedPacksText()}
            fontScale={fontScale}
            onPress={this._onPacksPress}
          />
        ) }
        { (illustrators.length > 0 || allIllustrators.length > 0) && (
          <FilterChooserButton
            componentId={componentId}
            fontScale={fontScale}
            title={t`Illustrators`}
            values={allIllustrators}
            selection={illustrators}
            setting="illustrators"
            onFilterChange={onFilterChange}
          />
        ) }
      </ScrollView>
    );
  }
}


function mapStateToProps(state: AppState): ReduxProps {
  return {
    allPacks: getAllPacks(state),
  };
}

export default connect(mapStateToProps)(
  withFilterFunctions(CardFilterView, t`Filters`)
);

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleStack: {
    borderBottomWidth: 1,
    borderColor: '#bdbdbd',
    paddingBottom: 8,
  },
  toggleRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  toggleColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
});
