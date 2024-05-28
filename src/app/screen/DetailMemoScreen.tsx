import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import CircleButton from '../components/CircleButton'; // CircleButtonのインポート

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

type DetailMemoScreenRouteProp = RouteProp<{ params: { recordId: number } }, 'params'>;

const DetailMemoScreen: React.FC = () => {
  const route = useRoute<DetailMemoScreenRouteProp>();
  const router = useRouter();
  const { recordId } = route.params; // MemoListScreenから渡されたrecordIdを受け取る
  const [playRecord, setPlayRecord] = useState<PlayRecord | null>(null);

  useEffect(() => {
    loadPlayRecord();
  }, []);

  const loadPlayRecord = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@all_play_records');
      if (jsonValue != null) {
        const allRecords: PlayRecord[] = JSON.parse(jsonValue);
        const record = allRecords[recordId];
        setPlayRecord(record);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!playRecord) {
    return <Text>Loading...</Text>;
  }

  const renderActionItem = ({ item }: { item: Action }) => (
    <View style={styles.actionItem}>
      <Text>Position: {item.position}</Text>
      <Text>Stack: {item.stack}</Text>
      <Text>Hand: {item.hand}</Text>
      <Text>Action: {item.action}</Text>
      <Text>Action Amount: {item.actionAmount}</Text>
      <Text>Pot Amount: {item.potAmount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'<'}</Text>
      </TouchableOpacity>
      <FlatList
        data={['preflop', 'flop', 'turn', 'river']}
        renderItem={({ item: phase }) => (
          <View key={phase} style={styles.section}>
            <Text style={styles.subHeader}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text>
            {phase !== 'preflop' && (
              <FlatList
                data={playRecord[phase as Phase].communityCards}
                renderItem={({ item }) => <Text>{item}</Text>}
                keyExtractor={(item, index) => `${phase}-community-${index}`}
                horizontal
              />
            )}
            <FlatList
              data={playRecord[phase as Phase].actions}
              renderItem={renderActionItem}
              keyExtractor={(item, index) => `${phase}-action-${index}`}
            />
          </View>
        )}
        keyExtractor={(item) => item}
        ListFooterComponent={
          <>
            <Button title="Back" onPress={() => router.back()} />
          </>
        }
      />
      <CircleButton onPress={async () => await router.push({ pathname: '/screen/EditMemoScreen', params: { recordId } })}>
        ✎
      </CircleButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 30,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginTop:60,
  },
  subHeader: {
    fontSize: 20,
    marginBottom: 10,
  },
  actionItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default DetailMemoScreen;
