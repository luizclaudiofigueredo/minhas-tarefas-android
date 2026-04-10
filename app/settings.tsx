import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AtelierBackground, BottomNavigation, BrandHeader } from '@/components/atelier-ui';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

type Setting = {
  id: number;
  client_name: string;
  start_date: string;
  end_date: string;
  value_hour: string;
  schedule_enabled: boolean;
  schedule_times: string;
};

type AutomationSettingData = {
  trello_monthly_total_list_id: string | null;
};

const initialForm = { client_name: '', start_date: '', end_date: '', value_hour: '', schedule_enabled: false, schedule_times: '' };
const monthLabels = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const weekLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDateForDisplay(value: string) {
  const date = parseIsoDate(value);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(monthCursor: Date) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leading; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function SettingsScreen() {
  const { token, user, signOut } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [dateField, setDateField] = useState<'start_date' | 'end_date' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => parseIsoDate(initialForm.start_date) ?? new Date());
  const [monthlyListId, setMonthlyListId] = useState('');
  const [savingMonthlyListId, setSavingMonthlyListId] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<Setting[]>('/settings', { token });
    setSettings(response);
  }, [token]);

  const loadAutomationSetting = useCallback(async () => {
    if (!token) return;
    const response = await apiRequest<AutomationSettingData>('/automation_setting', { token });
    setMonthlyListId(response.trello_monthly_total_list_id ?? '');
  }, [token]);

  useEffect(() => {
    loadSettings().catch((error: unknown) => {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar configuracoes.');
    });
    loadAutomationSetting().catch(() => undefined);
  }, [loadSettings, loadAutomationSetting]);

  async function handleSaveMonthlyListId() {
    if (!token || savingMonthlyListId) return;
    setSavingMonthlyListId(true);
    try {
      await apiRequest('/automation_setting', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ automation_setting: { trello_monthly_total_list_id: monthlyListId.trim() || null } }),
      });
      Alert.alert('Salvo', 'ID da lista mensal atualizado.');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao salvar.');
    } finally {
      setSavingMonthlyListId(false);
    }
  }

  async function handleSubmit() {
    if (!token) return;
    const path = editingId ? `/settings/${editingId}` : '/settings';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      await apiRequest(path, {
        method,
        token,
        body: JSON.stringify({ setting: form }),
      });
      setForm(initialForm);
      setEditingId(null);
      await loadSettings();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao salvar configuracao.');
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    try {
      await apiRequest(`/settings/${id}`, { method: 'DELETE', token });
      await loadSettings();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir configuracao.');
    }
  }

  function openDatePicker(field: 'start_date' | 'end_date') {
    const currentValue = form[field];
    setCalendarMonth(parseIsoDate(currentValue) ?? new Date());
    setDateField(field);
  }

  function handleDateSelect(date: Date) {
    if (!dateField) return;
    setForm((current) => ({ ...current, [dateField]: formatDateForApi(date) }));
    setDateField(null);
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao encerrar a sessao.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <AtelierBackground>
      <ScrollView contentContainerStyle={styles.page}>
        <BrandHeader />

        <View style={styles.profileBlock}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={52} color="#6b4b2f" />
            </View>
            <View style={styles.avatarEdit}>
              <Feather name="edit-2" size={16} color="#fffaf2" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'The Atelier'}</Text>
          <Text style={styles.role}>Head Artisan & Designer</Text>
        </View>

        <View style={styles.optionList}>
          <SettingsItem icon={<Ionicons name="person" size={24} color="#6b4b2f" />} title="Account" subtitle="Security & privacy" />
          <SettingsItem icon={<Ionicons name="notifications" size={24} color="#6b4b2f" />} title="Notifications" subtitle="Push & email alerts" />
          <View style={styles.syncCard}>
            <View style={styles.syncIcon}>
              <MaterialIcons name="sync" size={24} color="#6b4b2f" />
            </View>
            <View style={styles.syncBody}>
              <Text style={styles.optionTitle}>Sync Preferences</Text>
              <Text style={styles.optionSubtitle}>Última sincronização: hoje, 10:45 AM</Text>
            </View>
            <Switch
              value={syncEnabled}
              onValueChange={setSyncEnabled}
              thumbColor="#fffaf2"
              trackColor={{ false: '#d9d0c5', true: '#7b5836' }}
            />
          </View>
          <SettingsItem icon={<Ionicons name="color-palette" size={24} color="#6b4b2f" />} title="Appearance" subtitle="Light theme" />
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Trello — Lista do Total Mensal</Text>
          <TextInput
            style={styles.input}
            placeholder="ID da lista (TRELLO_MONTHLY_TOTAL_LIST_ID)"
            placeholderTextColor="#ab9d8f"
            value={monthlyListId}
            onChangeText={setMonthlyListId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.saveButton} onPress={handleSaveMonthlyListId} disabled={savingMonthlyListId}>
            <Text style={styles.saveButtonText}>{savingMonthlyListId ? 'Salvando...' : 'Salvar'}</Text>
          </Pressable>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configTitle}>{editingId ? 'Editar faixa de faturamento' : 'Nova faixa de faturamento'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Cliente"
            placeholderTextColor="#ab9d8f"
            value={form.client_name}
            onChangeText={(value) => setForm((current) => ({ ...current, client_name: value }))}
          />
          <Pressable style={styles.input} onPress={() => openDatePicker('start_date')}>
            <Text style={form.start_date ? styles.inputValue : styles.inputPlaceholder}>
              {form.start_date ? formatDateForDisplay(form.start_date) : 'Data inicial'}
            </Text>
          </Pressable>
          <Pressable style={styles.input} onPress={() => openDatePicker('end_date')}>
            <Text style={form.end_date ? styles.inputValue : styles.inputPlaceholder}>
              {form.end_date ? formatDateForDisplay(form.end_date) : 'Data final'}
            </Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Valor por hora"
            placeholderTextColor="#ab9d8f"
            keyboardType="decimal-pad"
            value={form.value_hour}
            onChangeText={(value) => setForm((current) => ({ ...current, value_hour: value }))}
          />
          <View style={styles.inlineToggle}>
            <View style={styles.inlineToggleBody}>
              <Text style={styles.inlineToggleTitle}>Habilitar horario de inicio</Text>
              <Text style={styles.inlineToggleSubtitle}>Sequencia automatica: inicio, pausa, inicio, pausa</Text>
            </View>
            <Switch
              value={form.schedule_enabled}
              onValueChange={(value) => setForm((current) => ({ ...current, schedule_enabled: value }))}
              thumbColor="#fffaf2"
              trackColor={{ false: '#d9d0c5', true: '#7b5836' }}
            />
          </View>
          <TextInput
            style={[styles.input, styles.textArea, !form.schedule_enabled && styles.inputDisabled]}
            placeholder="Horarios: 08:00, 12:00, 13:00, 18:00"
            placeholderTextColor="#ab9d8f"
            value={form.schedule_times}
            onChangeText={(value) => setForm((current) => ({ ...current, schedule_times: value }))}
            editable={form.schedule_enabled}
            multiline
          />
          <Pressable style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveButtonText}>{editingId ? 'Atualizar' : 'Salvar configuração'}</Text>
          </Pressable>
          <View style={styles.settingsRows}>
            {settings.map((item) => (
              <View key={item.id} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>{item.client_name}</Text>
                  <Text style={styles.settingMeta}>{item.start_date} até {item.end_date} • R$ {item.value_hour}/h</Text>
                  {item.schedule_enabled && item.schedule_times ? (
                    <Text style={styles.settingSchedule}>Horarios: {item.schedule_times}</Text>
                  ) : null}
                </View>
                <View style={styles.settingActions}>
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);
                      setForm({
                        client_name: item.client_name,
                        start_date: item.start_date,
                        end_date: item.end_date,
                        value_hour: String(item.value_hour),
                        schedule_enabled: item.schedule_enabled,
                        schedule_times: item.schedule_times ?? '',
                      });
                    }}>
                    <Text style={styles.settingEdit}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)}>
                    <Text style={styles.settingDelete}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut} disabled={signingOut}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={26} color="#d22f27" />
          </View>
          <View>
            <Text style={styles.logoutTitle}>{signingOut ? 'Saindo...' : 'Sair'}</Text>
            <Text style={styles.logoutSubtitle}>Encerrar sessao atual</Text>
          </View>
        </Pressable>

        <Text style={styles.footerNote}>The Atelier v2.4.0 • made with precision</Text>
      </ScrollView>
      <DatePickerModal
        visible={Boolean(dateField)}
        monthCursor={calendarMonth}
        selectedValue={dateField ? form[dateField] : ''}
        onClose={() => setDateField(null)}
        onSelect={handleDateSelect}
        onMonthChange={setCalendarMonth}
      />
      <BottomNavigation />
    </AtelierBackground>
  );
}

function DatePickerModal({
  visible,
  monthCursor,
  selectedValue,
  onClose,
  onSelect,
  onMonthChange,
}: {
  visible: boolean;
  monthCursor: Date;
  selectedValue: string;
  onClose: () => void;
  onSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}) {
  const days = buildCalendarDays(monthCursor);
  const selectedIso = selectedValue;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
              <Feather name="chevron-left" size={22} color="#5b3d25" />
            </Pressable>
            <Text style={styles.calendarTitle}>{monthLabels[monthCursor.getMonth()]} {monthCursor.getFullYear()}</Text>
            <Pressable onPress={() => onMonthChange(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
              <Feather name="chevron-right" size={22} color="#5b3d25" />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {weekLabels.map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekLabel}>{label}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const iso = formatDateForApi(date);
              const selected = iso === selectedIso;

              return (
                <Pressable key={iso} style={[styles.dayCell, selected && styles.dayCellSelected]} onPress={() => onSelect(date)}>
                  <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>{date.getDate()}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SettingsItem({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.optionCard}>
      <View style={styles.optionIcon}>{icon}</View>
      <View style={styles.optionBody}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={22} color="#c9beb2" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 120, gap: 20 },
  profileBlock: { alignItems: 'center', gap: 8, marginTop: 12 },
  avatarRing: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 4,
    borderColor: '#6b4b2f',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffd3c0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6b4b2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#5b3d25', fontSize: 28, fontWeight: '800' },
  role: { color: '#4f4339', fontSize: 16 },
  optionList: { gap: 14 },
  optionCard: { backgroundColor: 'rgba(255,250,242,0.92)', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#ece7e1', alignItems: 'center', justifyContent: 'center' },
  optionBody: { flex: 1, gap: 4 },
  optionTitle: { color: '#5b3d25', fontSize: 18, fontWeight: '700' },
  optionSubtitle: { color: '#9b8f83', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2 },
  syncCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  syncIcon: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#ece7e1', alignItems: 'center', justifyContent: 'center' },
  syncBody: { flex: 1, gap: 4 },
  configCard: { backgroundColor: 'rgba(255,250,242,0.92)', borderRadius: 28, padding: 20, gap: 12 },
  configTitle: { color: '#5b3d25', fontSize: 20, fontWeight: '800' },
  input: { backgroundColor: '#f7f4f0', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, color: '#4a3728' },
  inputDisabled: { opacity: 0.55 },
  inputPlaceholder: { color: '#ab9d8f' },
  inputValue: { color: '#4a3728' },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  inlineToggle: { backgroundColor: '#f7f4f0', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineToggleBody: { flex: 1, gap: 4 },
  inlineToggleTitle: { color: '#4a3728', fontSize: 15, fontWeight: '700' },
  inlineToggleSubtitle: { color: '#8e7f71', fontSize: 12 },
  saveButton: { marginTop: 6, backgroundColor: '#6b4b2f', borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#fffaf2', fontWeight: '800', fontSize: 16 },
  settingsRows: { gap: 12, marginTop: 8 },
  settingRow: { borderTopWidth: 1, borderTopColor: '#ece3d9', paddingTop: 12, flexDirection: 'row', gap: 12 },
  settingInfo: { flex: 1, gap: 4 },
  settingName: { color: '#1f1712', fontWeight: '700', fontSize: 16 },
  settingMeta: { color: '#7f7166', fontSize: 13 },
  settingSchedule: { color: '#5b4739', fontSize: 13 },
  settingActions: { alignItems: 'flex-end', gap: 8 },
  settingEdit: { color: '#6b4b2f', fontWeight: '700' },
  settingDelete: { color: '#c6422d', fontWeight: '700' },
  logoutButton: { backgroundColor: '#fff1ee', borderRadius: 26, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  logoutIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#ffd6d0', alignItems: 'center', justifyContent: 'center' },
  logoutTitle: { color: '#cf271d', fontSize: 18, fontWeight: '800' },
  logoutSubtitle: { color: '#d87067', textTransform: 'uppercase', letterSpacing: 1.3, fontSize: 12 },
  footerNote: { color: '#b5a99b', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, paddingVertical: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(24, 16, 11, 0.38)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fffaf2', borderRadius: 28, padding: 20, gap: 18 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarTitle: { color: '#2a1f16', fontSize: 18, fontWeight: '800' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', color: '#9b8f83', fontSize: 12, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  dayCellSelected: { backgroundColor: '#6b4b2f' },
  dayLabel: { color: '#4a3728', fontSize: 16, fontWeight: '700' },
  dayLabelSelected: { color: '#fffaf2' },
});
