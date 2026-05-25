import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { saveUserProfile, completeProfile } from '../services/profile';

const QUESTIONS = [
  {
    id: 'experience_level',
    title: "What's your Japanese level?",
    required: true,
    options: [
      { value: 'complete_beginner', label: 'Complete beginner', emoji: '🌱' },
      { value: 'know_kana', label: 'Know hiragana/katakana', emoji: '📝' },
      { value: 'know_some_kanji', label: 'Know some kanji (100-500)', emoji: '📚' },
      { value: 'intermediate', label: 'Intermediate (500-1000 kanji)', emoji: '🎓' },
      { value: 'advanced', label: 'Advanced (1000+ kanji)', emoji: '🏆' },
    ],
  },
  {
    id: 'learning_goal',
    title: "What's your main goal?",
    required: true,
    options: [
      { value: 'travel', label: 'Travel to Japan', emoji: '✈️' },
      { value: 'work', label: 'Work or business', emoji: '💼' },
      { value: 'entertainment', label: 'Anime, manga, games', emoji: '🎮' },
      { value: 'heritage', label: 'Connect with heritage/family', emoji: '👨‍👩‍👧' },
      { value: 'academic', label: 'Academic study', emoji: '🎓' },
      { value: 'general', label: 'General interest', emoji: '💡' },
    ],
  },
  {
    id: 'study_commitment',
    title: 'How much time can you study daily?',
    required: true,
    options: [
      { value: 'less_than_15', label: '<15 min/day', emoji: '⏱️' },
      { value: '15_plus', label: '15+ min/day', emoji: '⏰' },
      { value: '30_plus', label: '30+ min/day', emoji: '📅' },
      { value: '1_hour_plus', label: '1+ hour/day', emoji: '⏳' },
      { value: '2_hours_plus', label: '2+ hours/day', emoji: '🔥' },
    ],
  },
  {
    id: 'previous_study',
    title: 'Have you studied Japanese before?',
    required: true,
    options: [
      { value: 'never', label: 'Never studied before', emoji: '🆕' },
      { value: 'self_taught', label: 'Self-taught (apps/books)', emoji: '📱' },
      { value: 'classes', label: 'Took classes', emoji: '🏫' },
      { value: 'lived_in_japan', label: 'Lived in Japan', emoji: '🗾' },
      { value: 'native', label: 'Native speaker', emoji: '🗣️' },
    ],
  },
  {
    id: 'referral_source',
    title: 'How did you hear about us?',
    required: true,
    options: [
      { value: 'social_media', label: 'Social media', emoji: '📱' },
      { value: 'friend', label: 'Friend recommendation', emoji: '👥' },
      { value: 'app_store', label: 'App store search', emoji: '🔍' },
      { value: 'article', label: 'Article or blog', emoji: '📰' },
      { value: 'other', label: 'Other', emoji: '💭' },
    ],
  },
];

export default function UserProfileScreen({ navigation, user }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const question = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const canProceed = answers[question.id] || !question.required;
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    // Animate in when question changes
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestion]);

  const handleSelect = (value) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSkip = () => {
    if (!question.required) {
      handleNext();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    try {
      // Save all answers
      await saveUserProfile(user.id, answers);

      // Mark profile as completed
      await completeProfile(user.id);

      // Navigate to Home (contextual onboarding will start there)
      navigation.replace('Home');
    } catch (error) {
      console.error('Error saving profile:', error);
      // Still let them through even if save fails
      navigation.replace('Home');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with progress */}
      <View style={styles.header}>
        {currentQuestion > 0 ? (
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.questionCounter}>
          {currentQuestion + 1} / {QUESTIONS.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Question title */}
          <Text style={styles.questionTitle}>
            {question.title}
            {!question.required && (
              <Text style={styles.optionalBadge}> (Optional)</Text>
            )}
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        {!question.required && !answers[question.id] && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? "Complete" : "Next →"}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },
  backPlaceholder: {
    width: 60,
  },
  questionCounter: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#1A1A1A',
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#E85D3A',
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EFEFEF',
    marginBottom: 24,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  optionalBadge: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  options: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  optionCardSelected: {
    borderColor: '#E85D3A',
    backgroundColor: '#1A1A1A',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#AAA',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  optionLabelSelected: {
    color: '#EFEFEF',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E85D3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#E85D3A',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
