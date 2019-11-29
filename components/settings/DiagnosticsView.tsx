import React from 'react';
import { forEach } from 'lodash';
import {
  Platform,
  Keyboard,
  SafeAreaView,
  ScrollView,
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
import { Pack } from '../../actions/types';
import withDialogs, { InjectedDialogProps } from '../core/withDialogs';
import { clearDecks } from '../../actions';
import Card from '../../data/Card';
import { getAllPacks, AppState } from '../../reducers';
import { fetchCards } from '../cards/actions';
import SettingsItem from './SettingsItem';
import { COLORS } from '../../styles/colors';

const defaultImageCacheManager = ImageCacheManager();

interface RealmProps {
  realm: Realm;
}

interface ReduxProps {
  packs: Pack[];
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

  addDebugCardJson(json: string) {
    const {
      realm,
      packs,
      lang,
    } = this.props;
    const packsByCode: { [code: string]: Pack } = {};
    forEach(packs, pack => {
      packsByCode[pack.code] = pack;
    });
    realm.write(() => {
      realm.create(
        'Card',
        Card.fromJson(JSON.parse(json), packsByCode, lang),
        true
      );
    });
  }

  _addDebugCard = () => {
    const {
      showTextEditDialog,
    } = this.props;
    showTextEditDialog(
      t`Debug Card Json`,
      '',
      (json) => {
        Keyboard.dismiss();
        setTimeout(() => this.addDebugCardJson(json), 1000);
      },
      false,
      4
    );
  };

  renderDebugSection() {
    if (!__DEV__) {
      return null;
    }
    return (
      <React.Fragment>
        <SettingsCategoryHeader
          title={t`Debug`}
          titleStyle={Platform.OS === 'android' ? { color: COLORS.monza } : undefined}
        />
        <SettingsItem onPress={this._addDebugCard} text={t`Add Debug Card`} />

      </React.Fragment>
    );
  }

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
          { this.renderDebugSection() }
        </ScrollView>
      </SafeAreaView>
    );
  }
}

function mapStateToProps(state: AppState): ReduxProps {
  return {
    packs: getAllPacks(state),
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
