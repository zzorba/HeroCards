import React from 'react';
import { filter } from 'lodash';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Pack } from '../../actions/types';
import PackRow from './PackRow';

interface Props {
  componentId: string;
  coreSetName?: string;
  packs: Pack[];
  checkState?: { [pack_code: string]: boolean};
  setChecked: (pack_code: string, checked: boolean) => void;
  renderHeader?: () => React.ReactElement;
  renderFooter?: () => React.ReactElement;
  whiteBackground?: boolean;
  baseQuery?: string;
  compact?: boolean;
}

export default class PackListComponent extends React.Component<Props> {
  _keyExtractor = (item: Pack) => {
    return item.code;
  };

  _renderItem = ({ item }: { item: Pack }) => {
    const {
      packs,
      checkState,
      setChecked,
      whiteBackground,
      baseQuery,
      compact,
      coreSetName,
    } = this.props;
    return (
      <PackRow
        componentId={this.props.componentId}
        pack={item}
        nameOverride={item.code === 'core' ? coreSetName : undefined}
        setChecked={setChecked}
        checked={checkState && checkState[item.code]}
        whiteBackground={whiteBackground}
        baseQuery={baseQuery}
        compact={compact}
      />
    );
  };

  render() {
    const {
      packs,
      checkState,
      renderHeader,
      renderFooter,
    } = this.props;
    if (!packs.length) {
      return (
        <View>
          <Text>Loading</Text>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <FlatList
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          data={packs}
          renderItem={this._renderItem}
          keyExtractor={this._keyExtractor}
          extraData={checkState}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
