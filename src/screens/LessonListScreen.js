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
import { fetchLessons } from '../services/collections';

export default function LessonListScreen({ navigation, route, user }) {
  const { collectionId, collectionName, collectionEmoji } = route.params;
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLessons();
    }, [collectionId, user?.id])
  );

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await fetchLessons(collectionId, user?.id);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLesson = (lesson) => {
    navigation.navigate('Practice', {
      lessonId: lesson.id,
      lessonName: lesson.name,
      collectionName,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Collection header */}
        <View style={styles.collectionHeader}>
          <Text style={styles.emoji}>{collectionEmoji}</Text>
          <Text style={styles.title}>{collectionName}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#E85D3A" size="large" />
          </View>
        ) : lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No lessons available yet</Text>
          </View>
        ) : (
          <View style={styles.lessons}>
            {lessons.map((lesson, index) => {
              const percentage =
                lesson.totalCount > 0
                  ? Math.round((lesson.masteredCount / lesson.totalCount) * 100)
                  : 0;

              const isComplete = lesson.isComplete;
              const isStarted = lesson.masteredCount > 0;

              // Lesson 1 is always unlocked, others require previous lesson completion
              const isFirstLesson = lesson.order_index === 1;
              const previousLesson = index > 0 ? lessons[index - 1] : null;
              const isUnlocked = isFirstLesson || (previousLesson && previousLesson.isComplete);

              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    isComplete && styles.lessonCardComplete,
                    !isUnlocked && styles.lessonCardLocked,
                  ]}
                  onPress={() => isUnlocked ? startLesson(lesson) : null}
                  activeOpacity={isUnlocked ? 0.85 : 1}
                  disabled={!isUnlocked}
                >
                  <View style={styles.lessonHeader}>
                    <View style={styles.lessonNumber}>
                      <Text style={styles.lessonNumberText}>{lesson.order_index}</Text>
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>{lesson.name}</Text>
                      {lesson.description && (
                        <Text style={styles.lessonDescription}>{lesson.description}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.lessonFooter}>
                    <Text style={[
                      styles.sentenceCount,
                      !isUnlocked && styles.sentenceCountLocked
                    ]}>
                      {lesson.sentenceCount} sentence{lesson.sentenceCount !== 1 ? 's' : ''}
                    </Text>

                    {!isUnlocked ? (
                      <View style={styles.lockedInfo}>
                        <Text style={styles.lockIcon}>🔒</Text>
                        <Text style={styles.lockedText}>Locked</Text>
                      </View>
                    ) : isStarted ? (
                      <View style={styles.progressInfo}>
                        {isComplete ? (
                          <Text style={styles.completeText}>✓ Complete</Text>
                        ) : (
                          <>
                            <View style={styles.progressTrack}>
                              <View
                                style={[styles.progressFill, { width: `${percentage}%` }]}
                              />
                            </View>
                            <Text style={styles.progressText}>
                              {lesson.masteredCount}/{lesson.totalCount} ○
                            </Text>
                          </>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.startText}>Start →</Text>
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
  logo: { fontSize: 22, color: '#EFEFEF', fontWeight: '900', letterSpacing: -0.5 },
  logoAccent: { color: '#E85D3A' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 0 },
  collectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
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
  lessons: { gap: 12 },
  lessonCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 18,
  },
  lessonCardComplete: {
    borderColor: '#2A4A2A',
    backgroundColor: '#0F150F',
  },
  lessonCardLocked: {
    backgroundColor: '#0A0A0A',
    borderColor: '#1A1A1A',
    opacity: 0.5,
  },
  lessonHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberText: {
    color: '#E85D3A',
    fontSize: 16,
    fontWeight: '700',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    color: '#EFEFEF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  lessonDescription: {
    color: '#888',
    fontSize: 12,
    lineHeight: 16,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentenceCount: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sentenceCountLocked: {
    color: '#333',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    width: 60,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#E85D3A',
    borderRadius: 2,
  },
  progressText: {
    color: '#E85D3A',
    fontSize: 11,
    fontWeight: '600',
  },
  completeText: {
    color: '#4A9A4A',
    fontSize: 12,
    fontWeight: '600',
  },
  startText: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    fontSize: 12,
    opacity: 0.6,
  },
  lockedText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '600',
  },
});
