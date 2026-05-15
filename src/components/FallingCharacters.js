import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const JAPANESE_CHARS = [
  '愛', '夢', '心', '光', '風', '雨', '雪', '花', '月', '星',
  '空', '海', '山', '川', '木', '火', '水', '土', '金', '石',
  '春', '夏', '秋', '冬', '日', '時', '人', '生', '死', '道',
  '力', '声', '色', '音', '形', '門', '窓', '橋', '森', '鳥',
  'あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ',
  'ア', 'カ', 'サ', 'タ', 'ナ', 'ハ', 'マ', 'ヤ', 'ラ', 'ワ',
];

function FallingChar({ char, delay, size, opacity, duration, areaHeight, areaWidth }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const startX = useRef(Math.random() * areaWidth).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: areaHeight + 100,
        duration,
        delay,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(animate, Math.random() * 2000);
      });
    };
    animate();
  }, [areaHeight, delay, duration, translateY]);

  return (
    <Animated.View
      style={[
        styles.char,
        {
          transform: [{ translateY }],
          left: startX,
          opacity,
        },
      ]}
    >
      <Text style={[styles.charText, { fontSize: size }]}>{char}</Text>
    </Animated.View>
  );
}

export default function FallingCharacters({
  count = 30,
  areaHeight = height,
  areaWidth = width,
}) {
  const chars = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      char: JAPANESE_CHARS[Math.floor(Math.random() * JAPANESE_CHARS.length)],
      delay: Math.random() * 5000,
      size: Math.random() < 0.3 ? 32 + Math.random() * 24 : 56 + Math.random() * 48,
      opacity: Math.random() < 0.3 ? 0.08 + Math.random() * 0.07 : 0.15 + Math.random() * 0.15,
      duration: 8000 + Math.random() * 7000,
    }))
  ).current;

  return (
    <View style={styles.container} pointerEvents="none">
      {chars.map((item) => (
        <FallingChar
          key={item.id}
          char={item.char}
          delay={item.delay}
          size={item.size}
          opacity={item.opacity}
          duration={item.duration}
          areaHeight={areaHeight}
          areaWidth={areaWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  char: {
    position: 'absolute',
  },
  charText: {
    color: '#2A2A2A',
    fontWeight: '600',
  },
});
