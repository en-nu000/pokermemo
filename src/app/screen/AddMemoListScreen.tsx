import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import CardSelectorModal from '../components/CardSelectorModal';

interface Action {
  position: string;
  stack: string;
  hand: string;
  action: string;
  actionAmount: string;
  potAmount: string;
}

interface PhaseData {
  actions: Action[];
  communityCards: string[];
}

interface PlayRecord {
  preflop: PhaseData;
  flop: PhaseData;
  turn: PhaseData;
  river: PhaseData;
}

type Phase = 'preflop' | 'flop' | 'turn' | 'river';

const positions = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
const actions = ["Fold", "Bet", "Call", "Check", "Raise", "All In"];

const AddMemoListScreen: React.FC = () => {
  const [playRecords, setPlayRecords] = useState<PlayRecord>({
    preflop: { actions: [], communityCards: [] },
    flop: { actions: [], communityCards: [] },
    turn: { actions: [], communityCards: [] },
    river: { actions: [], communityCards: [] },
  });
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPhaseForCards, setCurrentPhaseForCards] = useState<Phase | 'hand'>('preflop');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedHandInput, setSelectedHandInput] = useState<{ phase: Phase, index: number } | null>(null);
  const [pickerVisible, setPickerVisible] = useState<{ visible: boolean, type: keyof Action, phase: Phase, index: number }>({ visible: false, type: 'position', phase: 'preflop', index: 0 });
  const router = useRouter();

  useEffect(() => {
    loadPlayRecords();
  }, []);

  const loadPlayRecords = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('@play_records');
      if (jsonValue != null) {
        setPlayRecords(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const savePlayRecords = async (): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(playRecords);
      await AsyncStorage.setItem('@play_records', jsonValue);
    } catch (e) {
      console.error(e);
    }
  };

  const saveAllPlayRecords = async (): Promise<void> => {
    try {
      const allRecords = await AsyncStorage.getItem('@all_play_records');
      const parsedRecords = allRecords ? JSON.parse(allRecords) : [];
      parsedRecords.push(playRecords);
      const jsonValue = JSON.stringify(parsedRecords);
      await AsyncStorage.setItem('@all_play_records', jsonValue);
      await router.push('/screen/MemoListScreen');
    } catch (e) {
      console.error(e);
    }
  };

  const addNewAction = async (phase: Phase): Promise<void> => {
    const updatedRecords = { ...playRecords };
    updatedRecords[phase].actions.push({ position: '', stack: '', hand: '', action: '', actionAmount: '', potAmount: '' });
    setPlayRecords(updatedRecords);
    await savePlayRecords();
  };

  const updateAction = async (phase: Phase, index: number, field: keyof Action, value: string): Promise<void> => {
    const updatedRecords = { ...playRecords };
    updatedRecords[phase].actions[index][field] = value;
    setPlayRecords(updatedRecords);
    await savePlayRecords();
  };

  const removeAction = async (phase: Phase, index: number): Promise<void> => {
    const updatedRecords = { ...playRecords };
    updatedRecords[phase].actions.splice(index, 1);
    setPlayRecords(updatedRecords);
    await savePlayRecords();
  };

  const openCardSelector = (phase: Phase): void => {
    setCurrentPhaseForCards(phase);
    setSelectedCards(playRecords[phase].communityCards);
    setModalVisible(true);
  };

  const openCardSelectorForHand = (phase: Phase, index: number): void => {
    setCurrentPhaseForCards('hand');
    setSelectedHandInput({ phase, index });
    const handValue = playRecords[phase].actions[index].hand;
    setSelectedCards(handValue ? handValue.split(' ') : []);
    setModalVisible(true);
  };

  const saveSelectedCards = async (): Promise<void> => {
    const updatedRecords = { ...playRecords };
    if (currentPhaseForCards === 'hand' && selectedHandInput) {
      const { phase, index } = selectedHandInput;
      updatedRecords[phase].actions[index].hand = selectedCards.join(' ');
      setSelectedHandInput(null);
    } else if (currentPhaseForCards !== 'hand') {
      if (currentPhaseForCards === 'flop') {
        updatedRecords.flop.communityCards = [...selectedCards.slice(0, 3)];
        updatedRecords.turn.communityCards = [...selectedCards.slice(0, 4)];
        updatedRecords.river.communityCards = [...selectedCards];
      } else if (currentPhaseForCards === 'turn') {
        updatedRecords.turn.communityCards = [...selectedCards.slice(0, 4)];
        updatedRecords.river.communityCards = [...selectedCards];
      } else if (currentPhaseForCards === 'river') {
        updatedRecords.river.communityCards = [...selectedCards];
      }
    }
    setPlayRecords(updatedRecords);
    await savePlayRecords();
    setModalVisible(false);
  };

  const toggleCardSelection = (card: string): void => {
    setSelectedCards((prevSelectedCards) =>
      prevSelectedCards.includes(card)
        ? prevSelectedCards.filter((c) => c !== card)
        : [...prevSelectedCards, card]
    );
  };

  const showPicker = (type: keyof Action, phase: Phase, index: number): void => {
    setPickerVisible({ visible: true, type, phase, index });
  };

  const renderPicker = (): JSX.Element | null => {
    if (!pickerVisible.visible) return null;

    const { type, phase, index } = pickerVisible;
    const items = type === 'position' ? positions : actions;
    const selectedValue = type === 'position' ? playRecords[phase].actions[index].position : playRecords[phase].actions[index].action;

    return (
      <Modal transparent={true} visible={pickerVisible.visible} animationType="slide">
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(value) => {
                updateAction(phase, index, type, value);
                setPickerVisible({ visible: false, type: 'position', phase: 'preflop', index: 0 });
              }}
            >
              <Picker.Item label={type.charAt(0).toUpperCase() + type.slice(1)} value="" />
              {items.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
            <Button title="Cancel" onPress={() => setPickerVisible({ visible: false, type: 'position', phase: 'preflop', index: 0 })} />
          </View>
        </View>
      </Modal>
    );
  };

  const handleBackPress = async (): Promise<void> => {
    await router.back();
  };

  if (!playRecords) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={saveAllPlayRecords} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      <FlatList
        data={['preflop', 'flop', 'turn', 'river']}
        renderItem={({ item: phase }) => (
          <View key={phase} style={styles.section}>
            <Text style={styles.subHeader}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text>
            {phase !== 'preflop' && (
              <View>
                <FlatList
                  data={playRecords[phase as Phase].communityCards}
                  renderItem={({ item }) => <Text>{item}</Text>}
                  keyExtractor={(item, index) => `${phase}-community-${index}`}
                  horizontal
                />
                <Button title="+ Community Cards" onPress={() => openCardSelector(phase as Phase)} />
              </View>
            )}
            <FlatList
              data={playRecords[phase as Phase].actions}
              renderItem={({ item, index }) => (
                <View style={styles.actionForm}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => showPicker('position', phase as Phase, index)}
                  >
                    <Text>{item.position || 'Position'}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.input}
                    placeholder="Stack (BB)"
                    keyboardType="numeric"
                    value={item.stack}
                    onChangeText={async (text) => await updateAction(phase as Phase, index, 'stack', text)}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Hand"
                    value={item.hand}
                    onPressIn={() => openCardSelectorForHand(phase as Phase, index)}
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => showPicker('action', phase as Phase, index)}
                  >
                    <Text>{item.action || 'Action'}</Text>
                  </TouchableOpacity>
                  {(item.action === 'Bet' || item.action === 'Raise' || item.action === 'All In') && (
                    <TextInput
                      style={styles.input}
                      placeholder="Amount (BB)"
                      keyboardType="numeric"
                      value={item.actionAmount}
                      onChangeText={async (text) => await updateAction(phase as Phase, index, 'actionAmount', text)}
                    />
                  )}
                  <TextInput
                    style={styles.input}
                    placeholder="Pot (BB)"
                    keyboardType="numeric"
                    value={item.potAmount}
                    onChangeText={async (text) => await updateAction(phase as Phase, index, 'potAmount', text)}
                  />
                  <Button title="Remove" onPress={async () => await removeAction(phase as Phase, index)} />
                </View>
              )}
              keyExtractor={(item, index) => `${phase}-action-${index}`}
            />
            <Button title="+" onPress={() => addNewAction(phase as Phase)} />
          </View>
        )}
        keyExtractor={(item) => item}
      />
      <CardSelectorModal
        visible={modalVisible}
        selectedCards={selectedCards}
        toggleCardSelection={toggleCardSelection}
        saveSelectedCards={saveSelectedCards}
        closeModal={() => setModalVisible(false)}
      />
      {renderPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10, // iPhoneの標準メモアプリと同様の位置に調整
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
  },
  saveButton: {
    position: 'absolute',
    top: 10, // iPhoneの標準メモアプリと同様の位置に調整
    right: 30,
    zIndex: 1,
  },
  saveButtonText: {
    fontSize: 18,
    color: 'blue',
  },
  section: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginTop: 40, // 上部のボタン位置調整
  },
  subHeader: {
    fontSize: 20,
    marginBottom: 10,
  },
  actionForm: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
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

export default AddMemoListScreen;
