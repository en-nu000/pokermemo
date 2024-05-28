import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
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
    loadAllPlayRecords();
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
    await router.push('/screen/AddMemoListScreen'); // ここに await を追加
  };

  const renderItem = ({ item, index }: { item: PlayRecord, index: number }) => {
    const communityCards = item.river.communityCards.join(' ');
    const date = new Date().toLocaleDateString(); // 現在の日付を使用。必要に応じて適切な日付に変更。

    return (
      <TouchableOpacity
        style={styles.memoItem}
        onPress={() => router.push({ pathname: '/screen/DetailMemoScreen', params: { recordId: index } })}
      >
        <Text style={styles.communityCards}>{communityCards}</Text>
        <Text style={styles.date}>{date}</Text>
      </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
  },
  memoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  communityCards: {
    fontSize: 18,
    fontFamily: 'Courier',
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
});

export default MemoListScreen;
