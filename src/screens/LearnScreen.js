import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import KanaPractice from '../components/KanaPractice';
import KanaTable from '../components/KanaTable';

const EXPLANATION_PAGES = [
  {
    title: 'Welcome to Kanjii',
    content: `Kanjii teaches you to **read and type Japanese** like a native speaker uses it digitally.

Unlike flashcard apps, you'll practice with **real sentences**, learning kanji in context while building muscle memory for typing Japanese.

📝 **JAPANESE WRITING SYSTEMS**

• **Hiragana** (ひらがな) - Native Japanese words
• **Katakana** (カタカナ) - Foreign words & emphasis
• **Kanji** (漢字) - Meaning characters

Let's learn how everything works! →`,
  },
  {
    title: 'Setup: Japanese Keyboard',
    content: `⚠️ **IMPORTANT:** You need a Japanese keyboard enabled on your phone.

📱 **iOS SETUP**

Settings → General → Keyboard → Keyboards → Add New Keyboard → **Japanese** (Romaji or Kana)

🤖 **ANDROID SETUP**

Settings → System → Languages & input → On-screen keyboard → Add keyboard → **Japanese**

⌨️ **THREE INPUT METHODS**

• **Romaji** - type "a-ri-ga-to-u"
• **Kana** - type directly in hiragana
• **Voice** - tap mic on keyboard 🎤

All three work perfectly in Kanjii!`,
  },
  {
    title: 'How Practice Works',
    content: `When you practice, you'll see a Japanese sentence with **highlighted words**.

**1️⃣ TAP** any word to reveal:
• Furigana (reading above)
• English meaning (below)

**2️⃣ TYPE or SPEAK** the sentence:
• Use your Japanese keyboard
• OR tap mic 🎤 to speak it
• Both methods work!

**3️⃣ TAP CHECK** to submit

**4️⃣ GET FEEDBACK:**
• **○ Perfect** - 100% correct
• **△ Good** - 80%+ correct
• **× Wrong** - Try again

💡 **TIP:** Tap 🔊 to hear native pronunciation`,
  },
  {
    title: 'The Mastery System',
    content: `Every kanji gets tracked with **three states:**

**○ MASTERED** (Blue)
You've typed this correctly. Keep it up!

**△ LEARNING** (Green)
You got it mostly right (80%+). Almost there!

**× NEEDS WORK** (Grey)
You skipped or got it wrong. Practice more!

📈 **PROGRESSION PATH**

× → △ → ○ as you improve
○ → △ if performance drops
△ → ○ when you type it perfectly

The app **automatically tracks** which kanji need more practice and targets them in drills.`,
  },
  {
    title: 'Practice Modes',
    content: `**Four ways to practice:**

📚 **COLLECTIONS**
Curated lesson paths (N5 Foundation, Travel, Business, etc.) with ordered sentences.
→ Perfect for structured learning

🎯 **DOMAIN PRACTICE**
Choose a topic (Food, Tech, News, etc.) and practice random sentences.
→ Pick JLPT level & rounds (5-20)

💪 **WEAK KANJI DRILLS**
The app finds your 5 weakest kanji (skipped or seen <3 times) and generates targeted practice.
→ Smart automatic targeting

🔄 **SENTENCE RE-PRACTICE**
Tap any sentence in Study → Sentences to practice it again.
→ Perfect for improving △ to ○`,
  },
  {
    title: 'Study: Your Progress',
    content: `**Two tabs in the Study screen:**

📖 **KANJI TAB**
Your personal kanji dictionary that grows as you practice.

**Shows:**
• Every kanji you've encountered
• Meanings & readings (tap 🔊)
• Your stats (seen/skip counts)
• Mastery state (○/△/×)
• Example words from your practice

**Search by:** kanji, English, hiragana, katakana, or romaji

**Filter by:** All | Needs work | Mastered

📝 **SENTENCES TAB**
Last 60 completed sentences with practice stats.
→ Create custom lists to organize by topic`,
  },
  {
    title: 'Kanji Details',
    content: `**Tap any kanji** in the Study tab to see:

📚 **Meanings & Readings**
Tap 🔊 to hear pronunciation

✍️ **Animated Stroke Order**
Watch how to write it correctly

💬 **Example Words**
Words containing this kanji

📄 **Example Sentences**
From your practice sessions

📊 **Your Personal Stats**
Seen count, skip count, mastery

🎓 **JLPT Level**
Difficulty classification

→ Everything you need in one place!`,
  },
  {
    title: 'Streaks & Progress',
    content: `🏠 **HOME SCREEN SHOWS:**

• 🔥 Current streak (practice daily!)
• 🏆 Longest streak ever
• 漢 Total kanji encountered
• ✓ Total correct answers

📊 **THE APP TRACKS:**

• Daily activity for streaks
• Completion stats per sentence
• Mastery progression over time
• JLPT level distribution (N5→N1)

📈 **AFTER EACH PRACTICE:**
Check the **Summary screen** for detailed results showing what you mastered, what needs work, and your time per round.`,
  },
  {
    title: 'Settings & Tips',
    content: `⚙️ **CUSTOMIZE YOUR EXPERIENCE**

🔊 **VOICE**
• Choose Female or Male voice
• Adjust speech rate (0.5x - 1.5x)
• Test with こんにちは

📏 **TEXT SIZE**
Scale from Small to XL

💡 **TIPS FOR SUCCESS**

✓ Practice **daily** (even 5 minutes!)
✓ Use tap-to-reveal **freely** - it helps!
✓ Voice input = speaking practice
✓ Don't skip - **try typing** even if unsure
✓ Review weak kanji regularly
✓ Use collections for structured paths`,
  },
  {
    title: 'Japanese Learning Starts Here',
    content: `🎌 **YOU'RE ABOUT TO DO SOMETHING AMAZING**

Learning Japanese isn't just studying—it's unlocking a whole new world. Every kanji you master, every sentence you type, brings you closer to:

📱 Reading Japanese apps and games
🎬 Watching anime without subtitles
✈️ Traveling Japan independently
💬 Connecting with 125+ million speakers
🎯 Achieving what most people only dream of

**THE BEST PART?**

You don't need to be "good at languages." You just need to show up. Five minutes today. Ten minutes tomorrow. Every tap, every keystroke, every mistake is progress.

🔥 **YOUR STREAK STARTS WITH ONE DAY**

The app tracks everything. Your weak kanji get targeted. Your progress is measured. All you have to do is practice.

**一歩一歩 (ippo ippo)**
*One step at a time.*

That's how you climb mountains. That's how you learn Japanese.

🚀 **LET'S GO!**
Head to Home → Practice and type your first sentence.`,
  },
];

export default function LearnScreen({ navigation }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showKanaTable, setShowKanaTable] = useState(false);
  const [showKanaPractice, setShowKanaPractice] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = () => {
    if (currentPage < EXPLANATION_PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setShowExplanation(false);
      setCurrentPage(0);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>
            Kanj<Text style={styles.logoAccent}>ii</Text>
          </Text>
        </View>

        <Text style={styles.subtitle}>
          New to Japanese? Start here.
        </Text>

        {/* Section 1: How Kanjii Works */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowExplanation(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📚</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>How Kanjii Works</Text>
            <Text style={styles.cardDescription}>
              Learn how to use the app and Japanese writing systems
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Section 2: Kana Study */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowKanaTable(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>📋</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Kana Study</Text>
            <Text style={styles.cardDescription}>
              Reference tables for hiragana and katakana
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Section 3: Kana Practice */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowKanaPractice(true)}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>✏️</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Kana Practice</Text>
            <Text style={styles.cardDescription}>
              Practice typing hiragana and katakana
            </Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Kana Table Modal */}
      <Modal
        visible={showKanaTable}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowKanaTable(false)}
      >
        <KanaTable onClose={() => setShowKanaTable(false)} />
      </Modal>

      {/* Explanation Modal */}
      <Modal
        visible={showExplanation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExplanation(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowExplanation(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              {currentPage + 1} / {EXPLANATION_PAGES.length}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {currentPage === 0 ? (
              <Text style={styles.pageTitle}>
                Welcome to Kanj<Text style={styles.logoAccent}>ii</Text>
              </Text>
            ) : (
              <Text style={styles.pageTitle}>
                {EXPLANATION_PAGES[currentPage].title}
              </Text>
            )}
            <Markdown style={markdownStyles}>
              {EXPLANATION_PAGES[currentPage].content}
            </Markdown>
          </ScrollView>

          <View style={styles.modalFooter}>
            {currentPage > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={prevPage}>
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={nextPage}
            >
              <Text style={styles.navButtonTextPrimary}>
                {currentPage === EXPLANATION_PAGES.length - 1 ? 'Done' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Kana Practice Modal */}
      <Modal
        visible={showKanaPractice}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowKanaPractice(false)}
      >
        <KanaPractice onClose={() => setShowKanaPractice(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: { color: '#555', fontSize: 14 },
  logo: {
    fontSize: 20,
    color: '#EFEFEF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#E85D3A',
  },
  subtitle: {
    color: '#888',
    fontSize: 15,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#EFEFEF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  arrow: {
    color: '#E85D3A',
    fontSize: 20,
    marginLeft: 8,
  },

  // Modal styles
  modalSafe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  modalClose: {
    color: '#555',
    fontSize: 24,
    fontWeight: '300',
  },
  pageIndicator: {
    color: '#E85D3A',
    fontSize: 13,
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
    paddingTop: 40,
  },
  pageTitle: {
    color: '#EFEFEF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  navButtonPrimary: {
    backgroundColor: '#E85D3A',
    borderColor: '#E85D3A',
  },
  navButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  navButtonTextPrimary: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

const markdownStyles = {
  body: {
    color: '#AAA',
    fontSize: 17,
    lineHeight: 28,
  },
  strong: {
    color: '#EFEFEF',
    fontWeight: '700',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
    color: '#AAA',
    fontSize: 17,
    lineHeight: 28,
  },
  bullet_list: {
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 6,
  },
};
