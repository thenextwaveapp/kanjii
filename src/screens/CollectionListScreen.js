import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCollections, getCollectionProgress } from '../services/collections';
import CircularProgress from '../components/CircularProgress';

export default function CollectionListScreen({ navigation, user }) {
  const [collections, setCollections] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [user?.id])
  );

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await fetchCollections();
      setCollections(data);

      // Load progress for each collection
      if (user?.id) {
        const progressData = {};
        await Promise.all(
          data.map(async (collection) => {
            const prog = await getCollectionProgress(collection.id, user.id);
            progressData[collection.id] = prog;
          })
        );
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Structured Lessons</Text>
        <Text style={styles.subtitle}>
          Curated paths to build specific skills
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#E85D3A" size="large" />
          </View>
        ) : collections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No collections available yet</Text>
          </View>
        ) : (
          <View style={styles.collections}>
            {collections.map((collection) => {
              const prog = progress[collection.id] || { percentage: 0, completedLessons: 0, totalLessons: 0 };
              const isStarted = prog.completedLessons > 0;
              const isComplete = prog.percentage === 100;

              return (
                <TouchableOpacity
                  key={collection.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('LessonList', {
                      collectionId: collection.id,
                      collectionName: collection.name,
                      collectionEmoji: collection.emoji,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardEmoji}>{collection.emoji}</Text>
                      {collection.level && (
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelText}>{collection.level}</Text>
                        </View>
                      )}
                    </View>

                    {/* Circular progress */}
                    <CircularProgress percentage={prog.percentage} size={52} strokeWidth={3} />
                  </View>

                  <Text style={styles.cardTitle}>{collection.name}</Text>
                  <Text style={styles.cardDescription}>{collection.description}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.lessonCount}>
                      {collection.lessonCount} lesson{collection.lessonCount !== 1 ? 's' : ''}
                    </Text>
                    {isStarted && (
                      <Text style={styles.progressLabel}>
                        {prog.completedLessons}/{prog.totalLessons} complete
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '800', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 0 },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: { color: '#555', fontSize: 14 },
  collections: { gap: 14 },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardEmoji: { fontSize: 32 },
  levelBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    color: '#E85D3A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  cardDescription: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  lessonCount: {
    color: '#555',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  progressLabel: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
