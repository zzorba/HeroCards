import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import { t } from 'ttag';
import AccordionItem from '../AccordionItem';
import ToggleFilter from '../../core/ToggleFilter';
import { ResourceFilters } from '../../../lib/filters';

interface Props {
  onFilterChange: (setting: string, value: any) => void;
  resources: ResourceFilters;
  enabled: boolean;
  onToggleChange: (setting: string, value: boolean) => void;
  fontScale: number;
}

export default class ResourceChooser extends React.Component<Props> {
  _onToggleChange = (key: string) => {
    const {
      onFilterChange,
      resources,
    } = this.props;

    onFilterChange('resources', {
      ...resources,
      [key]: !resources[key as keyof ResourceFilters],
    });
  };

  render() {
    const {
      resources: {
        physical,
        mental,
        energy,
        wild,
        doubleIcons,
      },
      enabled,
      onToggleChange,
      fontScale,
    } = this.props;
    return (
      <AccordionItem
        label={enabled ? t`Resources` : t`Resources: All`}
        fontScale={fontScale}
        height={90}
        enabled={enabled}
        toggleName="resourceEnabled"
        onToggleChange={onToggleChange}
      >
        <View style={styles.toggleRow}>
          <ToggleFilter
            icon="physical"
            setting="physical"
            value={physical}
            onChange={this._onToggleChange}
          />
          <ToggleFilter
            icon="mental"
            setting="mental"
            value={mental}
            onChange={this._onToggleChange}
          />
          <ToggleFilter
            label="2+"
            setting="doubleIcons"
            value={doubleIcons}
            onChange={this._onToggleChange}
          />
        </View>
        <View style={styles.toggleRow}>
          <ToggleFilter
            icon="energy"
            setting="energy"
            value={energy}
            onChange={this._onToggleChange}
          />
          <ToggleFilter
            icon="wild"
            setting="wild"
            value={wild}
            onChange={this._onToggleChange}
          />
        </View>
      </AccordionItem>
    );
  }
}


const styles = StyleSheet.create({
  toggleRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
});
