import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function StrokeOrder({ kanji, size = 200 }) {
  const [svgUrl, setSvgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadStrokeOrder();
  }, [kanji]);

  const loadStrokeOrder = async () => {
    setLoading(true);
    setError(false);

    try {
      // Convert kanji to unicode hex (5 digits)
      const unicode = kanji.charCodeAt(0).toString(16).padStart(5, '0');

      // Use KanjiVG GitHub URL directly
      const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicode}.svg`;

      // Verify URL exists
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) throw new Error('SVG not found');

      setSvgUrl(url);
    } catch (err) {
      console.error('Error loading stroke order:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator color="#E85D3A" />
      </View>
    );
  }

  if (error || !svgUrl) {
    return (
      <View style={[styles.container, styles.errorContainer, { width: size, height: size }]}>
        <Text style={styles.errorText}>No stroke data</Text>
      </View>
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 8px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          img {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <img src="${svgUrl}" alt="Stroke order" />
      </body>
    </html>
  `;

  return (
    <View style={[styles.svgWrapper, { width: size, height: size }]}>
      <WebView
        source={{ html }}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  errorText: {
    color: '#555',
    fontSize: 12,
  },
});
