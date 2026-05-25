import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.42;

/**
 * Contextual onboarding tooltip component
 * Slides up from bottom with cards, page dots, and Next/Skip actions
 *
 * @param {boolean} visible - Whether tooltip is visible
 * @param {Array} cards - Array of { title, description } objects
 * @param {Function} onComplete - Called when user finishes or skips
 */
export default function OnboardingTooltip({ visible, cards = [], onComplete }) {
  const [currentPage, setCurrentPage] = useState(0);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up and fade in backdrop
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when hidden
      slideAnim.setValue(SHEET_HEIGHT);
      fadeAnim.setValue(0);
      setCurrentPage(0);
    }
  }, [visible]);

  const handleNext = () => {
    if (currentPage < cards.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Slide down
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  };

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentPage];
  const isLastCard = currentPage === cards.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <TouchableWithoutFeedback onPress={handleSkip}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header with Skip button */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>{currentCard.title}</Text>
                <Text style={styles.description}>{currentCard.description}</Text>
              </View>

              {/* Page Dots */}
              {cards.length > 1 && (
                <View style={styles.dotsContainer}>
                  {cards.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentPage && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Footer with Next button */}
              <View style={styles.footer}>
                {currentPage > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setCurrentPage(currentPage - 1)}
                  >
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastCard ? "Got it!" : "Next →"}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#EFEFEF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
    minHeight: SHEET_HEIGHT,
    maxHeight: SHEET_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: '#333',
    letterSpacing: 0.2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCC',
  },
  dotActive: {
    backgroundColor: '#E85D3A',
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
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
    minWidth: 120,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
