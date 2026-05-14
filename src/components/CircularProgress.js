import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CircularProgress({ percentage, size = 52, strokeWidth = 3 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - percentage) / 100) * circumference;

  // Determine colors based on percentage
  const isComplete = percentage === 100;
  const isStarted = percentage > 0;

  const strokeColor = isComplete ? '#4A9A4A' : isStarted ? '#E85D3A' : '#333';
  const textColor = isComplete ? '#4A9A4A' : isStarted ? '#E85D3A' : '#888';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Percentage text */}
      <View style={styles.textContainer}>
        <Text style={[styles.percentage, { color: textColor }]}>
          {percentage}
          <Text style={styles.percentSymbol}>%</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  percentSymbol: {
    fontSize: 10,
    fontWeight: '600',
  },
});
