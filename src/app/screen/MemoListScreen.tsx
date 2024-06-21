import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CircleButton from '../components/CircleButton';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

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

  const deleteRecord = async (index: number) => {
    const updatedRecords = allPlayRecords.filter((_, i) => i !== index);
    setAllPlayRecords(updatedRecords);
    await AsyncStorage.setItem('@all_play_records', JSON.stringify(updatedRecords));
  };

  const confirmDeleteRecord = (index: number) => {
    Alert.alert(
      '削除確認',
      '本当にこのプレイ記録を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteRecord(index),
        },
      ],
      { cancelable: true }
    );
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

  const renderCommunityCards = (cards: string[]) => {
    const cardElements = cards.concat(new Array(5 - cards.length).fill('')).map((card, index) => (
      <View key={index} style={styles.card}>
        <Text style={styles.cardText}>{card}</Text>
      </View>
    ));
    return <View style={styles.cardContainer}>{cardElements}</View>;
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, index: number) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => confirmDeleteRecord(index)}>
        <View style={styles.deleteButton}>
          <Animated.Text style={[styles.deleteButtonText, { transform: [{ scale }] }]}>
            Delete
          </Animated.Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }: { item: PlayRecord, index: number }) => {
    const communityCards = item.river.communityCards;
    const date = new Date().toLocaleDateString();

    return (
      <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, index)}>
        <TouchableOpacity
          style={styles.memoItem}
          onPress={() => router.push({ pathname: '/screen/DetailMemoScreen', params: { recordId: index } })}
        >
          {renderCommunityCards(communityCards)}
          <Text style={styles.date}>{date}</Text>
        </TouchableOpacity>
      </Swipeable>
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
  memoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MemoListScreen;
