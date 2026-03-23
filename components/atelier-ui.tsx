import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function AtelierBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.page}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      {children}
    </View>
  );
}

export function BrandHeader({ title = 'The Atelier', compact = false }: { title?: string; compact?: boolean }) {
  return (
    <View style={[styles.brandHeader, compact && styles.brandHeaderCompact]}>
      <View style={styles.brandBadge}>
        <Text style={styles.brandBadgeText}>{compact ? 'A' : '✦'}</Text>
      </View>
      <Text style={styles.brandTitle}>{title}</Text>
      <Ionicons name="notifications" size={22} color="#5a3d26" />
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Feather name="search" size={18} color="#8f7f70" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aa9e93"
        style={styles.searchInput}
      />
    </View>
  );
}

export function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.filterPill, active && styles.filterPillActive]}>
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeading({
  title,
  actionLabel,
  href,
}: {
  title: string;
  actionLabel?: string;
  href?: '/logs' | '/tasks' | '/settings';
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && href ? (
        <Link href={href} style={styles.sectionAction}>
          {actionLabel}
        </Link>
      ) : null}
    </View>
  );
}

export function FloatingAddButton({
  onPress,
}: {
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.floatingButton} onPress={onPress}>
      <Feather name="plus" size={26} color="#fff8f1" />
    </Pressable>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Inicio', icon: <MaterialIcons name="dashboard" size={22} color={pathname === '/' ? '#5a3d26' : '#9a9086'} /> },
    { href: '/tasks', label: 'Tarefas', icon: <Ionicons name="clipboard" size={20} color={pathname === '/tasks' ? '#5a3d26' : '#9a9086'} /> },
    { href: '/logs', label: 'Logs', icon: <Ionicons name="time-outline" size={22} color={pathname === '/logs' ? '#5a3d26' : '#9a9086'} /> },
    { href: '/settings', label: 'Ajustes', icon: <Ionicons name="settings" size={22} color={pathname === '/settings' ? '#5a3d26' : '#9a9086'} /> },
  ] as const;

  return (
    <View style={styles.bottomShell}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} asChild>
            <Pressable style={[styles.navItem, active && styles.navItemActive]}>
              {item.icon}
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fbf6ef',
  },
  glowOne: {
    position: 'absolute',
    top: -70,
    left: '15%',
    width: 260,
    height: 260,
    backgroundColor: 'rgba(178, 124, 76, 0.10)',
    borderRadius: 200,
  },
  glowTwo: {
    position: 'absolute',
    bottom: 120,
    right: -40,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(235, 217, 195, 0.30)',
    borderRadius: 200,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandHeaderCompact: {
    marginBottom: 8,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f7c48a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#704e2b',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  brandBadgeText: {
    color: '#5a3d26',
    fontSize: 18,
    fontWeight: '800',
  },
  brandTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#50341f',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ede6de',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  searchInput: {
    flex: 1,
    color: '#493427',
    fontSize: 16,
  },
  filterPill: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#f5f0e8',
  },
  filterPillActive: {
    backgroundColor: '#6b4b2f',
  },
  filterPillText: {
    color: '#4b3525',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 13,
  },
  filterPillTextActive: {
    color: '#fff7ef',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#2a1f16',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionAction: {
    color: '#6a5140',
    fontSize: 14,
  },
  floatingButton: {
    position: 'absolute',
    right: 28,
    bottom: 118,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#6b4b2f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6b4b2f',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 5,
  },
  bottomShell: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    backgroundColor: 'rgba(255, 250, 242, 0.98)',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
    shadowColor: '#8f7b65',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#efe7de',
  },
  navLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#9a9086',
  },
  navLabelActive: {
    color: '#5a3d26',
    fontWeight: '700',
  },
});
