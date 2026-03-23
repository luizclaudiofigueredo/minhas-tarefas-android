import { Feather, Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AtelierBackground,
  BottomNavigation,
  BrandHeader,
  FilterPill,
  SectionHeading,
} from '@/components/atelier-ui';
import { apiRequest } from '@/lib/api';
import { formatDateDisplay, formatDurationDisplay, formatStatus, statusPalette } from '@/lib/task-ui';
import { useAuth } from '@/providers/auth-provider';

type TrackedCard = {
  id: number;
  title: string;
  work_status: string;
  spent_text: string;
  estimated_text: string;
  remaining_text: string;
  last_synced_at: string;
};

type SyncPayload = {
  tracked_card: TrackedCard | null;
  message: string;
};

export default function TasksScreen() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TrackedCard[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const loadTasks = useCallback(async () => {
    if (!token) return;
    await apiRequest<SyncPayload>('/tracked_cards/sync', { method: 'POST', token });
    const response = await apiRequest<TrackedCard[]>('/tracked_cards', { token });
    setTasks(response);
  }, [token]);

  useEffect(() => {
    loadTasks().catch((error) => {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar tarefas.');
    });
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => task.work_status === 'in_progress');
    if (filter === 'paused') return tasks.filter((task) => task.work_status === 'paused');
    return tasks;
  }, [tasks, filter]);

  return (
    <AtelierBackground>
      <View style={styles.screen}>
        <BrandHeader compact />
        <Text style={styles.title}>Tarefas</Text>
        <Text style={styles.subtitle}>Acompanhe tudo o que está em produção no seu ateliê.</Text>

        <View style={styles.filters}>
          <FilterPill label="Todas" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label="Ativas" active={filter === 'active'} onPress={() => setFilter('active')} />
          <FilterPill label="Pausadas" active={filter === 'paused'} onPress={() => setFilter('paused')} />
        </View>

        <SectionHeading title="Sua fila" />

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const palette = statusPalette(item.work_status);

            return (
              <Link href={`/task/${item.id}`} asChild>
                <Pressable style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.badgeText, { color: palette.fg }]}>{formatStatus(item.work_status)}</Text>
                    </View>
                    <Feather name="more-vertical" size={18} color="#6a5140" />
                  </View>
                  <Text style={styles.cardCategory}>Workspace</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.timerRow}>
                      <Ionicons name="time-outline" size={15} color="#6a4b30" />
                      <Text style={styles.timerText}>{formatDurationDisplay(item.spent_text)}</Text>
                    </View>
                    <View style={[styles.iconAction, { backgroundColor: palette.accent }]}>
                      <Ionicons
                        name={item.work_status === 'paused' ? 'play' : 'pause'}
                        size={20}
                        color="#fffaf2"
                      />
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>Atualizado em {formatDateDisplay(item.last_synced_at)}</Text>
                </Pressable>
              </Link>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa sincronizada ainda.</Text>}
        />
      </View>
      <BottomNavigation />
    </AtelierBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 28, paddingHorizontal: 22, paddingBottom: 110, gap: 18 },
  title: { fontSize: 38, fontWeight: '800', color: '#1c1612' },
  subtitle: { marginTop: -10, fontSize: 16, color: '#5d4b3f' },
  filters: { flexDirection: 'row', gap: 10 },
  list: { gap: 16, paddingBottom: 20 },
  card: {
    backgroundColor: 'rgba(255, 250, 242, 0.94)',
    borderRadius: 28,
    padding: 22,
    gap: 14,
    shadowColor: '#9a8369',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  cardCategory: { color: '#ccbfb3', textTransform: 'uppercase', fontSize: 13 },
  cardTitle: { color: '#1f1712', fontWeight: '800', fontSize: 30, lineHeight: 34 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerText: { color: '#5c4431', fontSize: 17 },
  iconAction: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { color: '#8a7b71', fontSize: 13 },
  empty: { color: '#8a7b71', marginTop: 20 },
});
