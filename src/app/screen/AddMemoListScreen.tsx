import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useNavigation } from 'expo-router';
import CardSelectorModal from '../components/CardSelectorModal';

interface Action {
  position: string;
  stack: number;
  hand: string;
  action: string;
  actionAmount: string;
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

const positions = ["SB", "BB", "UTG", "EP2", "MP1", "MP2", "MP3", "LP1", "LP2", "BTN"];
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
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    loadPlayRecords().catch(e => console.error(e));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Save" onPress={saveAllPlayRecords} color="blue" />
      ),
    });
  }, [navigation, playRecords]);

  async function loadPlayRecords(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem('@play_records');
      if (jsonValue != null) {
        setPlayRecords(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function savePlayRecords(): Promise<void> {
    try {
      const jsonValue = JSON.stringify(playRecords);
      await AsyncStorage.setItem('@play_records', jsonValue);
    } catch (e) {
      console.error(e);
    }
  };

  async function saveAllPlayRecords(): Promise<void> {
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
    updatedRecords[phase].actions.push({ position: '', stack: 0, hand: '', action: '', actionAmount: '', potAmount: 0 });
    setPlayRecords(updatedRecords);
    await savePlayRecords();
  };

  const updateAction = async (phase: Phase, index: number, field: keyof Action, value: string | number): Promise<void> => {
    const updatedRecords = { ...playRecords };
    updatedRecords[phase].actions[index][field] = value as never;
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

  const renderPositionSelector = (phase: Phase, index: number): JSX.Element => {
    return (
      <View style={styles.positionContainer}>
        {positions.map((position) => (
          <TouchableOpacity
            key={position}
            style={[
              styles.selectorButton,
              playRecords[phase].actions[index].position === position && styles.selectedButton
            ]}
            onPress={async () => await updateAction(phase, index, 'position', position)}
          >
            <Text style={styles.selectorText}>{position}</Text>
          </TouchableOpacity>
        ))}
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
              playRecords[phase].actions[index].action === action && styles.selectedButton,
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
    const updatedRecords = { ...playRecords };
    const newStack = Math.max(0, updatedRecords[phase].actions[index].stack + change);
    updatedRecords[phase].actions[index].stack = newStack;
    setPlayRecords(updatedRecords);
    savePlayRecords();
  };

  const handlePotChange = (phase: Phase, index: number, change: number): void => {
    const updatedRecords = { ...playRecords };
    const newPot = Math.max(0, updatedRecords[phase].actions[index].potAmount + change);
    updatedRecords[phase].actions[index].potAmount = newPot;
    setPlayRecords(updatedRecords);
    savePlayRecords();
  };

  const renderAdjuster = (phase: Phase, index: number, field: 'stack' | 'potAmount'): JSX.Element => {
    const changes = [-10, -5, -3, -1, -0.5, 0.5, 1, 3, 5, 10];
    const value = field === 'stack' ? playRecords[phase].actions[index].stack : playRecords[phase].actions[index].potAmount;
    return (
      <View>
        <View style={styles.adjusterContainer}>
          {changes.map((change) => {
            const displayValue = change > 0 ? `+${change}` : `${change}`;
            return (
              <TouchableOpacity
                key={change}
                style={styles.adjusterButton}
                onPress={() => {
                  if (field === 'stack') {
                    handleStackChange(phase, index, change);
                  } else {
                    handlePotChange(phase, index, change);
                  }
                }}
              >
                <Text style={styles.adjusterText}>{displayValue}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.adjusterValue}>{value} BB(POT)</Text>
      </View>
    );
  };

  const handleBackPress = async (): Promise<void> => {
    await router.back();
  };

  const isBetAction = (action: string): boolean => {
    return action === 'Bet' || action === 'Raise' || action === 'All In';
  };

  if (!playRecords) {
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
                  data={playRecords[phase as Phase].communityCards}
                  renderItem={({ item }) => <Text style={styles.communityCard}>{item}</Text>}
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
                  {renderPositionSelector(phase as Phase, index)}
                  {renderAdjuster(phase as Phase, index, 'stack')}
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
                      {renderAdjuster(phase as Phase, index, 'potAmount')}
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
});

export default AddMemoListScreen;
