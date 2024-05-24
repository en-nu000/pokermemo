import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';

const suits = ["♡", "♢", "♤", "♧"];
const values = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

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
          <Text>Select Cards</Text>
          <View style={styles.cardGrid}>
            {suits.map((suit) =>
              values.map((value) => {
                const card = `${value}${suit}`;
                return (
                  <TouchableOpacity
                    key={card}
                    style={[styles.card, selectedCards.includes(card) && styles.selectedCard]}
                    onPress={() => toggleCardSelection(card)}
                  >
                    <Text>{card}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <Button title="Save" onPress={saveSelectedCards} />
          <Button title="Cancel" onPress={closeModal} />
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  card: {
    width: '22%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
});

export default CardSelectorModal;
