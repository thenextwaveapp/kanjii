import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';

export default function DropdownPicker({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value);

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.trigger}
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.triggerValue}>{selected?.label}</Text>
            {selected?.sub && <Text style={styles.triggerSub}>{selected.sub}</Text>}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, item.key === value && styles.optionActive]}
                onPress={() => { onChange(item.key); setOpen(false); }}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.optionLabel, item.key === value && styles.optionLabelActive]}>
                    {item.label}
                  </Text>
                  {item.sub && (
                    <Text style={styles.optionSub}>{item.sub}</Text>
                  )}
                </View>
                {item.key === value && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    color: '#555', fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#222',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  triggerValue: { color: '#EFEFEF', fontSize: 16, fontWeight: '600' },
  triggerSub: { color: '#555', fontSize: 12, marginTop: 2 },
  chevron: { color: '#444', fontSize: 24, fontWeight: '300' },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 32, paddingBottom: 16, maxHeight: '70%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#333',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  sheetTitle: {
    color: '#555', fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 16,
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionActive: {},
  optionLabel: { color: '#EFEFEF', fontSize: 16 },
  optionLabelActive: { color: '#E85D3A', fontWeight: '700' },
  optionSub: { color: '#555', fontSize: 12, marginTop: 2 },
  check: { color: '#E85D3A', fontSize: 16, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#1A1A1A' },
});
