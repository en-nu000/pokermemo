import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Button, ScrollView } from 'react-native';

const suits: Array<'♡' | '♢' | '♤' | '♧'> = ["♡", "♢", "♤", "♧"];
const values = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

const CardColors: { [key in '♡' | '♢' | '♤' | '♧']: string } = {
  "♡": '#ff0000',
  "♢": '#0000ff',
  "♤": '#808080',
  "♧": '#00a000',
};
//'#00a000'#808080 ff0000
interface CardSelectorModalProps {
  visible: boolean;
  selectedCards: string[];
  toggleCardSelection: (card: string) => void;
  saveSelectedCards: () => void;
  closeModal: () => void;
}

const CardSelectorModal: React.FC<CardSelectorModalProps> = ({ visible, selectedCards, toggleCardSelection, saveSelectedCards, closeModal }) => {
  return (
    <Modal visible={visible} transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.cardGrid}>
            {suits.map((suit) => (
              <View key={suit} style={styles.suitRow}>
                {values.map((value) => {
                  const card = `${value}${suit}`;
                  return (
                    <TouchableOpacity
                      key={card}
                      style={[
                        styles.card,
                        { backgroundColor: CardColors[suit] },
                        selectedCards.includes(card) && styles.selectedCard
                      ]}
                      onPress={() => toggleCardSelection(card)}
                    >
                      <Text style={styles.cardText}>{card}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonContainer}>
            <Button title="保存" onPress={saveSelectedCards} />
            <Button title="戻る" onPress={closeModal} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    maxHeight: '70%',
  },
  cardGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitRow: {
    flexDirection: 'row',
    marginVertical: 2,
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    width: 26,
    height: 35,
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  selectedCard: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  cardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default CardSelectorModal;
