import React from 'react';
import { flatMap, keys, map, range } from 'lodash';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/dist/MaterialCommunityIcons';
import { msgid, ngettext } from 'ttag';

import { DeckMeta, ParsedDeck } from '../../actions/types';
import AppIcon from '../../assets/AppIcon';
import DeckProblemRow from '../DeckProblemRow';
import { CardsMap } from '../../data/Card';
import typography from '../../styles/typography';
import { TINY_PHONE } from '../../styles/sizes';
import { COLORS } from '../../styles/colors';
import DeckValidation from '../../lib/DeckValidation';
import { showCardCharts, showDrawSimulator } from '../navHelper';
import { FOOTER_HEIGHT } from './constants';
import { deckColor } from '../../constants';

const SHOW_CHARTS_BUTTON = true;

interface Props {
  componentId: string;
  parsedDeck: ParsedDeck;
  cards: CardsMap;
  meta: DeckMeta;
  controls?: React.ReactNode;
  fontScale: number;
}

export default class DeckNavFooter extends React.Component<Props> {
  _showCardCharts = () => {
    const {
      componentId,
      parsedDeck,
    } = this.props;
    showCardCharts(componentId, parsedDeck);
  };

  _showCardSimulator = () => {
    const {
      componentId,
      parsedDeck,
    } = this.props;
    showDrawSimulator(componentId, parsedDeck);
  };

  renderProblem() {
    const {
      cards,
      parsedDeck: {
        slots,
        ignoreDeckLimitSlots,
        investigator,
      },
      meta,
      fontScale,
    } = this.props;

    const validator = new DeckValidation(investigator, meta);
    const problem = validator.getProblem(flatMap(keys(slots), code => {
      const card = cards[code];
      if (!card) {
        return [];
      }
      return map(
        range(0, Math.max(0, slots[code] - (ignoreDeckLimitSlots[code] || 0))),
        () => card
      );
    }));

    if (!problem) {
      return null;
    }

    return (
      <DeckProblemRow
        problem={problem}
        color="#FFFFFF"
        noFontScaling
        fontScale={fontScale}
      />
    );
  }

  renderControls() {
    const {
      controls,
    } = this.props;
    if (controls) {
      return controls;
    }
    return (
      <React.Fragment>
        { SHOW_CHARTS_BUTTON && (
          <TouchableOpacity onPress={this._showCardCharts}>
            <View style={styles.button}>
              <MaterialCommunityIcons name="chart-bar" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) }
        <TouchableOpacity onPress={this._showCardSimulator}>
          <View style={styles.button}>
            <AppIcon name="cards" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </React.Fragment>
    );
  }

  render() {
    const {
      parsedDeck: {
        normalCardCount,
        totalCardCount,
      },
      meta,
    } = this.props;
    const cardCountString = ngettext(
      msgid`${normalCardCount} Card (${totalCardCount} Total)`,
      `${normalCardCount} Cards (${totalCardCount} Total)`,
      normalCardCount
    );
    return (
      <View style={styles.borderWrapper}>
        <View style={[styles.wrapper, { backgroundColor: deckColor(meta) }]}>
          <View style={styles.left}>
            <View style={styles.row}>
              <Text style={[
                TINY_PHONE ? typography.small : typography.text,
                styles.whiteText,
              ]} allowFontScaling={false}>
                { cardCountString }
              </Text>
            </View>
            <View style={styles.row}>
              { this.renderProblem() }
            </View>
          </View>
          <View style={styles.right}>
            { this.renderControls() }
          </View>
        </View>
      </View>
    );
  }
}

const BUTTON_SIZE = 44;
const styles = StyleSheet.create({
  borderWrapper: {
    width: '100%',
    height: FOOTER_HEIGHT,
    borderTopWidth: 1,
    borderColor: COLORS.white,
  },
  wrapper: {
    width: '100%',
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingLeft: 8,
    paddingRight: 4,
  },
  left: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  button: {
    padding: 4,
    width: BUTTON_SIZE,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
