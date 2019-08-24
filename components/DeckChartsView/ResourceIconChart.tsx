import React from 'react';
import { map, maxBy } from 'lodash';
import { BarChart } from 'react-native-svg-charts';
import { View, Text, StyleSheet } from 'react-native';
import { t } from 'ttag';

import { ParsedDeck } from '../parseDeck';
import ArkhamIcon from '../../assets/ArkhamIcon';
import { RESOURCES, RESOURCE_COLORS, ResourceCodeType } from '../../constants';
import typography from '../../styles/typography';

interface Props {
  parsedDeck: ParsedDeck;
}

interface Item {
  resource: ResourceCodeType;
  value: number;
  svg: {
    fill: string;
  };
}

interface LabelData {
  x: (idx: number) => number;
  y: (idx: number) => number;
  bandwidth: number;
  data: Item[];
}

export default class ResourceIconChart extends React.PureComponent<Props> {
  getResourceData(resource: ResourceCodeType): Item {
    return {
      resource,
      value: this.props.parsedDeck.resourceCounts[resource] || 0,
      svg: {
        fill: RESOURCE_COLORS[resource],
      },
    };
  }

  _getValue = ({ item }: { item: Item }) => {
    return item.value;
  };

  render() {
    const barData = map(RESOURCES, resource => this.getResourceData(resource));
    const CUT_OFF = Math.min(
      4,
      (maxBy(map(barData, barData => barData.value)) || 0)
    );

    const contentInset = { top: 10, bottom: 10 };
    const Labels = ({ x, y, bandwidth, data }: LabelData) => (
      data.map((value, index) => (
        <View key={index}>
          <View style={[styles.label, {
            left: x(index),
            top: y(0) + 4,
            width: bandwidth,
          }]}>
            <ArkhamIcon
              name={value.resource}
              size={32}
              color={RESOURCE_COLORS[value.resource]}
            />
          </View>
          { value.value > 0 && (
            <Text style={[
              styles.label, {
                left: x(index),
                top: value.value < CUT_OFF ? y(value.value) - 20 : y(value.value) + 8,
                width: bandwidth,
                color: value.value >= CUT_OFF ? 'white' : 'black',
              },
              styles.count,
            ]}>
              { value.value }
            </Text>
          ) }
        </View>
      ))
    );

    return (
      <View style={styles.wrapper}>
        <Text style={[typography.bigLabel, typography.center]}>
          { t`Resources` }
        </Text>
        <View style={styles.chart}>
          <BarChart
            style={styles.barChart}
            gridMin={0}
            numberOfTicks={4}
            contentInset={contentInset}
            yAccessor={this._getValue}
            data={barData}
          >
            {
              // @ts-ignore TS2739
              <Labels />
            }
          </BarChart>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    position: 'relative',
    marginBottom: 64,
  },
  chart: {
    flexDirection: 'row',
    height: 200,
  },
  label: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  barChart: {
    flex: 1,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
