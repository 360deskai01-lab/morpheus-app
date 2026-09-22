import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CenterPane } from '../../utils/membership';

type Tab = { id: CenterPane; label: string; adminOnly?: boolean; authOnly?: boolean };

const TABS: Tab[] = [
  { id: 'song', label: 'Sahne' },
  { id: 'profile', label: 'Profil', authOnly: true },
  { id: 'playlists', label: 'Listeler', authOnly: true },
  { id: 'add_song', label: 'Parça Ekle', authOnly: true },
  { id: 'inbox', label: 'Mesajlar', authOnly: true },
  { id: 'my_corrections', label: 'Düzeltmeler', authOnly: true },
  { id: 'admin', label: 'Yönetim', adminOnly: true },
];

interface Props {
  active: CenterPane;
  loggedIn: boolean;
  isAdmin?: boolean;
  onChange: (pane: CenterPane) => void;
}

export default function CenterTabs({ active, loggedIn, isAdmin, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TABS.filter((tab) => (!tab.authOnly || loggedIn) && (!tab.adminOnly || isAdmin)).map((tab) => {
          const on = active === tab.id || (tab.id === 'song' && (active === 'ai' || active === 'suggest' || active === 'add_to_list'));
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => onChange(tab.id)}
            >
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1220',
  },
  row: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabOn: {
    backgroundColor: '#0284C725',
    borderColor: '#0284C7',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextOn: {
    color: '#38BDF8',
  },
});
