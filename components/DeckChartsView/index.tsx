import React from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';

import { ParsedDeck } from '../../actions/types';
import FactionChart from './FactionChart';
import CostChart from './CostChart';
import ResourceIconChart from './ResourceIconChart';

export interface DeckChartsProps {
  parsedDeck?: ParsedDeck;
}

export default class DeckChartsView extends React.Component<DeckChartsProps> {
  render() {
    const {
      parsedDeck,
    } = this.props;
    if (!parsedDeck) {
      return null;
    }
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ResourceIconChart parsedDeck={parsedDeck} />
        <CostChart parsedDeck={parsedDeck} />
        <FactionChart parsedDeck={parsedDeck} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 64,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'column',
  },
});
