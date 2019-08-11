import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Results } from 'realm';
import { t } from 'ttag';
import DialogComponent from 'react-native-dialog';

import Dialog from '../core/Dialog';
import PlusMinusButtons from '../core/PlusMinusButtons';
import { COLORS } from '../../styles/colors';
import space, { m } from '../../styles/space';
import typography from '../../styles/typography';

interface Props {
  name: string;
  visible: boolean;
  viewRef?: View;
  toggleVisible: () => void;
  updateDetails: (name: string) => void;
}

interface State {
  name: string;
  saving: boolean;
}

export default class EditDeckDetailsDialog extends React.Component<Props, State> {
  state: State = {
    name: '',
    saving: false,
  };
  _textInputRef?: TextInput;

  componentDidUpdate(prevProps: Props) {
    const {
      visible,
      name,
    } = this.props;
    if (visible && !prevProps.visible) {
      /* eslint-disable react/no-did-update-set-state */
      this.setState({
        name,
      });
    }
  }

  _onDeckNameChange = (name: string) => {
    this.setState({
      name,
    });
  }

  _captureTextInputRef = (ref: TextInput) => {
    this._textInputRef = ref;
  };

  _onOkayPress = () => {
    const {
      name,
    } = this.state;
    this.props.updateDetails(name);
  }

  render() {
    const {
      toggleVisible,
      visible,
      viewRef,
    } = this.props;
    const {
      name,
    } = this.state;
    const okDisabled = !name.length;
    return (
      <Dialog
        title={t`Deck Details`}
        visible={visible}
        viewRef={viewRef}
      >
        <View style={styles.column}>
          <DialogComponent.Description style={[typography.smallLabel, space.marginTopM]}>
            { t`NAME` }
          </DialogComponent.Description>
          <DialogComponent.Input
            textInputRef={this._captureTextInputRef}
            value={name}
            onChangeText={this._onDeckNameChange}
            returnKeyType="done"
          />
        </View>
        <DialogComponent.Button
          label={t`Cancel`}
          onPress={toggleVisible}
        />
        <DialogComponent.Button
          label={t`Okay`}
          color={okDisabled ? COLORS.darkGray : COLORS.lightBlue}
          disabled={okDisabled}
          onPress={this._onOkayPress}
        />
      </Dialog>
    );
  }
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Platform.OS === 'ios' ? 28 : 8,
    paddingLeft: Platform.OS === 'ios' ? 28 : 8,
    marginBottom: m,
  },
  buttonLabel: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  label: Platform.select({
    ios: {
      fontSize: 13,
      color: 'black',
    },
    android: {
      fontSize: 16,
      color: '#33383D',
    },
  }),
});
