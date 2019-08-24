import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import { bindActionCreators, Dispatch, Action } from 'redux';
import { connect } from 'react-redux';

import { t } from 'ttag';
import { Pack } from '../actions/types';
import { setInCollection } from '../actions';
import PackListComponent from './PackListComponent';
import { getAllPacks, getPacksInCollection, AppState } from '../reducers';
import { NavigationProps } from './types';

interface ReduxProps {
  packs: Pack[];
  in_collection: { [pack_code: string]: boolean };
}

interface ReduxActionProps {
  setInCollection: (code: string, value: boolean) => void;
}
type Props = NavigationProps & ReduxProps & ReduxActionProps;

class CollectionEditView extends React.Component<Props> {
  static get options() {
    return {
      topBar: {
        title: {
          text: t`Edit Collection`,
        },
      },
    };
  }

  render() {
    const {
      componentId,
      packs,
      in_collection,
      setInCollection,
    } = this.props;
    if (!packs.length) {
      return (
        <View>
          <Text>Loading</Text>
        </View>
      );
    }
    return (
      <PackListComponent
        coreSetName={t`Second Core Set`}
        componentId={componentId}
        packs={packs}
        checkState={in_collection}
        setChecked={setInCollection}
      />
    );
  }
}

function mapStateToProps(state: AppState) {
  return {
    packs: getAllPacks(state),
    in_collection: getPacksInCollection(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
  return bindActionCreators({
    setInCollection,
  }, dispatch);
}

export default connect<ReduxProps, ReduxActionProps, NavigationProps, AppState>(
  mapStateToProps,
  mapDispatchToProps
)(CollectionEditView);
