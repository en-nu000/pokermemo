import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import CardSelectorModal from '../components/CardSelectorModal';
import { Picker } from '@react-native-picker/picker';

interface Action {
  position: string;
  stack: number;
  hand: string;
  action: string;
  actionAmount: number;
  potAmount: number;
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

const positions = ["SB", "BB", "UTG", "EP2", "MP1", "MP2", "MP3", "LP1", "LP2", "BTN"];
const actions = ["Fold", "Bet", "Call", "Check", "Raise", "All In"];

const EditMemoScreen: React.FC = () => {
  const route = useRoute<EditMemoScreenRouteProp>();
  const router = useRouter();
  const navigation = useNavigation();
  const { recordId } = route.params as { recordId: number };
  const [playRecord, setPlayRecord] = useState<PlayRecord | null>(null);
  const [originalPlayRecord, setOriginalPlayRecord] = useState<PlayRecord | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentPhaseForCards, setCurrentPhaseForCards] = useState<Phase | 'hand'>('preflop');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedHandInput, setSelectedHandInput] = useState<{ phase: Phase, index: number } | null>(null);
  const [pickerVisible, setPickerVisible] = useState<{ visible: boolean, type: keyof Action, phase: Phase, index: number }>({ visible: false, type: 'position', phase: 'preflop', index: 0 });

  useEffect(() => {
    loadPlayRecord().catch(e => console.error(e));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Save" onPress={savePlayRecord} color="blue" />
      ),
    });
  }, [navigation, playRecord]);

  async function loadPlayRecord(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem('@all_play_records');
      if (jsonValue != null) {
        const allRecords: PlayRecord[] = JSON.parse(jsonValue);
        const record = allRecords[recordId];
        setPlayRecord(record);
        setOriginalPlayRecord(record);
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function savePlayRecord(): Promise<void> {
    if (playRecord) {
      try {
        const allRecords = await AsyncStorage.getItem('@all_play_records');
        const parsedRecords = allRecords ? JSON.parse(allRecords) : [];
        parsedRecords[recordId] = playRecord;
        const jsonValue = JSON.stringify(parsedRecords);
        await AsyncStorage.setItem('@all_play_records', jsonValue);
        router.replace('/screen/MemoListScreen'); // 保存後にMemoListScreenに遷移
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
      const updatedRecord: PlayRecord = { ...playRecord };
      updatedRecord[phase].actions.push({ position: '', stack: 0, hand: '', action: '', actionAmount: 0, potAmount: 0 });
      setPlayRecord(updatedRecord);
    }
  };

  const updateAction = async (phase: Phase, index: number, field: keyof Action, value: string | number): Promise<void> => {
    if (playRecord) {
      const updatedRecord: PlayRecord = { ...playRecord };
      updatedRecord[phase].actions[index][field] = value as never;
      setPlayRecord(updatedRecord);
    }
  };

  const removeAction = async (phase: Phase, index: number): Promise<void> => {
    if (playRecord) {
      const updatedRecord: PlayRecord = { ...playRecord };
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
      const updatedRecord: PlayRecord = { ...playRecord };
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
                await updateAction(phase, index, type, value);
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

  const renderPositionSelector = (phase: Phase, index: number): JSX.Element => {
    return (
      <View style={styles.positionContainer}>
        {positions.map((position) => (
          <TouchableOpacity
            key={position}
            style={[
              styles.selectorButton,
              playRecord?.[phase].actions[index].position === position && styles.selectedButton
            ]}
            onPress={async () => await updateAction(phase, index, 'position', position)}
          >
            <Text style={styles.selectorText}>{position}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStackAdjuster = (phase: Phase, index: number): JSX.Element => {
    const changes = [-100, -50, -10, 10, 50, 100];
    const value = playRecord?.[phase].actions[index].stack || 0;
    return (
      <View>
        <View style={styles.adjusterContainer}>
          {changes.map((change) => {
            const displayValue = change > 0 ? `+${change}` : `${change}`;
            return (
              <TouchableOpacity
                key={change}
                style={styles.adjusterButton}
                onPress={() => handleStackChange(phase, index, change)}
              >
                <Text style={styles.adjusterText}>{displayValue}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.adjusterValue}>{value} BB (Stack)</Text>
      </View>
    );
  };

  const renderActionAmountAdjuster = (phase: Phase, index: number): JSX.Element => {
    const changes = [-10, -5, -3, -1, -0.5, 0.5, 1, 3, 5, 10];
    const value = playRecord?.[phase].actions[index].actionAmount || 0;
    return (
      <View>
        <View style={styles.adjusterContainer}>
          {changes.map((change) => {
            const displayValue = change > 0 ? `+${change}` : `${change}`;
            return (
              <TouchableOpacity
                key={change}
                style={styles.adjusterButton}
                onPress={() => handleActionAmountChange(phase, index, change)}
              >
                <Text style={styles.adjusterText}>{displayValue}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.adjusterValue}>{value} BB (Action Amount)</Text>
      </View>
    );
  };

  const renderPotAdjuster = (phase: Phase, index: number): JSX.Element => {
    const changes = [-10, -5, -3, -1, -0.5, 0.5, 1, 3, 5, 10];
    const value = playRecord?.[phase].actions[index].potAmount || 0;
    return (
      <View>
        <View style={styles.adjusterContainer}>
          {changes.map((change) => {
            const displayValue = change > 0 ? `+${change}` : `${change}`;
            return (
              <TouchableOpacity
                key={change}
                style={styles.adjusterButton}
                onPress={() => handlePotChange(phase, index, change)}
              >
                <Text style={styles.adjusterText}>{displayValue}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.adjusterValue}>{value} BB (Pot)</Text>
      </View>
    );
  };

  const renderActionSelector = (phase: Phase, index: number): JSX.Element => {
    return (
      <View style={styles.actionContainer}>
        {actions.map((action, actionIndex) => (
          <TouchableOpacity
            key={action}
            style={[
              styles.selectorButton,
              playRecord?.[phase].actions[index].action === action && styles.selectedButton,
              actionIndex % 2 !== 0 && styles.secondColumnButton
            ]}
            onPress={async () => await updateAction(phase, index, 'action', action)}
          >
            <Text style={styles.selectorText}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleStackChange = (phase: Phase, index: number, change: number): void => {
    if (playRecord) {
      const updatedRecord: PlayRecord = { ...playRecord };
      const newStack = Math.max(0, updatedRecord[phase].actions[index].stack + change);
      updatedRecord[phase].actions[index].stack = newStack;
      setPlayRecord(updatedRecord);
    }
  };

  const handleActionAmountChange = (phase: Phase, index: number, change: number): void => {
    if (playRecord) {
      const updatedRecord: PlayRecord = { ...playRecord };
      const newActionAmount = Math.max(0, updatedRecord[phase].actions[index].actionAmount + change);
      updatedRecord[phase].actions[index].actionAmount = newActionAmount;
      setPlayRecord(updatedRecord);
    }
  };

  const handlePotChange = (phase: Phase, index: number, change: number): void => {
    if (playRecord) {
      const updatedRecord: PlayRecord = { ...playRecord };
      const newPot = Math.max(0, updatedRecord[phase].actions[index].potAmount + change);
      updatedRecord[phase].actions[index].potAmount = newPot;
      setPlayRecord(updatedRecord);
    }
  };

  const isBetAction = (action: string): boolean => {
    return action === 'Bet' || action === 'Raise' || action === 'All In';
  };

  if (!playRecord) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={['preflop', 'flop', 'turn', 'river']}
        renderItem={({ item: phase }) => (
          <View key={phase} style={styles.section}>
            <Text style={styles.subHeader}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text>
            {phase !== 'preflop' && (
              <View>
                <FlatList
                  data={playRecord[phase as Phase].communityCards}
                  renderItem={({ item }) => <Text style={styles.communityCard}>{item}</Text>}
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
                  {renderPositionSelector(phase as Phase, index)}
                  {renderStackAdjuster(phase as Phase, index)}
                  {renderPotAdjuster(phase as Phase, index)}
                  <TextInput
                    style={styles.input}
                    placeholder="Hand"
                    value={item.hand}
                    onPressIn={() => openCardSelectorForHand(phase as Phase, index)}
                    editable={false}
                    placeholderTextColor="white"
                  />
                  {renderActionSelector(phase as Phase, index)}
                  {isBetAction(item.action) && (
                    <>
                      {renderActionAmountAdjuster(phase as Phase, index)}
                    </>
                  )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  section: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    top: 30,
  },
  subHeader: {
    fontSize: 20,
    marginBottom: 10,
    color: '#fff',
  },
  actionForm: {
    backgroundColor: '#1c1c1e',
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
    color: '#fff',
    backgroundColor: '#333',
  },
  positionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 13,
    margin: 2,
    borderRadius: 5,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondColumnButton: {
    marginLeft: 2,
  },
  selectedButton: {
    backgroundColor: '#467FD3',
  },
  selectorText: {
    color: '#fff',
    fontSize: 10,
  },
  communityCard: {
    fontSize: 18,
    color: '#fff',
    marginRight: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adjusterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  adjusterButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#467FD3',
    marginHorizontal: 2,
  },
  adjusterText: {
    color: '#fff',
    fontSize: 12,
  },
  adjusterValue: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
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
});

export default EditMemoScreen;
