import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { AtelierBackground, BottomNavigation, BrandHeader, SectionHeading } from '@/components/atelier-ui';
import { apiRequest } from '@/lib/api';
import { formatDateDisplay } from '@/lib/task-ui';
import { useAuth } from '@/providers/auth-provider';

type UsageLog = {
  id: number;
  action: string;
  details: string;
  occurred_at: string;
};

export default function LogsScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<UsageLog[]>([]);

  const loadLogs = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<UsageLog[]>('/usage_logs?limit=50', { token });
    setLogs(response);
  }, [token]);

  useEffect(() => {
    loadLogs().catch((error) => {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar logs.');
    });
  }, [loadLogs]);

  return (
    <AtelierBackground>
      <FlatList
        style={styles.page}
        contentContainerStyle={styles.list}
        data={logs}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <BrandHeader compact />
            <Text style={styles.title}>Logs</Text>
            <Text style={styles.subtitle}>Histórico operacional da automação e das suas intervenções manuais.</Text>
            <SectionHeading title="Linha do tempo" />
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <View style={[styles.iconShell, index % 3 === 0 ? styles.iconWarm : index % 3 === 1 ? styles.iconNeutral : styles.iconGreen]}>
              <Ionicons
                name={index % 3 === 1 ? 'archive-outline' : index % 3 === 2 ? 'terminal-outline' : 'checkmark-done-outline'}
                size={22}
                color={index % 3 === 2 ? '#e8fff8' : '#6f5a4a'}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.itemTitle}>{item.details}</Text>
              <Text style={styles.itemMeta}>{item.action.toUpperCase()} • {formatDateDisplay(item.occurred_at)}</Text>
            </View>
          </View>
        )}
      />
      <BottomNavigation />
    </AtelierBackground>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  header: { gap: 12, marginBottom: 10 },
  title: { color: '#1b1511', fontSize: 40, fontWeight: '800' },
  subtitle: { color: '#5d4b3f', fontSize: 17, lineHeight: 24 },
  item: { backgroundColor: 'rgba(255,250,242,0.94)', borderRadius: 24, padding: 18, flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconShell: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconWarm: { backgroundColor: '#f8dbd1' },
  iconNeutral: { backgroundColor: '#ece7e1' },
  iconGreen: { backgroundColor: '#086c61' },
  body: { flex: 1, gap: 6 },
  itemTitle: { color: '#1e1611', fontSize: 17, fontWeight: '700' },
  itemMeta: { color: '#716156', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.1 },
});
