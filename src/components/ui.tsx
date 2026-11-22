import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Pill({
  label,
  onPress,
  tone = 'neutral',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'neutral' | 'accent' | 'ok' | 'danger';
  disabled?: boolean;
  style?: object;
}) {
  const bg =
    tone === 'accent' ? C.accent : tone === 'ok' ? C.ok : tone === 'danger' ? C.danger : C.cardAlt;
  const fg = tone === 'neutral' ? C.text : '#0B1220';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: C.accent, borderColor: C.accent },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && { color: '#0B1220', fontWeight: '700' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface PickerItem {
  id: string;
  label: string;
  detail?: string;
}

export function ItemPicker({
  visible,
  title,
  items,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: PickerItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {items.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => {
                  onSelect(v.id);
                  onClose();
                }}
                style={({ pressed }) => [styles.modalRow, pressed && { backgroundColor: C.cardAlt }]}
              >
                <Text style={styles.modalVarLabel}>{v.label}</Text>
                {v.detail ? <Text style={styles.modalVarDetail}>{v.detail}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  title: { color: C.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: C.dim, fontSize: 14, marginTop: -6, lineHeight: 20 },
  card: {
    backgroundColor: C.card,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pillText: { fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  chip: {
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.cardAlt,
  },
  chipText: { color: C.text, fontSize: 13, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 16,
    gap: 6,
  },
  modalTitle: { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  modalRow: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, gap: 2 },
  modalVarLabel: { color: C.accent, fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  modalVarDetail: { color: C.dim, fontSize: 13 },
});
