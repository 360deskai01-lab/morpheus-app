import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

export type ModulePresentation = 'modal' | 'stage';

interface Props {
  visible: boolean;
  presentation?: ModulePresentation;
  onClose: () => void;
  onExpand?: () => void;
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
}

export default function ModuleFrame({
  visible,
  presentation = 'modal',
  onClose,
  onExpand,
  children,
  cardStyle,
}: Props) {
  const isStage = presentation === 'stage';
  const card = (
    <View style={[styles.card, cardStyle, isStage && styles.stageCard]}>
      <View style={styles.body}>{children}</View>
      {!isStage && onExpand ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.seeAllBtn} onPress={onExpand} accessibilityLabel="Tümünü Gör">
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  if (isStage) return card;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
        {card}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 840,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  stageCard: {
    flex: 1,
    maxWidth: '100%',
    height: undefined,
    alignSelf: 'stretch',
    borderRadius: 10,
    margin: 8,
  },
  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },
  footer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0B1220',
  },
  seeAllBtn: {
    alignSelf: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  seeAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
