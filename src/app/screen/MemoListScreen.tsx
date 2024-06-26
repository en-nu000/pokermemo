import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CircleButton from '../components/CircleButton';
import { useRouter } from 'expo-router';

interface PlayRecord {
  preflop: PhaseData;
  flop: PhaseData;
  turn: PhaseData;
  river: PhaseData;
}

interface PhaseData {
  actions: Action[];
  communityCards: string[];
}

interface Action {
  position: string;
  stack: string;
  hand: string;
  action: string;
  actionAmount: string;
  potAmount: string;
}

const MemoListScreen: React.FC = () => {
  const [allPlayRecords, setAllPlayRecords] = useState<PlayRecord[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadAllPlayRecords().catch(e => console.error(e));
  }, []);

  const loadAllPlayRecords = async (): Promise<void> => {
    try {
      const jsonValue = await AsyncStorage.getItem('@all_play_records');
      if (jsonValue != null) {
        setAllPlayRecords(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePress = async (): Promise<void> => {
    await AsyncStorage.setItem('@play_records', JSON.stringify({
      preflop: { actions: [], communityCards: [] },
      flop: { actions: [], communityCards: [] },
      turn: { actions: [], communityCards: [] },
      river: { actions: [], communityCards: [] },
    }));
    await router.push('/screen/AddMemoListScreen');
  };

  const deleteRecord = async (index: number): Promise<void> => {
    const updatedRecords = allPlayRecords.filter((_, i) => i !== index);
    setAllPlayRecords(updatedRecords);
    await AsyncStorage.setItem('@all_play_records', JSON.stringify(updatedRecords));
  };

  const confirmDeleteRecord = (index: number): void => {
    Alert.alert(
      '削除確認',
      'この記録を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', onPress: () => deleteRecord(index), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  const renderCommunityCards = (cards: string[]) => {
    const cardElements = cards.concat(new Array(5 - cards.length).fill('')).map((card, index) => (
      <View key={index} style={styles.card}>
        <Text style={styles.cardText}>{card}</Text>
      </View>
    ));
    return <View style={styles.cardContainer}>{cardElements}</View>;
  };

  const renderItem = ({ item, index }: { item: PlayRecord, index: number }) => {
    const communityCards = item.river.communityCards;
    const date = new Date().toLocaleDateString();

    return (
      <View style={styles.memoItemContainer}>
        <TouchableOpacity
          style={styles.memoItem}
          onPress={() => router.push({ pathname: '/screen/DetailMemoScreen', params: { recordId: index } })}
        >
          {renderCommunityCards(communityCards)}
          <Text style={styles.date}>{date}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDeleteRecord(index)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>保存されたプレイ記録</Text>
      <FlatList
        data={allPlayRecords}
        renderItem={renderItem}
        keyExtractor={(item, index) => `memo-${index}`}
      />
      <CircleButton onPress={handlePress}>+</CircleButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    color: '#fff',
  },
  memoItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  memoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardContainer: {
    flexDirection: 'row',
  },
  card: {
    width: 30,
    height: 40,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  cardText: {
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  deleteButton: {
    marginLeft: 10,
    padding: 10,
  },
  deleteButtonText: {
    fontSize: 20,
    color: 'red',
  },
});

export default MemoListScreen;
