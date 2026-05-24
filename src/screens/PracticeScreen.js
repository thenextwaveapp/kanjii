import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import SnippetCard from '../components/SnippetCard';
import TypingInput from '../components/TypingInput';
import { fetchSentence, fetchTargetedSentence } from '../services/sentences';
import { recordCompletion, recordSkip } from '../services/progress';
import { fetchLessonSentences, updateLessonProgress } from '../services/collections';
import { fetchSentenceLists, addSentenceToList, removeSentenceFromList, getSentenceLists, fetchListSentences } from '../services/sentenceLists';
import { speakJapanese } from '../services/tts';

export default function PracticeScreen({ navigation, route, user }) {
  const {
    rounds = 10,
    difficulty = 'Mixed',
    domain = 'Any',
    reviewKanji = null,   // string[] — drill mode, targeted sentences
    singleSentence = null, // sentence object — one-round re-practice from Study
    lessonId = null,       // UUID — lesson mode, ordered sentences
    lessonName = null,     // string — lesson name for display
    collectionName = null, // string — collection name for display
    collectionId = null,   // UUID — collection ID for finding next lesson
    listId = null,         // UUID — list mode, sentences from custom list
    listName = null,       // string — list name for display
  } = route?.params || {};

  const isLesson = !!lessonId;
  const isList = !!listId;
  const isDrill = !!reviewKanji && reviewKanji.length > 0;
  const isSingle = !!singleSentence;

  const [lessonSentences, setLessonSentences] = useState([]);
  const [listSentences, setListSentences] = useState([]);
  const totalRounds = isSingle ? 1 : isLesson ? lessonSentences.length : isList ? listSentences.length : rounds;

  const [sentence, setSentence] = useState(isSingle ? singleSentence : null);
  const [loading, setLoading] = useState(!isSingle);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [done, setDone] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sentenceLists, setSentenceLists] = useState([]);
  const [currentSentenceListIds, setCurrentSentenceListIds] = useState([]);
  const [autoPlaying, setAutoPlaying] = useState(false);

  const sessionStart = useRef(new Date().toISOString());
  const roundResults = useRef([]);
  const roundStart = useRef(Date.now());
  const scrollRef = useRef(null);

  const loadSentence = async (roundNumber = currentRound) => {
    setLoading(true);
    setError(null);
    setSentence(null);
    setAttempts(0);
    roundStart.current = Date.now();
    try {
      let data;

      if (isLesson) {
        // Lesson mode: get next sentence from ordered list
        const nextIndex = roundNumber - 1;
        if (nextIndex < lessonSentences.length) {
          data = lessonSentences[nextIndex];
        } else {
          throw new Error('No more sentences in this lesson');
        }
      } else if (isList) {
        // List mode: get next sentence from list
        const nextIndex = roundNumber - 1;
        if (nextIndex < listSentences.length) {
          data = listSentences[nextIndex];
        } else {
          throw new Error('No more sentences in this list');
        }
      } else if (isDrill) {
        data = await fetchTargetedSentence(reviewKanji);
      } else {
        data = await fetchSentence(user?.id, difficulty, domain);
      }

      if (!data) {
        throw new Error('No sentences available in database for this selection');
      }

      setSentence(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initialize() {
      // Fetch sentence lists
      if (user?.id) {
        try {
          const lists = await fetchSentenceLists(user.id);
          setSentenceLists(lists);
        } catch (e) {
          console.error('Failed to load sentence lists:', e);
        }
      }

      if (isLesson) {
        // Load all lesson sentences first
        try {
          const sentences = await fetchLessonSentences(lessonId);
          setLessonSentences(sentences);
          if (sentences.length > 0) {
            setSentence(sentences[0]);
            roundStart.current = Date.now();
          } else {
            setError('This lesson has no sentences yet');
          }
        } catch (e) {
          setError('Failed to load lesson');
        } finally {
          setLoading(false);
        }
      } else if (isList) {
        // Load all list sentences first
        try {
          const sentences = await fetchListSentences(listId);
          setListSentences(sentences);
          if (sentences.length > 0) {
            setSentence(sentences[0]);
            roundStart.current = Date.now();
          } else {
            setError('This list has no sentences yet');
          }
        } catch (e) {
          setError('Failed to load list');
        } finally {
          setLoading(false);
        }
      } else if (!isSingle) {
        loadSentence();
      } else {
        roundStart.current = Date.now();
      }
    }
    initialize();
  }, []);

  // Fetch which lists the current sentence is in
  useEffect(() => {
    async function fetchSentenceLists() {
      if (!sentence?.id) {
        setCurrentSentenceListIds([]);
        return;
      }
      try {
        const lists = await getSentenceLists(sentence.id);
        setCurrentSentenceListIds(lists.map(l => l.id));
      } catch (e) {
        console.error('Failed to fetch sentence lists:', e);
        setCurrentSentenceListIds([]);
      }
    }
    fetchSentenceLists();
  }, [sentence?.id]);

  // Auto-play TTS when new sentence loads
  useEffect(() => {
    if (sentence?.japanese && !loading && !done) {
      setAutoPlaying(true);
      // Delay to let UI settle and show blue glow
      const timer = setTimeout(async () => {
        try {
          await speakJapanese(sentence.japanese);
        } catch (e) {
          console.error('Auto-play TTS failed:', e);
        } finally {
          // Keep glow for a bit after audio starts
          setTimeout(() => setAutoPlaying(false), 800);
        }
      }, 450);
      return () => {
        clearTimeout(timer);
        setAutoPlaying(false);
      };
    }
  }, [sentence?.id, loading, done]);

  const finishSession = async (results) => {
    if (isSingle) {
      navigation.goBack();
      return;
    }

    // Update lesson progress if in lesson mode
    if (isLesson && user?.id) {
      try {
        await updateLessonProgress({
          userId: user.id,
          lessonId,
          sentenceResults: results,
        });
      } catch (e) {
        console.error('Failed to update lesson progress:', e);
      }
    }

    navigation.replace('Summary', {
      results,
      sessionStart: sessionStart.current,
      rounds: totalRounds,
      difficulty: isLesson ? lessonName : isDrill ? 'Drill' : difficulty,
      domain: isLesson ? collectionName : isDrill ? 'Weak kanji' : domain,
      isLesson,
      lessonId,
      lessonName,
      collectionName,
      collectionId,
    });
  };

  const handleMatch = async (grade, userInput) => {
    const elapsed = Date.now() - roundStart.current;
    roundResults.current.push({
      round: currentRound,
      skipped: false,
      timeMs: elapsed,
      sentence,
      grade, // ○, △, or ×
      userInput, // What the user actually typed
    });

    if (user?.id) {
      await recordCompletion({
        userId: user.id,
        sentenceId: sentence?.id,
        words: sentence?.words,
        attempts: attempts + 1,
        grade, // Pass grade to progress service
        jlptLevel: sentence?.jlpt_level, // Pass sentence JLPT level for kanji tracking
      });
    }

    if (currentRound >= totalRounds) {
      setDone(true);
      finishSession(roundResults.current);
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      loadSentence(nextRound);
    }
  };

  const handleSkip = async () => {
    const elapsed = Date.now() - roundStart.current;
    roundResults.current.push({
      round: currentRound,
      skipped: true,
      timeMs: elapsed,
      sentence,
      grade: '×', // Skip = × (batsu)
    });

    if (user?.id && sentence?.words) {
      await recordSkip({
        userId: user.id,
        words: sentence.words,
        jlptLevel: sentence?.jlpt_level, // Pass sentence JLPT level for kanji tracking
      });
    }

    if (currentRound >= totalRounds) {
      setDone(true);
      finishSession(roundResults.current);
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      loadSentence(nextRound);
    }
  };

  const handleClose = () => {
    if (roundResults.current.length > 0 && !done) {
      setShowExitConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  const handleSaveToList = async (listId, isCurrentlyInList) => {
    if (!sentence?.id) return;
    try {
      if (isCurrentlyInList) {
        await removeSentenceFromList(listId, sentence.id);
        setCurrentSentenceListIds(prev => prev.filter(id => id !== listId));
      } else {
        await addSentenceToList(listId, sentence.id);
        setCurrentSentenceListIds(prev => [...prev, listId]);
      }
    } catch (error) {
      console.error('Failed to save sentence:', error);
    }
  };

  const progress = currentRound / totalRounds;

  const headerLabel = isSingle
    ? 'Re-practice'
    : isLesson
    ? `${currentRound} / ${totalRounds}`
    : isList
    ? `${currentRound} / ${totalRounds}`
    : isDrill
    ? `Drill · ${currentRound}/${totalRounds}`
    : `${currentRound} / ${totalRounds}`;

  const badgeLabel = isSingle
    ? 'Single round'
    : isLesson
    ? lessonName
    : isList
    ? listName
    : isDrill
    ? 'Weak kanji'
    : `${difficulty}${domain !== 'Any' ? ` · ${domain}` : ''}`;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Exit confirmation modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save your progress?</Text>
            <Text style={styles.modalMessage}>
              You've completed {roundResults.current.length} of {totalRounds} rounds
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDiscard]}
                onPress={() => {
                  setShowExitConfirm(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalButtonText}>Discard & Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={() => {
                  setShowExitConfirm(false);
                  finishSession(roundResults.current);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Save & View Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>{headerLabel}</Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#E85D3A" size="large" />
              <Text style={styles.loadingText}>
                {isDrill ? 'Finding weak kanji...' : 'Loading...'}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadSentence}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {sentence && !loading && !done && (
            <>
              <Text style={styles.instruction}>Tap words to reveal, then type</Text>
              <SnippetCard
                key={sentence.id}
                snippet={sentence}
                onViewDetail={() => navigation.navigate('SentenceDetail', { sentence })}
                sentenceLists={sentenceLists}
                sentenceListIds={currentSentenceListIds}
                onSaveToList={handleSaveToList}
                autoPlaying={autoPlaying}
              />
              <TypingInput
                target={sentence.japanese}
                onMatch={handleMatch}
                onAttempt={() => setAttempts((a) => a + 1)}
                onFocus={() =>
                  setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
                }
              />
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
                <Text style={styles.skipText}>Skip →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backText: { color: '#555', fontSize: 18, padding: 4 },
  roundText: { color: '#EFEFEF', fontSize: 15, fontWeight: '700' },
  diffBadge: {
    backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#333',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  diffText: { color: '#E85D3A', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  progressTrack: { height: 2, backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: '#E85D3A', borderRadius: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  instruction: { fontSize: 12, color: '#444', letterSpacing: 1.5, marginBottom: 16, textAlign: 'center' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 },
  loadingText: { color: '#555', fontSize: 14, letterSpacing: 1 },
  errorContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  errorTitle: { color: '#E85D3A', fontSize: 18, fontWeight: '700' },
  errorMessage: { color: '#555', fontSize: 13, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 20,
    paddingVertical: 10, borderWidth: 1, borderColor: '#333',
  },
  retryText: { color: '#EFEFEF', fontSize: 14 },
  skipButton: { marginTop: 20, alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#555', fontSize: 13, letterSpacing: 0.5 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#EFEFEF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonDiscard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonSave: {
    backgroundColor: '#E85D3A',
  },
  modalButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#FFF',
  },
});
