import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CachedImage } from 'react-native-cached-image';
import { Navigation } from 'react-native-navigation';

import { CardImageProps } from '../CardImageView';
import { createFactionIcons, FACTION_COLORS } from '../../constants';
import Card from '../../data/Card';
import { isBig } from '../../styles/space';

const FACTION_ICONS = createFactionIcons('#FFF');
const SCALE_FACTOR = isBig ? 1.2 : 1.0;

interface Props {
  componentId?: string;
  card: Card;
}

export default class PlayerCardImage extends React.Component<Props> {
  _onPress = () => {
    const {
      componentId,
      card,
    } = this.props;
    if (componentId) {
      Navigation.push<CardImageProps>(componentId, {
        component: {
          name: 'Card.Image',
          passProps: {
            id: card.code,
          },
          options: {
            bottomTabs: {
              visible: false,
              drawBehind: true,
              animate: true,
            },
          },
        },
      });
    }
  };

  imageStyle() {
    const {
      card,
    } = this.props;
    switch (card.type_code) {
      case 'minion':
        return styles.minionImage;
      case 'attachment':
        return styles.attachmentImage;
      case 'hero':
        return styles.heroImage;
      case 'side_scheme':
        return styles.sideSchemeImage;
      case 'main_scheme':
        return styles.mainSchemeImage;
      default:
        return {};
    }
  }

  renderPlaceholder() {
    const {
      card,
    } = this.props;

    const faction_icon = card.faction2_code ?
      FACTION_ICONS.dual :
      FACTION_ICONS[card.factionCode()];
    if (faction_icon) {
      return (
        <View style={[
          styles.placeholder,
          { backgroundColor: card.faction2_code ?
            FACTION_COLORS.dual :
            FACTION_COLORS[card.factionCode()],
          },
        ]}>
          <Text style={styles.placeholderIcon}>
            { faction_icon(55) }
          </Text>
        </View>
      );
    }
    return null;
  }

  renderContent() {
    const {
      card,
    } = this.props;
    const filename = (card.type_code === 'main_scheme' && card.double_sided) ?
      card.backimagesrc :
      card.imagesrc;

    const horizontal = card.type_code === 'main_scheme' ||
      card.type_code === 'side_scheme';

    if (isBig && !horizontal) {
      return (
        <View style={styles.verticalContainer}>
          <CachedImage
            style={styles.verticalContainer}
            source={{
              uri: `https://marvelcdb.com${filename}`,
            }}
            resizeMode="contain"
            loadingIndicator={null}
          />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        { this.renderPlaceholder() }
        <View style={styles.container}>
          <CachedImage
            style={[styles.image, this.imageStyle()]}
            source={{
              uri: `https://marvelcdb.com${filename}`,
            }}
            resizeMode="contain"
            loadingIndicator={null}
          />
        </View>
      </View>
    );
  }

  render() {
    const {
      card,
      componentId,
    } = this.props;
    if (!card.imagesrc) {
      return (
        <View style={styles.container}>
          { this.renderPlaceholder() }
        </View>
      );
    }

    if (componentId) {
      return (
        <TouchableOpacity onPress={this._onPress}>
          { this.renderContent() }
        </TouchableOpacity>
      );
    }
    return this.renderContent();
  }
}

const styles = StyleSheet.create({
  verticalContainer: {
    width: 215,
    height: 300,
  },
  container: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 6,
    width: 90 * SCALE_FACTOR,
    height: 90 * SCALE_FACTOR,
  },
  image: {
    position: 'absolute',
    top: -14 * SCALE_FACTOR,
    left: -18 * SCALE_FACTOR,
    width: 142 * 1.1 * SCALE_FACTOR,
    height: 198 * 1.1 * SCALE_FACTOR,
  },
  minionImage: {
    position: 'absolute',
    top: -16 * SCALE_FACTOR,
    left: -18 * SCALE_FACTOR,
    width: 142 * 1.2 * SCALE_FACTOR,
    height: 198 * 1.2 * SCALE_FACTOR,
  },
  attachmentImage: {
    position: 'absolute',
    top: 0,
    left: -18 * SCALE_FACTOR,
    width: 142 * 1.1 * SCALE_FACTOR,
    height: 198 * 1.1 * SCALE_FACTOR,
  },
  heroImage: {
    top: -14 * SCALE_FACTOR,
    left: -18 * SCALE_FACTOR,
    width: 142 * 1.1 * SCALE_FACTOR,
    height: 198 * 1.1 * SCALE_FACTOR,
  },
  sideSchemeImage: {
    top: -20 * SCALE_FACTOR,
    left: 0,
    height: 136 * 1.35 * SCALE_FACTOR,
    width: 166 * 1.35 * SCALE_FACTOR,
  },
  mainSchemeImage: {
    top: -17 * SCALE_FACTOR,
    left: -65 * SCALE_FACTOR,
    height: 136 * 1.35 * SCALE_FACTOR,
    width: 166 * 1.35 * SCALE_FACTOR,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 90 * SCALE_FACTOR,
    height: 90 * SCALE_FACTOR,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    textAlign: 'center',
  },
});
