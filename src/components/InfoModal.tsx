import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FileText } from 'lucide-react-native';
import { INFO_PAGES } from '../content/infoPages';
import { INFO_PAGE_IDS, InfoPageId } from '../utils/portalRouting';
import ModuleFrame, { type ModulePresentation } from './portal/ModuleFrame';

interface Props {
  visible: boolean;
  pageId: InfoPageId | null;
  onClose: () => void;
  presentation?: ModulePresentation;
  onExpand?: () => void;
  onSelectPage?: (page: InfoPageId) => void;
}

export default function InfoModal({
  visible,
  pageId,
  onClose,
  presentation = 'modal',
  onExpand,
  onSelectPage,
}: Props) {
  const page = pageId ? INFO_PAGES[pageId] : null;
  const isStage = presentation === 'stage';

  return (
    <ModuleFrame
      visible={visible && !!page}
      presentation={presentation}
      onClose={onClose}
      onExpand={onExpand}
      cardStyle={styles.modalCard}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText color="#38BDF8" size={18} />
          <Text style={styles.headerTitle}>{page?.title || 'Yardım'}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Kapat">
          <Text style={styles.stageBackText}>{isStage ? 'Sahneye Dön' : '✕'}</Text>
        </TouchableOpacity>
      </View>

      {isStage && onSelectPage ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
          {INFO_PAGE_IDS.map((id) => (
            <TouchableOpacity
              key={id}
              style={[styles.navChip, pageId === id && styles.navChipOn]}
              onPress={() => onSelectPage(id)}
            >
              <Text style={[styles.navChipText, pageId === id && styles.navChipTextOn]}>
                {INFO_PAGES[id].title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView style={styles.body} showsVerticalScrollIndicator>
        {page?.subtitle ? <Text style={styles.subtitle}>{page.subtitle}</Text> : null}
        {(page?.paragraphs || []).map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </ScrollView>
    </ModuleFrame>
  );
}

const styles = StyleSheet.create({
  modalCard: { maxHeight: '86%', height: 520 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  closeBtn: {
    padding: 4,
  },
  stageBackText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  navRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#0B1220',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  navChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  navChipOn: {
    backgroundColor: '#0284C725',
    borderColor: '#0284C7',
  },
  navChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  navChipTextOn: {
    color: '#38BDF8',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#090E1A',
    flex: 1,
  },
  subtitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  paragraph: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
});
