import React from 'react';
import { head } from 'lodash';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckProblem, DeckProblemType } from '../actions/types';
import { t } from 'ttag';
import AppIcon from '../assets/AppIcon';
import typography, { SMALL_FONT_SIZE } from '../styles/typography';

const DECK_PROBLEM_MESSAGES: { [error in DeckProblemType]: string } = {
  aspect: t`Aspect not selected`,
  too_few_cards: t`Not enough cards.`,
  too_many_cards: t`Too many cards.`,
  too_many_copies: t`Too many copies of a card with the same name.`,
  invalid_cards: t`Contains cards from wrong aspect.`,
  deck_options_limit: t`Contains too many limited cards.`,
  hero: t`Doesn't comply with the Investigator requirements.`,
};

interface Props {
  problem: DeckProblem;
  color: string;
  noFontScaling?: boolean;
  fontSize?: number;
  fontScale: number;
}
export default function DeckProblemRow({
  problem,
  color,
  noFontScaling,
  fontSize,
  fontScale,
}: Props) {

  return (
    <View style={styles.problemRow}>
      <View style={styles.warningIcon}>
        <AppIcon
          name="warning"
          size={SMALL_FONT_SIZE * (noFontScaling ? 1 : fontScale)}
          color={color}
        />
      </View>
      <Text
        style={[
          typography.small,
          { color },
          { fontSize: fontSize || SMALL_FONT_SIZE },
          styles.problemText,
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
        allowFontScaling={!noFontScaling}
      >
        { head(problem.problems) || DECK_PROBLEM_MESSAGES[problem.reason] }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  problemText: {
    flex: 1,
  },
  problemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  warningIcon: {
    marginRight: 4,
  },
});
