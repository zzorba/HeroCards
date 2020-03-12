import React from 'react';
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';

import typography from '../styles/typography';

export default class AboutView extends React.Component {
  render() {
    return (
      <ScrollView style={styles.container}>
        <Text style={typography.text}>
          The information presented in this app about Marvel Champions: The Card
          Game, both literal and graphical, is copyrighted by Fantasy Flight
          Games. This app is not produced, endorsed, supported, or affiliated
          with Fantasy Flight Games.
          { '\n\n' }
          This application was created by Daniel Salinas as a fan project to
          help support the Marvel Champions: The Card Game community. Additional
          development by Joshua Payne. If you find yourself managing lots of
          decks, I'm hoping it proves useful.
          { '\n\n' }
          Feedback and bug reports are welcome by email at arkhamcards@gmail.com
          or via Twitter @ArkhamCards
          { '\n\n' }
          Many thanks to marvelcdb.com for providing the structured data, API
          access and access to card images. Without their continued support, this
          project would not have been possible.
          { '\n\n' }
        </Text>
        <Text style={typography.small}>
          <Text style={typography.bold}>Icon Attribution:</Text>
          { '\n' }
          • 'deck of cards' icon by Daniel Solis from the Noun Project.
          { '\n' }
          • 'FAQ' icon by Gregor Cresnar from the Noun Project.
          { '\n' }
          • 'Cards' icon by Dmitriy Ivanov from the Noun Project.
          { '\n' }
          • 'flip over' icon by Nathan Smith from the Noun Project.
          { '\n' }
          • 'books' icon by Mr Balind from the Noun Project.
          { '\n' }
          • 'speech' icon by Natalia from the Noun Project
        </Text>
        <View style={styles.footer} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  footer: {
    height: 100,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});
