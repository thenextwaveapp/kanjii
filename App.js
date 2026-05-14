import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider } from './src/contexts/SettingsContext';
import HomeScreen from './src/screens/HomeScreen';
import ModeSelectScreen from './src/screens/ModeSelectScreen';
import RoundSelectScreen from './src/screens/RoundSelectScreen';
import CollectionListScreen from './src/screens/CollectionListScreen';
import LessonListScreen from './src/screens/LessonListScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import StudyScreen from './src/screens/StudyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import KanjiDetailScreen from './src/screens/KanjiDetailScreen';

const Stack = createNativeStackNavigator();

const mockUser = { id: 'dev-user', email: 'dev@test.com' };

export default function App() {

  return (
    <SettingsProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}
        >
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
          <Stack.Screen name="RoundSelect" component={RoundSelectScreen} />
          <Stack.Screen name="CollectionList">
            {(props) => <CollectionListScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="LessonList">
            {(props) => <LessonListScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="Practice">
            {(props) => <PracticeScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="Summary">
            {(props) => <SummaryScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="Study">
            {(props) => <StudyScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} user={mockUser} />}
          </Stack.Screen>
          <Stack.Screen name="KanjiDetail">
            {(props) => <KanjiDetailScreen {...props} user={mockUser} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}
