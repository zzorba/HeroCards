import React from 'react';
import { map } from 'lodash';
import {
  Alert,
  Platform,
  Keyboard,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import { bindActionCreators, Dispatch, Action } from 'redux';
import { connect } from 'react-redux';
import { connectRealm, CardResults } from 'react-native-realm';
import { ImageCacheManager } from 'react-native-cached-image';
import {
  SettingsCategoryHeader,
} from 'react-native-settings-components';

import { t } from 'ttag';
import withDialogs, { InjectedDialogProps } from '../core/withDialogs';
import { clearDecks } from '../../actions';
import Card from '../../data/Card';
import { AppState } from '../../reducers';
import { fetchCards } from '../cards/actions';
import SettingsItem from './SettingsItem';
import { COLORS } from '../../styles/colors';

const defaultImageCacheManager = ImageCacheManager();

interface RealmProps {
  realm: Realm;
}

interface ReduxProps {
  lang: string;
}

interface ReduxActionProps {
  fetchCards: (realm: Realm, lang: string) => void;
  clearDecks: () => void;
}

type Props = RealmProps & ReduxProps & ReduxActionProps & InjectedDialogProps;

class DiagnosticsView extends React.Component<Props> {
  _clearImageCache = () => {
    defaultImageCacheManager.clearCache({});
  };

  _clearCache = () => {
    const {
      realm,
      clearDecks,
    } = this.props;
    clearDecks();
    realm.write(() => {
      realm.delete(realm.objects('Card'));
      realm.delete(realm.objects('FaqEntry'));
    });
    this._doSyncCards();
  };

  _doSyncCards = () => {
    const {
      realm,
      lang,
      fetchCards,
    } = this.props;
    fetchCards(realm, lang);
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.list}>
          <SettingsCategoryHeader
            title={t`Backup`}
            titleStyle={Platform.OS === 'android' ? { color: COLORS.monza } : undefined}
          />
          <SettingsCategoryHeader
            title={t`Caches`}
            titleStyle={Platform.OS === 'android' ? { color: COLORS.monza } : undefined}
          />
          <SettingsItem onPress={this._clearImageCache} text={t`Clear image cache`} />
          <SettingsItem onPress={this._clearCache} text={t`Clear cache`} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

function mapStateToProps(state: AppState): ReduxProps {
  return {
    lang: state.packs.lang || 'en',
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action>): ReduxActionProps {
  return bindActionCreators({
    clearDecks,
    fetchCards,
  }, dispatch);
}

export default withDialogs(
  connectRealm<InjectedDialogProps, RealmProps, Card>(
    connect<ReduxProps, ReduxActionProps, RealmProps & InjectedDialogProps, AppState>(
      mapStateToProps,
      mapDispatchToProps
    )(DiagnosticsView),
    {
      schemas: ['Card'],
      mapToProps(
        results: CardResults<Card>,
        realm: Realm
      ): RealmProps {
        return {
          realm,
        };
      },
    },
  )
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    backgroundColor: Platform.OS === 'ios' ? COLORS.iosSettingsBackground : COLORS.white,
  },
});
