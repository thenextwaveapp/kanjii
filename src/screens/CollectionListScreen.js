import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCollections, getCollectionProgress, fetchLessons } from '../services/collections';
import CircularProgress from '../components/CircularProgress';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_SPACING = 12;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

export default function CollectionListScreen({ navigation, user }) {
  const [collections, setCollections] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [lessons, setLessons] = useState({});
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

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

  const handleCollectionPress = async (collectionId) => {
    if (expandedId === collectionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(collectionId);

    if (!lessons[collectionId] && user?.id) {
      try {
        const lessonData = await fetchLessons(collectionId, user.id);
        console.log('Loaded lessons for collection:', collectionId, lessonData.length);
        setLessons(prev => ({ ...prev, [collectionId]: lessonData }));
      } catch (error) {
        console.error('Error loading lessons:', error);
      }
    } else {
      console.log('Using cached lessons:', lessons[collectionId]?.length || 0);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCollectionCard = ({ item: collection, index }) => {
    const prog = progress[collection.id] || { percentage: 0, completedLessons: 0, totalLessons: 0 };
    const isStarted = prog.completedLessons > 0;
    const isExpanded = expandedId === collection.id;
    const collectionLessons = lessons[collection.id] || [];

    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <ScrollView
          style={styles.cardScrollView}
          showsVerticalScrollIndicator={true}
          scrollEnabled={isExpanded}
          nestedScrollEnabled={true}
        >
        <TouchableOpacity
          style={styles.cardTouchable}
          activeOpacity={0.9}
          onPress={() => handleCollectionPress(collection.id)}
        >
          <View style={styles.cardContent}>
            {/* Emoji background section */}
            <View style={styles.cardEmojiSection}>
              <Text style={styles.cardEmoji}>{collection.emoji}</Text>
            </View>

            {/* Content section */}
            <View style={styles.cardInfoSection}>
              <View style={styles.cardHeader}>
                <View>
                  {collection.level && (
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{collection.level}</Text>
                    </View>
                  )}
                </View>
                <CircularProgress percentage={prog.percentage} size={48} strokeWidth={3.5} />
              </View>

              <Text style={styles.cardTitle}>{collection.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={isExpanded ? undefined : 2}>
                {collection.description}
              </Text>

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

              {/* Expand/collapse indicator */}
              <View style={styles.expandIndicator}>
                <Text style={styles.expandText}>{isExpanded ? 'Hide lessons ▲' : 'Show lessons ▼'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded lessons */}
        {isExpanded && collectionLessons.length > 0 ? (
          <View style={styles.lessonsContainer}>
            <Text style={{ color: '#E85D3A', marginBottom: 12, fontWeight: '700' }}>
              Lessons ({collectionLessons.length})
            </Text>
            <View style={styles.lessonsDivider} />
            <View style={styles.lessonsWrapper}>
            {collectionLessons.map((lesson, lessonIndex) => {
              const isFirstLesson = lesson.order_index === 1;
              const previousLesson = lessonIndex > 0 ? collectionLessons[lessonIndex - 1] : null;
              const isUnlocked = isFirstLesson || (previousLesson && previousLesson.isComplete);
              const isLessonStarted = lesson.masteredCount > 0 || lesson.goodCount > 0;

              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    lesson.isComplete && styles.lessonCardComplete,
                    !isUnlocked && styles.lessonCardLocked
                  ]}
                  activeOpacity={isUnlocked ? 0.7 : 1}
                  disabled={!isUnlocked}
                  onPress={() => {
                    if (isUnlocked) {
                      navigation.navigate('Practice', {
                        lessonId: lesson.id,
                        lessonName: lesson.name,
                        collectionName: collection.name,
                      });
                    }
                  }}
                >
                  <View style={styles.lessonContent}>
                    <View style={styles.lessonLeft}>
                      <Text style={[
                        styles.lessonNumber,
                        !isUnlocked && styles.lessonNumberLocked
                      ]}>
                        {lesson.order_index}
                      </Text>
                      <View style={styles.lessonInfo}>
                        <Text style={[
                          styles.lessonName,
                          !isUnlocked && styles.lessonNameLocked
                        ]}>
                          {lesson.name}
                        </Text>
                        <Text style={[
                          styles.lessonMeta,
                          !isUnlocked && styles.lessonMetaLocked
                        ]}>
                          {lesson.sentenceCount} sentence{lesson.sentenceCount !== 1 ? 's' : ''}
                          {isUnlocked && isLessonStarted && (
                            <>
                              {lesson.masteredCount > 0 && ` · ${lesson.masteredCount} ○`}
                              {lesson.goodCount > 0 && ` · ${lesson.goodCount} △`}
                            </>
                          )}
                        </Text>
                      </View>
                    </View>
                    {!isUnlocked ? (
                      <Text style={styles.lessonLocked}>🔒</Text>
                    ) : lesson.isComplete ? (
                      <Text style={styles.lessonComplete}>✓</Text>
                    ) : isLessonStarted ? (
                      <Text style={styles.lessonStarted}>→</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
        ) : isExpanded ? (
          <View style={styles.lessonsContainer}>
            <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>
              Loading lessons...
            </Text>
          </View>
        ) : null}
        </ScrollView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#E85D3A" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Structured Lessons</Text>
        <Text style={styles.subtitle}>Swipe to explore • Tap to expand</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.FlatList
          ref={flatListRef}
          data={collections}
          renderItem={renderCollectionCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingLeft: SIDE_PADDING - CARD_SPACING / 2,
            paddingRight: SIDE_PADDING - CARD_SPACING / 2,
            paddingBottom: 20,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.carousel}
        />
      </View>

      <View style={styles.dotContainer}>
        {collections.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backText: {
    color: '#555',
    fontSize: 14,
  },
  logo: {
    fontSize: 20,
    color: '#EFEFEF',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#E85D3A',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: {
    flexGrow: 1,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
    paddingBottom: 20,
    overflow: 'visible',
    flex: 1,
  },
  cardScrollView: {
    flex: 1,
  },
  cardTouchable: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0A0F1E',
    overflow: 'hidden',
  },
  cardContent: {
    // Dynamic height based on expanded state - handled in component
  },
  cardEmojiSection: {
    height: CARD_WIDTH * 1.0, // 1:1 square aspect ratio
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 110,
    opacity: 0.15,
  },
  cardInfoSection: {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    padding: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#E85D3A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#EFEFEF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  cardDescription: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonCount: {
    color: '#666',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  progressLabel: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  expandText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lessonsDivider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginBottom: 12,
  },
  lessonsContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 12,
    padding: 16,
  },
  lessonsWrapper: {
    gap: 8,
  },
  lessonCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 14,
    marginBottom: 8,
  },
  lessonCardComplete: {
    borderColor: '#2A4A2A',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  lessonCardLocked: {
    opacity: 0.4,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonNumber: {
    color: '#E85D3A',
    fontSize: 16,
    fontWeight: '700',
    width: 24,
  },
  lessonNumberLocked: {
    color: '#444',
  },
  lessonInfo: {
    flex: 1,
    gap: 2,
  },
  lessonName: {
    color: '#EFEFEF',
    fontSize: 15,
    fontWeight: '600',
  },
  lessonNameLocked: {
    color: '#555',
  },
  lessonMeta: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
  },
  lessonMetaLocked: {
    color: '#333',
  },
  lessonLocked: {
    fontSize: 16,
    opacity: 0.4,
  },
  lessonComplete: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: '700',
  },
  lessonStarted: {
    color: '#E85D3A',
    fontSize: 16,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#E85D3A',
    width: 20,
  },
});
