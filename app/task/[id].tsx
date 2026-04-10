import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AtelierBackground, BottomNavigation } from '@/components/atelier-ui';
import { apiRequest } from '@/lib/api';
import {
  formatDateDisplay,
  formatDurationDisplay,
  formatSecondsDisplay,
  formatStatus,
  normalizeTaskStatus,
  parseDurationToSeconds,
  statusPalette,
} from '@/lib/task-ui';
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

type UsageLog = {
  id: number;
  action: string;
  details: string;
  occurred_at: string;
};

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [task, setTask] = useState<TrackedCard | null>(null);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [pendingAction, setPendingAction] = useState<'finalize' | 'pause' | 'restart' | null>(null);
  const [liveSpentSeconds, setLiveSpentSeconds] = useState(0);

  const loadData = useCallback(async () => {
    if (!token || !id) return;
    const [taskResponse, logsResponse] = await Promise.all([
      apiRequest<TrackedCard>(`/tracked_cards/${id}`, { token }),
      apiRequest<UsageLog[]>('/usage_logs?limit=10', { token }),
    ]);
    setTask(taskResponse);
    setLogs(logsResponse.slice(0, 3));
  }, [id, token]);

  useEffect(() => {
    loadData().catch((error) => {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar a tarefa.');
    });
  }, [loadData]);

  const currentStatus = normalizeTaskStatus(task?.work_status);

  useEffect(() => {
    const baseSpentSeconds = parseDurationToSeconds(task?.spent_text);
    const syncedAt = task?.last_synced_at ? new Date(task.last_synced_at).getTime() : Number.NaN;
    const elapsedSinceSync = Number.isFinite(syncedAt) ? Math.max(0, Math.floor((Date.now() - syncedAt) / 1000)) : 0;

    setLiveSpentSeconds(currentStatus === 'in_progress' ? baseSpentSeconds + elapsedSinceSync : baseSpentSeconds);

    if (currentStatus !== 'in_progress') return;

    const timerId = setInterval(() => {
      setLiveSpentSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [currentStatus, task?.last_synced_at, task?.spent_text]);

  async function handleAction(action: 'finalize' | 'pause' | 'restart') {
    if (!token || !task || pendingAction) return;
    try {
      setPendingAction(action);
      await apiRequest(`/tracked_cards/${task.id}/${action}`, { method: 'POST', token });
      await loadData();
    } catch (error) {
      Alert.alert('Falha', error instanceof Error ? error.message : 'Nao foi possivel concluir a acao.');
    } finally {
      setPendingAction(null);
    }
  }

  const palette = statusPalette(currentStatus);
  const canPause = currentStatus === 'in_progress';
  const canRestart = currentStatus === 'paused' || currentStatus === 'finished' || currentStatus === 'sem_card';
  const canFinalize = currentStatus === 'in_progress' || currentStatus === 'paused';
  const estimatedSeconds = parseDurationToSeconds(task?.estimated_text);
  const remainingSeconds = estimatedSeconds - liveSpentSeconds;
  const remainingExceeded = remainingSeconds < 0;
  const spentDisplay = formatSecondsDisplay(liveSpentSeconds);
  const remainingDisplay = remainingExceeded
    ? `-${formatSecondsDisplay(Math.abs(remainingSeconds))}`
    : formatSecondsDisplay(remainingSeconds);

  return (
    <AtelierBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.iconGhost}>
            <Feather name="arrow-left" size={26} color="#5b3d25" />
          </Pressable>
          <Text style={styles.topTitle}>Detalhes da Tarefa</Text>
          <Ionicons name="notifications" size={22} color="#5b3d25" />
        </View>

        <Text style={styles.statusCaption}>Status atual</Text>
        <Text style={[styles.statusValue, { color: palette.accent }]}>{formatStatus(currentStatus)}</Text>
        <Text style={styles.taskName}>Tarefa: {task?.title ?? 'Carregando...'}</Text>

        <View style={styles.heroCard}>
          <Text style={styles.metricCaption}>Tempo gasto</Text>
          <Text style={styles.heroValue}>{spentDisplay}</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricCaption}>Estimado</Text>
            <Text style={styles.metricValue}>{formatDurationDisplay(task?.estimated_text)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricCaption}>Restante</Text>
            <Text style={[styles.metricValue, remainingExceeded ? styles.overrunValue : styles.remainingValue]}>{remainingDisplay}</Text>
          </View>
        </View>

        {canRestart ? (
          <Pressable
            style={[styles.primaryAction, pendingAction && styles.actionDisabled]}
            onPress={() => handleAction('restart')}
            disabled={Boolean(pendingAction)}>
            <Ionicons name="play" size={22} color="#fffaf2" />
            <Text style={styles.primaryActionText}>{pendingAction === 'restart' ? 'Retomando...' : 'Retomar Tarefa'}</Text>
          </Pressable>
        ) : null}

        {(canPause || canFinalize) ? (
          <View style={styles.secondaryActions}>
            {canPause ? (
              <Pressable
                style={[styles.secondaryAction, pendingAction && styles.actionDisabled]}
                onPress={() => handleAction('pause')}
                disabled={Boolean(pendingAction)}>
                <Ionicons name="pause" size={22} color="#2a211b" />
                <Text style={styles.secondaryActionText}>{pendingAction === 'pause' ? 'Pausando...' : 'Pausar'}</Text>
              </Pressable>
            ) : null}
            {canFinalize ? (
              <Pressable
                style={[styles.secondaryAction, styles.finishAction, pendingAction && styles.actionDisabled]}
                onPress={() => handleAction('finalize')}
                disabled={Boolean(pendingAction)}>
                <Ionicons name="checkmark-circle" size={22} color="#8f6557" />
                <Text style={[styles.secondaryActionText, styles.finishActionText]}>
                  {pendingAction === 'finalize' ? 'Finalizando...' : 'Finalizar'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>Logs Recentes</Text>
          <Text style={styles.logsAction}>Ver todos</Text>
        </View>

        <View style={styles.logsList}>
          {logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logIcon}>
                <Ionicons
                  name={log.action.includes('pause') ? 'pause' : log.action.includes('final') ? 'checkmark' : 'play'}
                  size={18}
                  color="#6b4b2f"
                />
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logTitle}>{log.details}</Text>
                <Text style={styles.logDate}>{formatDateDisplay(log.occurred_at)}</Text>
              </View>
              <Text style={styles.logTime}>{spentDisplay}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.syncedAt}>Ultima sincronizacao: {formatDateDisplay(task?.last_synced_at)}</Text>
      </ScrollView>
      <BottomNavigation />
    </AtelierBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 28, paddingHorizontal: 22, paddingBottom: 122, gap: 18 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconGhost: { width: 32 },
  topTitle: { flex: 1, color: '#50341f', fontSize: 20, fontWeight: '800' },
  statusCaption: { marginTop: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2.5, color: '#5b4739', fontSize: 14 },
  statusValue: { textAlign: 'center', fontSize: 64, lineHeight: 72, fontWeight: '800' },
  taskName: { textAlign: 'center', color: '#534136', fontSize: 18, marginTop: -10 },
  heroCard: { backgroundColor: 'rgba(255,250,242,0.92)', borderRadius: 30, padding: 28, gap: 6 },
  metricCaption: { color: '#5b4739', textTransform: 'uppercase', letterSpacing: 1.6, fontSize: 14, fontWeight: '700' },
  heroValue: { color: '#5a3d26', fontSize: 46, fontWeight: '800' },
  metricRow: { flexDirection: 'row', gap: 14 },
  metricBox: { flex: 1, backgroundColor: 'rgba(255,250,242,0.92)', borderRadius: 28, padding: 24, gap: 8 },
  metricValue: { color: '#111111', fontSize: 24, fontWeight: '800' },
  remainingValue: { color: '#0a6d62' },
  overrunValue: { color: '#c6422d' },
  primaryAction: { backgroundColor: '#6b4b2f', borderRadius: 24, paddingVertical: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  primaryActionText: { color: '#fffaf2', fontSize: 18, fontWeight: '800' },
  secondaryActions: { flexDirection: 'row', gap: 14 },
  secondaryAction: { flex: 1, backgroundColor: '#e9e5df', borderRadius: 22, paddingVertical: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  finishAction: { backgroundColor: '#f9d9cf' },
  actionDisabled: { opacity: 0.6 },
  secondaryActionText: { color: '#211915', fontSize: 16, fontWeight: '700' },
  finishActionText: { color: '#8f6557' },
  logsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  logsTitle: { fontSize: 22, fontWeight: '800', color: '#211915' },
  logsAction: { color: '#5b4739', textTransform: 'uppercase', letterSpacing: 1.5 },
  logsList: { gap: 14 },
  logCard: { backgroundColor: '#fff', borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  logIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#f0ebe4', alignItems: 'center', justifyContent: 'center' },
  logInfo: { flex: 1, gap: 4 },
  logTitle: { color: '#201813', fontSize: 16, fontWeight: '700' },
  logDate: { color: '#655245', fontSize: 13 },
  logTime: { color: '#5a3d26', fontWeight: '700' },
  syncedAt: { color: '#8b7c72', textAlign: 'center', marginTop: 6 },
});
