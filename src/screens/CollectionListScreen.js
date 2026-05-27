import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  TextInput,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { toRomaji } from 'wanakana';
import { fetchCollections, getCollectionProgress, fetchLessons } from '../services/collections';
import { invalidatePattern } from '../services/cache';
import CircularProgress from '../components/CircularProgress';
import { useSettings } from '../contexts/SettingsContext';
import OnboardingTooltip from '../components/OnboardingTooltip';
import { supabase } from '../services/supabase';

// Beautiful gradient themes for collections
const GRADIENT_THEMES = {
  // Warm & welcoming
  '🏠': { colors: ['#FF6B6B', '#FFE66D'], name: 'Sunset' },
  '✈️': { colors: ['#4facfe', '#00f2fe'], name: 'Sky' },
  '🍜': { colors: ['#fa709a', '#fee140'], name: 'Warmth' },
  '🏯': { colors: ['#667eea', '#764ba2'], name: 'Royal' },
  '🌸': { colors: ['#ffecd2', '#fcb69f'], name: 'Blossom' },
  '📚': { colors: ['#a8edea', '#fed6e3'], name: 'Soft' },
  '🎌': { colors: ['#ff9a9e', '#fecfef'], name: 'Japan' },
  '⛩️': { colors: ['#fbc2eb', '#a6c1ee'], name: 'Shrine' },
  '🗾': { colors: ['#96fbc4', '#f9f586'], name: 'Island' },
  '🎓': { colors: ['#89f7fe', '#66a6ff'], name: 'Learn' },
  // Default fallbacks by index
  default: [
    { colors: ['#667eea', '#764ba2'], name: 'Purple' },
    { colors: ['#f093fb', '#f5576c'], name: 'Pink' },
    { colors: ['#4facfe', '#00f2fe'], name: 'Blue' },
    { colors: ['#43e97b', '#38f9d7'], name: 'Green' },
    { colors: ['#fa709a', '#fee140'], name: 'Orange' },
  ]
};

const COLLECTIONS_ONBOARDING_CARDS = [
  {
    title: 'Browse Collections 👆',
    description: 'Swipe left and right to browse different learning collections. Each has curated lessons organized by theme or level.',
  },
  {
    title: 'Tap to View Lessons 📖',
    description: 'Tap any collection card to see its lessons. Lessons unlock as you complete them—finish one to unlock the next.',
  },
  {
    title: 'Track Your Progress 📊',
    description: 'The circular indicator shows your progress in each collection. Complete all lessons to master the collection!',
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_SPACING = 12;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// Helper function to highlight search term in text
function highlightText(text, searchTerm) {
  if (!searchTerm.trim() || !text) return text;

  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase().trim();
  const index = lowerText.indexOf(lowerSearch);

  if (index === -1) return text;

  const before = text.substring(0, index);
  const match = text.substring(index, index + searchTerm.length);
  const after = text.substring(index + searchTerm.length);

  // Return with special marker for styling
  return (
    <>
      {before}
      <Text style={{ color: '#E85D3A', fontWeight: '700' }}>{match}</Text>
      {after}
    </>
  );
}

export default function CollectionListScreen({ navigation, user }) {
  const [collections, setCollections] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [lessons, setLessons] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const cardScrollRefs = useRef({}).current;
  const lessonsAnimations = useRef({}).current;
  const { settings, updateSetting } = useSettings();

  // Initial load only
  useEffect(() => {
    loadCollections();
  }, [user?.id]);

  // Refresh lesson data when returning from practice/summary
  useFocusEffect(
    useCallback(() => {
      // Only refresh expanded collection's lessons, don't reload entire collections list
      if (expandedId && user?.id) {
        // Invalidate cache to get fresh data
        invalidatePattern(`lessons:${expandedId}`);
        invalidatePattern(`progress:collection`);

        fetchLessons(expandedId, user.id).then(lessonData => {
          setLessons(prev => ({ ...prev, [expandedId]: lessonData }));
        }).catch(error => {
          console.error('Error refreshing lessons:', error);
        });

        // Refresh collection progress without reloading the list
        if (collections.length > 0) {
          getCollectionProgress(expandedId, user.id).then(prog => {
            setProgress(prev => ({ ...prev, [expandedId]: prog }));
          }).catch(error => {
            console.error('Error refreshing collection progress:', error);
          });
        }
      }
    }, [expandedId, user?.id, collections.length])
  );

  // Show tooltip on first visit (only when collections load)
  useEffect(() => {
    if (settings && !settings.onboardingLessons && !loading && collections.length > 0) {
      setShowTooltip(true);
    }
  }, [settings, loading, collections.length]);

  const handleTooltipComplete = async () => {
    setShowTooltip(false);
    await updateSetting('onboardingLessons', true);
  };

  // Auto-close expanded collection when scrolling away
  useEffect(() => {
    if (expandedId && collections.length > 0) {
      const expandedIndex = collections.findIndex(c => c.id === expandedId);
      if (expandedIndex !== -1 && expandedIndex !== currentIndex) {
        setExpandedId(null);
      }
    }
  }, [currentIndex, expandedId, collections]);

  const loadCollections = async () => {
    try {
      const data = await fetchCollections();
      setCollections(data);

      // Load progress asynchronously in background (non-blocking)
      if (user?.id) {
        data.forEach(async (collection) => {
          try {
            const prog = await getCollectionProgress(collection.id, user.id);
            setProgress(prev => ({ ...prev, [collection.id]: prog }));
          } catch (error) {
            console.error(`Error loading progress for ${collection.id}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const searchTerm = query.toLowerCase().trim();

      // Search sentences in Japanese, English, and through word furigana
      const { data: sentences, error } = await supabase
        .from('sentences')
        .select(`
          id,
          japanese,
          english,
          words,
          lesson_sentences!inner(
            lesson_id,
            lessons!inner(
              id,
              name,
              order_index,
              collection_id,
              collections!inner(
                id,
                name,
                emoji
              )
            )
          )
        `)
        .or(`japanese.ilike.%${searchTerm}%,english.ilike.%${searchTerm}%`)
        .limit(50);

      if (error) throw error;

      // Additional filtering for furigana/romaji matches and organize by collection/lesson
      const resultsByCollection = {};

      (sentences || []).forEach(sentence => {
        // Check if query matches in furigana or romaji
        const words = sentence.words || [];
        const matchesInWords = words.some(w => {
          const furigana = w.furigana?.toLowerCase() || '';
          const romaji = w.furigana ? toRomaji(w.furigana).toLowerCase() : '';
          const wordText = w.word?.toLowerCase() || '';
          return furigana.includes(searchTerm) ||
                 romaji.includes(searchTerm) ||
                 wordText.includes(searchTerm);
        });

        const matchesInSentence =
          sentence.japanese.toLowerCase().includes(searchTerm) ||
          sentence.english.toLowerCase().includes(searchTerm);

        if (matchesInWords || matchesInSentence) {
          sentence.lesson_sentences.forEach(ls => {
            const lesson = ls.lessons;
            const collection = lesson.collections;

            if (!resultsByCollection[collection.id]) {
              resultsByCollection[collection.id] = {
                collection,
                lessons: {}
              };
            }

            if (!resultsByCollection[collection.id].lessons[lesson.id]) {
              resultsByCollection[collection.id].lessons[lesson.id] = {
                lesson,
                sentences: []
              };
            }

            resultsByCollection[collection.id].lessons[lesson.id].sentences.push(sentence);
          });
        }
      });

      // Convert to array format
      const results = Object.values(resultsByCollection).map(item => ({
        collection: item.collection,
        lessons: Object.values(item.lessons)
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchActive) return;

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchActive]);

  const handleSearchOpen = () => {
    setSearchActive(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchClose = () => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleCollectionPress = async (collectionId) => {
    if (expandedId === collectionId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(collectionId);

    // Scroll to show lessons after a brief delay for layout
    setTimeout(() => {
      const scrollRef = cardScrollRefs[collectionId];
      if (scrollRef) {
        scrollRef.scrollTo({ y: 200, animated: true });
      }
    }, 100);

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

  // Trigger animation when expandedId changes
  React.useEffect(() => {
    collections.forEach((collection) => {
      if (!lessonsAnimations[collection.id]) {
        lessonsAnimations[collection.id] = new Animated.Value(0);
      }

      const isExpanded = expandedId === collection.id;
      Animated.spring(lessonsAnimations[collection.id], {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    });
  }, [expandedId, collections]);

  const renderCollectionCard = ({ item: collection, index }) => {
    const prog = progress[collection.id] || { percentage: 0, completedLessons: 0, totalLessons: 0 };
    const isStarted = prog.completedLessons > 0;
    const isExpanded = expandedId === collection.id;
    const collectionLessons = lessons[collection.id] || [];

    // Initialize animation value for this collection if it doesn't exist
    if (!lessonsAnimations[collection.id]) {
      lessonsAnimations[collection.id] = new Animated.Value(0);
    }
    const lessonsAnimation = lessonsAnimations[collection.id];

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
          ref={(ref) => (cardScrollRefs[collection.id] = ref)}
          style={styles.cardScrollView}
          showsVerticalScrollIndicator={true}
          scrollEnabled={isExpanded}
          nestedScrollEnabled={true}
        >
        <TouchableOpacity
          style={[
            styles.cardTouchable,
            isExpanded && styles.cardTouchableExpanded,
          ]}
          activeOpacity={0.9}
          onPress={() => handleCollectionPress(collection.id)}
        >
          <View style={styles.cardContent}>
            {/* Gradient background section */}
            <View style={styles.cardEmojiSection}>
              {(() => {
                const gradient = GRADIENT_THEMES[collection.emoji] ||
                                GRADIENT_THEMES.default[index % GRADIENT_THEMES.default.length];
                return (
                  <LinearGradient
                    colors={gradient.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                  >
                    <Text style={styles.cardEmoji}>{collection.emoji}</Text>
                  </LinearGradient>
                );
              })()}
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
                <Text style={[styles.expandText, isExpanded && styles.expandTextActive]}>
                  {isExpanded ? 'Hide lessons ▲' : 'Show lessons ▼'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded lessons */}
        {isExpanded && collectionLessons.length > 0 ? (
          <Animated.View
            style={[
              styles.lessonsContainer,
              {
                opacity: lessonsAnimation,
                transform: [{
                  translateY: lessonsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={{ color: '#FFF8E7', marginBottom: 12, fontWeight: '700', fontSize: 16 }}>
              Lessons ({collectionLessons.length})
            </Text>
            <View style={styles.lessonsDivider} />
            <View style={styles.lessonsWrapper}>
            {collectionLessons.map((lesson, lessonIndex) => {
              const isFirstLesson = lessonIndex === 0;
              const previousLesson = lessonIndex > 0 ? collectionLessons[lessonIndex - 1] : null;
              const isUnlocked = isFirstLesson || (previousLesson && previousLesson.isComplete);
              const isLessonStarted = lesson.masteredCount > 0 || lesson.goodCount > 0;

              console.log(`Lesson ${lessonIndex}: ${lesson.name}`, {
                isFirstLesson,
                isUnlocked,
                isComplete: lesson.isComplete,
                previousComplete: previousLesson?.isComplete,
                masteredCount: lesson.masteredCount,
                sentenceCount: lesson.sentenceCount,
              });

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
                        collectionId: collection.id,
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
          </Animated.View>
        ) : isExpanded ? (
          <Animated.View
            style={[
              styles.lessonsContainer,
              {
                opacity: lessonsAnimation,
                transform: [{
                  translateY: lessonsAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>
              Loading lessons...
            </Text>
          </Animated.View>
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
        {!searchActive ? (
          <TouchableOpacity onPress={() => navigation.popToTop()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.logo}>Kanj<Text style={styles.logoAccent}>ii</Text></Text>
      </View>

      <View style={styles.titleContainer}>
        {!searchActive ? (
          <>
            {/* Overall progress bar */}
            {(() => {
              const totalLessons = collections.reduce((sum, c) => sum + (c.lessonCount || 0), 0);
              const completedLessons = Object.values(progress).reduce((sum, p) => sum + (p.completedLessons || 0), 0);
              const overallPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

              return (
                <>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${overallPercentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {completedLessons}/{totalLessons} lessons
                    </Text>
                  </View>
                </>
              );
            })()}

            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>Swipe to explore • Tap to expand</Text>
              <TouchableOpacity
                style={styles.searchIcon}
                onPress={handleSearchOpen}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="search" size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.searchContainer}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search sentences..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchCloseButton}
              onPress={handleSearchClose}
            >
              <Text style={styles.searchCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {searchActive ? (
          <ScrollView
            style={styles.searchResultsContainer}
            contentContainerStyle={styles.searchResultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {searching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator color="#E85D3A" size="large" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
            ) : searchQuery.trim() === '' ? (
              <View style={styles.searchEmptyContainer}>
                <Ionicons name="search-outline" size={48} color="#333" style={{ marginBottom: 8 }} />
                <Text style={styles.searchEmptyText}>
                  Search for words or phrases in sentences
                </Text>
                <Text style={styles.searchEmptyHint}>
                  Try searching in Japanese, English, romaji, or kana
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.searchEmptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#333" style={{ marginBottom: 8 }} />
                <Text style={styles.searchEmptyText}>No results found</Text>
                <Text style={styles.searchEmptyHint}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              searchResults.map((result) => {
                const collection = result.collection;
                const theme = GRADIENT_THEMES[collection.emoji] ||
                  GRADIENT_THEMES.default[collections.findIndex(c => c.id === collection.id) % GRADIENT_THEMES.default.length];

                const collectionProgress = progress[collection.id];
                const percentage = collectionProgress?.percentage || 0;
                const masteredCount = collectionProgress?.masteredCount || 0;
                const goodCount = collectionProgress?.goodCount || 0;

                return (
                  <View key={collection.id} style={styles.searchResultCollection}>
                    {/* Mini collection header */}
                    <TouchableOpacity
                      onPress={() => {
                        // Find the index of this collection in the main list
                        const collectionIndex = collections.findIndex(c => c.id === collection.id);
                        if (collectionIndex === -1) return;

                        // Close search first
                        handleSearchClose();

                        // Wait for search to close and FlatList to be visible
                        requestAnimationFrame(() => {
                          setTimeout(() => {
                            const listRef = flatListRef.current?._component || flatListRef.current;
                            if (listRef) {
                              // Calculate exact scroll position
                              const offset = collectionIndex * (CARD_WIDTH + CARD_SPACING);

                              try {
                                listRef.scrollToOffset({
                                  offset,
                                  animated: true,
                                });
                              } catch (e) {
                                // Fallback to scrollTo
                                listRef.scrollTo?.({ x: offset, animated: true });
                              }

                              setCurrentIndex(collectionIndex);

                              // Expand the collection after scroll animation completes
                              setTimeout(() => {
                                handleCollectionPress(collection.id);
                              }, 500);
                            }
                          }, 50);
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.searchCollectionHeader}>
                        <View style={styles.searchCollectionLeft}>
                          <Text style={styles.searchCollectionEmoji}>{collection.emoji}</Text>
                          <View style={styles.searchCollectionInfo}>
                            <Text style={styles.searchCollectionName}>{collection.name}</Text>
                            {(masteredCount > 0 || goodCount > 0) && (
                              <View style={styles.searchCollectionStats}>
                                {masteredCount > 0 && (
                                  <Text style={styles.searchCollectionStat}>{masteredCount} ○</Text>
                                )}
                                {goodCount > 0 && (
                                  <Text style={styles.searchCollectionStat}>{goodCount} △</Text>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.searchCollectionRight}>
                          {percentage > 0 && (
                            <Text style={styles.searchCollectionProgress}>{Math.round(percentage)}%</Text>
                          )}
                          <Text style={styles.searchCollectionArrow}>→</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Lessons with matching sentences */}
                    {result.lessons.map((lessonData) => {
                      const lesson = lessonData.lesson;
                      return (
                        <View key={lesson.id} style={styles.searchResultLesson}>
                          <Text style={styles.searchLessonName}>{lesson.name}</Text>

                          {/* Matching sentences */}
                          {lessonData.sentences.map((sentence) => (
                            <TouchableOpacity
                              key={sentence.id}
                              style={styles.searchSentenceCard}
                              onPress={() => navigation.navigate('SentenceDetail', { sentence })}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.searchSentenceJapanese}>
                                {highlightText(sentence.japanese, searchQuery)}
                              </Text>
                              <Text style={styles.searchSentenceEnglish}>
                                {highlightText(sentence.english, searchQuery)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : (
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
        )}
      </View>

      {!searchActive && (
        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            {currentIndex + 1} / {collections.length}
          </Text>
        </View>
      )}

      {/* First-time onboarding tooltip */}
      <OnboardingTooltip
        visible={showTooltip}
        cards={COLLECTIONS_ONBOARDING_CARDS}
        onComplete={handleTooltipComplete}
      />
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
  headerSpacer: {
    width: 60,
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
    paddingBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E85D3A',
    borderRadius: 4,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchIcon: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#EFEFEF',
    fontSize: 14,
    paddingVertical: 8,
  },
  searchCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchCloseText: {
    fontSize: 18,
    color: '#555',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  searchLoadingText: {
    color: '#555',
    fontSize: 14,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  searchEmptyText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  searchEmptyHint: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
  },
  searchResultCollection: {
    marginBottom: 20,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  searchCollectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  searchCollectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchCollectionEmoji: {
    fontSize: 20,
  },
  searchCollectionInfo: {
    flex: 1,
    gap: 3,
  },
  searchCollectionName: {
    color: '#EFEFEF',
    fontSize: 14,
    fontWeight: '700',
  },
  searchCollectionStats: {
    flexDirection: 'row',
    gap: 8,
  },
  searchCollectionStat: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  searchCollectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchCollectionProgress: {
    color: '#E85D3A',
    fontSize: 12,
    fontWeight: '700',
  },
  searchCollectionArrow: {
    color: '#555',
    fontSize: 16,
    fontWeight: '700',
  },
  searchResultLesson: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  searchLessonName: {
    color: '#E85D3A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  searchSentenceCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0A0A0A',
  },
  searchSentenceJapanese: {
    color: '#EFEFEF',
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 22,
  },
  searchSentenceEnglish: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
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
  cardTouchableExpanded: {
    borderColor: '#FFF8E7',
    borderWidth: 2,
    shadowColor: '#FFF8E7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    // Dynamic height based on expanded state - handled in component
  },
  cardEmojiSection: {
    height: CARD_WIDTH * 1.0, // 1:1 square aspect ratio
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 110,
    opacity: 0.25,
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
  expandTextActive: {
    color: '#FFF8E7',
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
  pageCounter: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageCounterText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
