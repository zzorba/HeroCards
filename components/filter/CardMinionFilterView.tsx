import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { t } from 'ttag';

import SliderChooser from './SliderChooser';
import ToggleFilter from '../core/ToggleFilter';
import withFilterFunctions, { FilterProps } from './withFilterFunctions';
import { COLORS } from '../../styles/colors';

class CardMinionFilterView extends React.Component<FilterProps> {
  static get options() {
    return {
      topBar: {
        backButton: {
          title: t`Back`,
          color: COLORS.navButton,
        },
        title: {
          text: t`Enemy Filters`,
        },
      },
    };
  }

  renderToggles() {
    const {
      filters: {
        enemyElite,
        enemyNonElite,
        enemyRetaliate,
        enemyGuard,
        enemyQuickstrike,
        enemyTough,
      },
      onToggleChange,
    } = this.props;

    return (
      <View style={styles.toggleRow}>
        <View style={styles.toggleColumn}>
          <ToggleFilter
            label={t`Elite`}
            setting="enemyElite"
            value={enemyElite}
            onChange={onToggleChange}
          />
          <ToggleFilter
            label={t`Guard`}
            setting="enemyGuard"
            value={enemyGuard}
            onChange={onToggleChange}
          />
          <ToggleFilter
            label={t`Quickstrike`}
            setting="enemyQuickstrike"
            value={enemyQuickstrike}
            onChange={onToggleChange}
          />
        </View>
        <View style={styles.toggleColumn}>
          <ToggleFilter
            label={t`Non-Elite`}
            setting="enemyNonElite"
            value={enemyNonElite}
            onChange={onToggleChange}
          />
          <ToggleFilter
            label={t`Retaliate`}
            setting="enemyRetaliate"
            value={enemyRetaliate}
            onChange={onToggleChange}
          />
          <ToggleFilter
            label={t`Tough`}
            setting="enemyTough"
            value={enemyTough}
            onChange={onToggleChange}
          />
        </View>
      </View>
    );
  }

  render() {
    const {
      defaultFilterState,
      filters: {
        enemyHealth,
        enemyHealthEnabled,
        enemyHealthPerHero,
        enemyAttack,
        enemyAttackEnabled,
        enemyScheme,
        enemySchemeEnabled,
      },
      width,
      onToggleChange,
      onFilterChange,
      fontScale,
    } = this.props;
    return (
      <ScrollView>
        <SliderChooser
          label={t`Attack`}
          width={width}
          max={defaultFilterState.enemyAttack[1]}
          values={enemyAttack}
          setting="enemyAttack"
          onFilterChange={onFilterChange}
          enabled={enemyAttackEnabled}
          toggleName="enemyAttackEnabled"
          onToggleChange={onToggleChange}
          fontScale={fontScale}
        />
        <SliderChooser
          label={t`Scheme`}
          width={width}
          max={defaultFilterState.enemyScheme[1]}
          values={enemyScheme}
          setting="enemyScheme"
          onFilterChange={onFilterChange}
          enabled={enemySchemeEnabled}
          toggleName="enemySchemeEnabled"
          onToggleChange={onToggleChange}
          fontScale={fontScale}
        />
        <SliderChooser
          label={t`Health`}
          width={width}
          max={defaultFilterState.enemyHealth[1]}
          values={enemyHealth}
          setting="enemyHealth"
          onFilterChange={onFilterChange}
          enabled={enemyHealthEnabled}
          toggleName="enemyHealthEnabled"
          onToggleChange={onToggleChange}
          height={1}
          fontScale={fontScale}
        >
          <View>
            <ToggleFilter
              label={t`Per Investigator`}
              setting="enemyHealthPerHero"
              value={enemyHealthPerHero}
              onChange={onToggleChange}
            />
          </View>
        </SliderChooser>
        { this.renderToggles() }
      </ScrollView>
    );
  }
}

export default withFilterFunctions(
  CardMinionFilterView,
  t`Minion Filters`,
  [
    'enemyHealth',
    'enemyHealthEnabled',
    'enemyHealthPerHero',
    'enemyAttack',
    'enemyAttackEnabled',
    'enemyScheme',
    'enemySchemeEnabled',
  ]
);

const styles = StyleSheet.create({
  toggleColumn: {
    width: '50%',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  toggleRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
