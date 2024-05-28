import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import CircleButton from '../components/CircleButton';
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

type EditMemoScreenRouteProp = RouteProp<{ params: { recordId: number } }, 'params'>;

const positions = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
const actions = ["Fold", "Bet", "Call", "Check", "Raise", "All In"];

const EditMemoScreen: React.FC = () => {
  const route = useRoute<EditMemoScreenRouteProp>();
  const router = useRouter();
  const { recordId } = route.params as { recordId: number };
  const [playRecord, setPlayRecord] = useState<PlayRecord | null>(null);
  const [originalPlayRecord, setOriginalPlayRecord] = useState<PlayRecord | null>(null); // 元のプレイレコードを保存
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPhaseForCards, setCurrentPhaseForCards] = useState<Phase | 'hand'>('preflop');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedHandInput, setSelectedHandInput] = useState<{ phase: Phase, index: number } | null>(null);
  const [pickerVisible, setPickerVisible] = useState<{ visible: boolean, type: keyof Action, phase: Phase, index: number }>({ visible: false, type: 'position', phase: 'preflop', index: 0 });

  useEffect(() => {
    loadPlayRecord();
  }, []);

  const loadPlayRecord = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('@all_play_records');
      if (jsonValue != null) {
        const allRecords: PlayRecord[] = JSON.parse(jsonValue);
        const record = allRecords[recordId];
        setPlayRecord(record);
        setOriginalPlayRecord(record); // 元のプレイレコードを保存
      }
    } catch (e) {
      console.error(e);
    }
  };

  const savePlayRecord = async (): Promise<void> => {
    if (playRecord) {
      try {
        const allRecords = await AsyncStorage.getItem('@all_play_records');
        const parsedRecords = allRecords ? JSON.parse(allRecords) : [];
        parsedRecords[recordId] = playRecord;
        const jsonValue = JSON.stringify(parsedRecords);
        await AsyncStorage.setItem('@all_play_records', jsonValue);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBackPress = async (): Promise<void> => {
    if (JSON.stringify(playRecord) !== JSON.stringify(originalPlayRecord)) {
      await savePlayRecord();
    }
    router.back();
  };

  const addNewAction = async (phase: Phase): Promise<void> => {
    if (playRecord) {
      const updatedRecord = { ...playRecord };
      updatedRecord[phase].actions.push({ position: '', stack: '', hand: '', action: '', actionAmount: '', potAmount: '' });
      setPlayRecord(updatedRecord);
    }
  };

  const updateAction = async (phase: Phase, index: number, field: keyof Action, value: string): Promise<void> => {
    if (playRecord) {
      const updatedRecord = { ...playRecord };
      updatedRecord[phase].actions[index][field] = value;
      setPlayRecord(updatedRecord);
    }
  };

  const removeAction = async (phase: Phase, index: number): Promise<void> => {
    if (playRecord) {
      const updatedRecord = { ...playRecord };
      updatedRecord[phase].actions.splice(index, 1);
      setPlayRecord(updatedRecord);
    }
  };

  const openCardSelector = (phase: Phase): void => {
    if (playRecord) {
      setCurrentPhaseForCards(phase);
      setSelectedCards(playRecord[phase].communityCards);
      setModalVisible(true);
    }
  };

  const openCardSelectorForHand = (phase: Phase, index: number): void => {
    if (playRecord) {
      setCurrentPhaseForCards('hand');
      setSelectedHandInput({ phase, index });
      const handValue = playRecord[phase].actions[index].hand;
      setSelectedCards(handValue ? handValue.split(' ') : []);
      setModalVisible(true);
    }
  };

  const saveSelectedCards = async (): Promise<void> => {
    if (playRecord) {
      const updatedRecord = { ...playRecord };
      if (currentPhaseForCards === 'hand' && selectedHandInput) {
        const { phase, index } = selectedHandInput;
        updatedRecord[phase].actions[index].hand = selectedCards.join(' ');
        setSelectedHandInput(null);
      } else if (currentPhaseForCards !== 'hand') {
        if (currentPhaseForCards === 'flop') {
          updatedRecord.flop.communityCards = [...selectedCards.slice(0, 3)];
          updatedRecord.turn.communityCards = [...selectedCards.slice(0, 4)];
          updatedRecord.river.communityCards = [...selectedCards];
        } else if (currentPhaseForCards === 'turn') {
          updatedRecord.turn.communityCards = [...selectedCards.slice(0, 4)];
          updatedRecord.river.communityCards = [...selectedCards];
        } else if (currentPhaseForCards === 'river') {
          updatedRecord.river.communityCards = [...selectedCards];
        }
      }
      setPlayRecord(updatedRecord);
      setModalVisible(false);
    }
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
    const selectedValue = type === 'position' ? playRecord?.[phase].actions[index].position : playRecord?.[phase].actions[index].action;

    return (
      <Modal transparent={true} visible={pickerVisible.visible} animationType="slide">
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={async (value) => {
                await updateAction(phase, index, type, value); // ここに await を追加
                setPickerVisible({ visible: false, type, phase, index });
              }}
            >
              <Picker.Item label={type.charAt(0).toUpperCase() + type.slice(1)} value="" />
              {items.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
            <Button title="Cancel" onPress={() => setPickerVisible({ visible: false, type, phase, index })} />
          </View>
        </View>
      </Modal>
    );
  };

  if (!playRecord) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <FlatList
        data={['preflop', 'flop', 'turn', 'river']}
        renderItem={({ item: phase }) => (
          <View key={phase} style={styles.section}>
            <Text style={styles.subHeader}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text>
            {phase !== 'preflop' && (
              <View>
                <FlatList
                  data={playRecord[phase as Phase].communityCards}
                  renderItem={({ item }) => <Text>{item}</Text>}
                  keyExtractor={(item, index) => `${phase}-community-${index}`}
                  horizontal
                />
                <Button title="+ Community Cards" onPress={() => openCardSelector(phase as Phase)} />
              </View>
            )}
            <FlatList
              data={playRecord[phase as Phase].actions}
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
    top: 20, // iPhoneの標準メモアプリと同様の位置に調整
    left: 10,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
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

export default EditMemoScreen;
