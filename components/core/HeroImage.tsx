import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { showCard } from '../navHelper';
import Card from '../../data/Card';
import { isBig } from '../../styles/space';

const scaleFactor = isBig ? 1.2 : 1.0;

interface Props {
  card: Card;
  componentId?: string;
  small?: boolean;
}

export default class HeroImage extends React.Component<Props> {
  _onPress = () => {
    const {
      card,
      componentId,
    } = this.props;
    if (componentId) {
      showCard(componentId, card.code, card, true);
    }
  }

  renderImage() {
    const {
      card,
      small,
    } = this.props;
    const size = (small ? 65 : 100) * scaleFactor;
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        { !!card.imagesrc && (
          <View style={styles.relative}>
            <CachedImage
              style={small ? styles.image : styles.bigImage}
              source={{
                uri: `https://marvelcdb.com/${card.imagesrc}`,
              }}
              resizeMode="contain"
            />
          </View>
        ) }
      </View>
    );
  }

  render() {
    if (this.props.componentId) {
      return (
        <TouchableOpacity onPress={this._onPress}>
          { this.renderImage() }
        </TouchableOpacity>
      );
    }
    return this.renderImage();
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  relative: {
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: -14 * scaleFactor,
    left: -18 * scaleFactor,
    width: 142 * 1.1 * scaleFactor,
    height: 198 * 1.1 * scaleFactor,
  },
  bigImage: {
    position: 'absolute',
    top: -16 * scaleFactor,
    left: -18 * scaleFactor,
    width: 142 * 1.25 * scaleFactor,
    height: 198 * 1.25 * scaleFactor,
  },
});
