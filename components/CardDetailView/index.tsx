import React from 'react';
import { head } from 'lodash';
import {
  Linking,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Realm from 'realm';
import { Navigation, EventSubscription } from 'react-native-navigation';
import { connectRealm, CardResults } from 'react-native-realm';
import { connect } from 'react-redux';
import { t } from 'ttag';

import CardDetailComponent from './CardDetailComponent';
import withDimensions, { DimensionsProps } from '../core/withDimensions';
import { InvestigatorCardsProps } from '../InvestigatorCardsView';
import { CardFaqProps } from '../CardFaqView';
import { NavigationProps } from '../types';
import { iconsMap } from '../../app/NavIcons';
import { COLORS } from '../../styles/colors';
import { getShowSpoilers, AppState } from '../../reducers';
import Card from '../../data/Card';

export function rightButtonsForCard(card?: Card, color?: string) {
  const rightButtons = [{
    icon: iconsMap.web,
    id: 'share',
    color: color || COLORS.navButton,
    testID: t`Share`,
  }, {
    icon: iconsMap.faq,
    id: 'faq',
    color: color || COLORS.navButton,
    testID: t`FAQ`,
  }];
  return rightButtons;
}

interface RealmProps {
  card?: Card;
}

interface ReduxProps {
  showSpoilers: boolean;
}

export interface CardDetailProps {
  id: string;
  pack_code: string;
  showSpoilers?: boolean;
}

type Props = NavigationProps & DimensionsProps & CardDetailProps & ReduxProps & RealmProps;

interface State {
  showSpoilers: boolean;
}

class CardDetailView extends React.Component<Props, State> {
  static get options() {
    return {
      topBar: {
        backButton: {
          title: t`Back`,
        },
      },
    };
  }

  _navEventListener?: EventSubscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      showSpoilers: props.showSpoilers || false,
    };

    Navigation.mergeOptions(props.componentId, {
      topBar: {
        rightButtons: rightButtonsForCard(props.card),
      },
    });
    this._navEventListener = Navigation.events().bindComponent(this);
  }

  componentWillUnmount() {
    this._navEventListener && this._navEventListener.remove();
  }

  navigationButtonPressed({ buttonId }: { buttonId: string }) {
    const {
      componentId,
      id,
    } = this.props;
    if (buttonId === 'share') {
      Linking.openURL(`https://marvelcdb.com/card/${id}#reviews-header`);
    } else if (buttonId === 'faq') {
      this._showFaq();
    } else if (buttonId === 'back') {
      Navigation.pop(componentId);
    }
  }

  _showFaq = () => {
    const {
      componentId,
      card,
    } = this.props;
    if (card) {
      Navigation.push<CardFaqProps>(componentId, {
        component: {
          name: 'Card.Faq',
          passProps: {
            id: card.code,
          },
          options: {
            topBar: {
              title: {
                text: card.name,
              },
              subtitle: {
                text: t`FAQ`,
              },
            },
          },
        },
      });
    }
  };

  _showInvestigatorCards = () => {
    const {
      componentId,
      card,
    } = this.props;

    if (card) {
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
  };

  _toggleShowSpoilers = () => {
    this.setState({
      showSpoilers: !this.state.showSpoilers,
    });
  };

  render() {
    const {
      componentId,
      card,
      showSpoilers,
      width,
      fontScale,
    } = this.props;
    if (!card) {
      return null;
    }
    return (
      <ScrollView style={styles.wrapper}>
        <CardDetailComponent
          width={width}
          fontScale={fontScale}
          componentId={componentId}
          card={card}
          showSpoilers={showSpoilers || this.state.showSpoilers}
          toggleShowSpoilers={this._toggleShowSpoilers}
          showInvestigatorCards={this._showInvestigatorCards}
        />
      </ScrollView>
    );
  }
}

function mapStateToProps(
  state: AppState,
  props: NavigationProps & CardDetailProps
): ReduxProps {
  return {
    showSpoilers: props.showSpoilers || getShowSpoilers(state, props.pack_code),
  };
}

export default
connect<ReduxProps, {}, NavigationProps & CardDetailProps, AppState>(mapStateToProps)(
  connectRealm<NavigationProps & CardDetailProps & ReduxProps, RealmProps, Card>(
    withDimensions(CardDetailView), {
      schemas: ['Card'],
      mapToProps(
        results: CardResults<Card>,
        realm: Realm,
        props: NavigationProps & CardDetailProps & ReduxProps
      ) {
        const card = head(results.cards.filtered(`(code == '${props.id}')`));
        return {
          realm,
          card,
        };
      },
    })
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
