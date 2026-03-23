import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AtelierBackground,
  BottomNavigation,
  BrandHeader,
  FilterPill,
  FloatingAddButton,
  SearchField,
  SectionHeading,
} from '@/components/atelier-ui';
import { apiRequest } from '@/lib/api';
import { formatDurationDisplay, formatStatus, statusPalette } from '@/lib/task-ui';
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

type DashboardPayload = {
  active_card: TrackedCard | null;
  usage_logs: UsageLog[];
  monthly_total: {
    enabled: boolean;
    hours_label: string;
    receivable_label: string;
    total_text: string;
    receivable_text: string;
    cards_count: number;
    field_source: 'spent' | 'validated';
  };
  stats: {
    settings_count: number;
    tracked_cards_count: number;
    total_logged_actions: number;
  };
};

type SyncPayload = {
  tracked_card: TrackedCard | null;
  message: string;
};

export default function HomeScreen() {
  const { ready, token, user, signIn } = useAuth();
  const [email, setEmail] = useState('admin@minhastarefas.local');
  const [password, setPassword] = useState('12345678');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [tasks, setTasks] = useState<TrackedCard[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await apiRequest<SyncPayload>('/tracked_cards/sync', { method: 'POST', token });
      const [dashboardPayload, tasksPayload] = await Promise.all([
        apiRequest<DashboardPayload>('/dashboard', { token }),
        apiRequest<TrackedCard[]>('/tracked_cards', { token }),
      ]);
      setDashboard(dashboardPayload);
      setTasks(tasksPayload);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Nao foi possivel carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token, loadDashboard]);

  const visibleTasks = useMemo(() => {
    const term = query.toLowerCase().trim();
    return tasks.filter((task) => {
      const matchesQuery = !term || task.title.toLowerCase().includes(term);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && task.work_status === 'in_progress') ||
        (filter === 'paused' && task.work_status === 'paused');
      return matchesQuery && matchesFilter;
    });
  }, [tasks, query, filter]);

  async function handleLogin() {
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Login falhou', error instanceof Error ? error.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickSync() {
    if (!token) return;

    setLoading(true);
    try {
      const syncResponse = await apiRequest<SyncPayload>('/tracked_cards/sync', { method: 'POST', token });
      await loadDashboard();
      Alert.alert('Sincronizacao', syncResponse.message);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao sincronizar tarefas.');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <AtelierBackground>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6b4b2f" />
        </View>
      </AtelierBackground>
    );
  }

  if (!token || !user) {
    return (
      <AtelierBackground>
        <ScrollView contentContainerStyle={styles.authPage}>
          <View style={styles.logoBox}>
            <MaterialIcons name="architecture" size={34} color="#fffaf2" />
          </View>
          <Text style={styles.authBrand}>The Atelier</Text>
          <Text style={styles.authSubtitle}>Welcome back to your curated workspace.</Text>

          <View style={styles.authCard}>
            <Text style={styles.formLabel}>Email address</Text>
            <View style={styles.inputShell}>
              <Ionicons name="mail" size={22} color="#9a9086" />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.authInput}
                value={email}
                onChangeText={setEmail}
                placeholder="name@atelier.com"
                placeholderTextColor="#b6ada4"
              />
            </View>

            <View style={styles.passwordRow}>
              <Text style={styles.formLabel}>Password</Text>
              <Text style={styles.linkText}>Forgot password</Text>
            </View>
            <View style={styles.inputShell}>
              <Ionicons name="lock-closed" size={22} color="#9a9086" />
              <TextInput
                secureTextEntry
                style={styles.authInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#b6ada4"
              />
            </View>

            <Pressable style={styles.loginButton} onPress={handleLogin} disabled={submitting}>
              <Text style={styles.loginButtonText}>{submitting ? 'Entrando...' : 'Entrar'}</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <View style={styles.socialButton}>
                <Text style={styles.socialText}>Google</Text>
              </View>
              <View style={styles.socialButton}>
                <Text style={styles.socialText}>Apple</Text>
              </View>
            </View>
          </View>

          <Text style={styles.createAccount}>New to the platform? <Text style={styles.createAccountStrong}>Create an account</Text></Text>
        </ScrollView>
      </AtelierBackground>
    );
  }

  return (
    <AtelierBackground>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor="#6b4b2f" />}>
        <BrandHeader />

        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>Bem-vindo ao seu ateliê de produtividade.</Text>
        </View>

        <SearchField value={query} onChangeText={setQuery} placeholder="Buscar tarefas ou registros..." />

        <View style={styles.filtersRow}>
          <FilterPill label="Filtros" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterPill label="Ativos" active={filter === 'active'} onPress={() => setFilter('active')} />
          <FilterPill label="Pausados" active={filter === 'paused'} onPress={() => setFilter('paused')} />
        </View>

        <SectionHeading title="Ativos agora" actionLabel="Ver todos" href="/tasks" />

        <View style={styles.tasksColumn}>
          {visibleTasks.slice(0, 2).map((task) => {
            const palette = statusPalette(task.work_status);
            const isPaused = task.work_status === 'paused';

            return (
              <Link href={`/task/${task.id}`} key={task.id} asChild>
                <Pressable style={styles.taskCard}>
                  <View style={styles.taskHead}>
                    <View style={[styles.taskStatus, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.taskStatusText, { color: palette.fg }]}>{formatStatus(task.work_status)}</Text>
                    </View>
                    <Feather name="more-vertical" size={18} color="#6a5140" />
                  </View>
                  <Text style={styles.taskSection}>Infraestrutura</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskFooter}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time" size={14} color="#604833" />
                      <Text style={styles.timeText}>{formatDurationDisplay(task.spent_text)}</Text>
                    </View>
                    <View style={[styles.playButton, { backgroundColor: isPaused ? '#046c60' : '#6b4b2f' }]}>
                      <Ionicons name={isPaused ? 'play' : 'pause'} size={20} color="#fffaf2" />
                    </View>
                  </View>
                </Pressable>
              </Link>
            );
          })}
          {!visibleTasks.length ? <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text> : null}
        </View>

        <SectionHeading title="Logs recentes" href="/logs" />

        <View style={styles.logList}>
          {(dashboard?.usage_logs ?? []).slice(0, 3).map((log, index) => (
            <View key={log.id} style={styles.logCard}>
              <View style={[styles.logIcon, index === 0 ? styles.logIconSoft : index === 2 ? styles.logIconGreen : undefined]}>
                <Ionicons
                  name={index === 1 ? 'archive-outline' : index === 2 ? 'terminal-outline' : 'checkmark-done-outline'}
                  size={20}
                  color={index === 2 ? '#e8fff8' : '#6f5a4a'}
                />
              </View>
              <View style={styles.logBody}>
                <Text style={styles.logTitle}>{log.details}</Text>
                <Text style={styles.logSubtitle}>{log.action.toUpperCase()}</Text>
              </View>
              <Text style={styles.logDuration}>+{index + 1}h {index === 0 ? '20m' : index === 1 ? '05m' : '00m'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{dashboard?.monthly_total?.hours_label ?? 'Total de Horas no Mes'}</Text>
            <Text style={styles.statValue}>{formatDurationDisplay(dashboard?.monthly_total?.total_text) ?? '00:00'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{dashboard?.monthly_total?.receivable_label ?? 'Valor a Receber'}</Text>
            <Text style={[styles.statValue, styles.statValueAccent]}>
              {dashboard?.monthly_total?.receivable_text ?? 'R$ 0,00'}
            </Text>
          </View>
        </View>
      </ScrollView>
      <FloatingAddButton onPress={handleQuickSync} />
      <BottomNavigation />
    </AtelierBackground>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  authPage: { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 28, alignItems: 'center' },
  logoBox: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: '#765638',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7a5737',
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 5,
  },
  authBrand: { marginTop: 34, fontSize: 42, fontWeight: '800', color: '#5b3d25' },
  authSubtitle: { marginTop: 10, marginBottom: 34, color: '#4a4039', fontSize: 19, textAlign: 'center' },
  authCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 38,
    padding: 24,
    gap: 18,
    shadowColor: '#d9cbb9',
    shadowOpacity: 0.38,
    shadowOffset: { width: 0, height: 22 },
    shadowRadius: 36,
    elevation: 8,
  },
  formLabel: { color: '#4b3525', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.8, fontSize: 14 },
  inputShell: {
    backgroundColor: '#f7f5f2',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  authInput: { flex: 1, fontSize: 18, color: '#4d3c31' },
  passwordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: '#5b3d25', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3 },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#765638',
    borderRadius: 22,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#765638',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 22,
    elevation: 5,
  },
  loginButtonText: { color: '#fffaf2', fontWeight: '800', fontSize: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e6ddd4' },
  dividerText: { color: '#b2a79b', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  socialButton: { flex: 1, borderRadius: 18, backgroundColor: '#f1ece6', paddingVertical: 18, alignItems: 'center' },
  socialText: { color: '#231913', fontSize: 16, fontWeight: '700' },
  createAccount: { marginTop: 34, color: '#49392d', fontSize: 16 },
  createAccountStrong: { fontWeight: '800', color: '#5b3d25' },
  page: { paddingTop: 24, paddingHorizontal: 22, paddingBottom: 128, gap: 20 },
  titleBlock: { gap: 4 },
  pageTitle: { fontSize: 46, fontWeight: '800', color: '#181311' },
  pageSubtitle: { color: '#493a31', fontSize: 18 },
  filtersRow: { flexDirection: 'row', gap: 10 },
  tasksColumn: { gap: 14 },
  taskCard: {
    backgroundColor: 'rgba(255, 250, 242, 0.92)',
    borderRadius: 30,
    padding: 20,
    gap: 14,
    shadowColor: '#ccb49a',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  taskHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskStatus: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  taskStatusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.1 },
  taskSection: { color: '#d8cdc0', textTransform: 'uppercase', fontSize: 12 },
  taskTitle: { color: '#1c1510', fontWeight: '800', fontSize: 23, lineHeight: 28 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  timeText: { color: '#5e4532', fontSize: 17 },
  playButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#8c7d73', paddingVertical: 18 },
  logList: { gap: 14 },
  logCard: {
    backgroundColor: 'rgba(255, 250, 242, 0.92)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  logIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#ece7e1', alignItems: 'center', justifyContent: 'center' },
  logIconSoft: { backgroundColor: '#f8dbd1' },
  logIconGreen: { backgroundColor: '#086c61' },
  logBody: { flex: 1, gap: 4 },
  logTitle: { color: '#211915', fontSize: 16, fontWeight: '700' },
  logSubtitle: { color: '#6c5d53', fontSize: 12, letterSpacing: 0.5 },
  logDuration: { color: '#5b3d25', fontSize: 16, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 14 },
  statCard: { flex: 1, borderRadius: 24, backgroundColor: 'rgba(255, 250, 242, 0.92)', padding: 20, gap: 10 },
  statLabel: { color: '#5b4739', textTransform: 'uppercase', letterSpacing: 1.8, fontSize: 12 },
  statValue: { color: '#5a3d26', fontSize: 34, fontWeight: '800' },
  statValueAccent: { color: '#086c61' },
});
