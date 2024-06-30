import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import CircleButton from '../components/CircleButton';

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
  const { recordId } = route.params;
  const [playRecord, setPlayRecord] = useState<PlayRecord | null>(null);

  useEffect(() => {
    loadPlayRecord().catch(e => console.error(e));
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
      <Text style={styles.actionText}>{item.position} {item.stack}</Text>
      <Text style={styles.actionText}>{item.hand}</Text>
      <Text style={styles.actionText}>{item.action} {item.actionAmount}</Text>
      <Text style={styles.actionText}>{item.potAmount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      <FlatList
        data={['preflop', 'flop', 'turn', 'river']}
        renderItem={({ item: phase }) => (
          <View key={phase} style={styles.section}>
            <Text style={styles.subHeader}>{phase.charAt(0).toUpperCase() + phase.slice(1)}</Text>
            {phase !== 'preflop' && (
              <FlatList
                data={playRecord[phase as Phase].communityCards}
                renderItem={({ item }) => <Text style={styles.communityCard}>{item}</Text>}
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
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
    color: '#fff',
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
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  actionText: {
    color: '#fff',
  },
  communityCard: {
    fontSize: 18,
    color: '#fff',
    marginRight: 5,
  },
});

export default DetailMemoScreen;
