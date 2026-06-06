import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

// Screens
import StartupScreen from '../screens/StartupScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

// Activity Screens
import ParachuteScreen from '../screens/activities/ParachuteScreen';
import SoundHunterScreen from '../screens/activities/SoundHunterScreen';
import HandFanScreen from '../screens/activities/HandFanScreen';
import EarthquakeScreen from '../screens/activities/EarthquakeScreen';
import HumanPerformanceScreen from '../screens/activities/HumanPerformanceScreen';
import ReactionBoardScreen from '../screens/activities/ReactionBoardScreen';
import BreathingPaceScreen from '../screens/activities/BreathingPaceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Bottom Tab Navigator (shown after team setup) ──────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Activities: focused ? 'flask' : 'flask-outline',
            Leaderboard: focused ? 'trophy' : 'trophy-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Activities" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Tab.Navigator>
  );
}

// ── Root Stack Navigator ──────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Startup"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding */}
      <Stack.Screen
        name="Startup"
        component={StartupScreen}
        options={{ headerShown: false }}
      />

      {/* Main app tabs */}
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Activity screens */}
      <Stack.Screen
        name="Parachute"
        component={ParachuteScreen}
        options={{ title: 'Parachute Drop' }}
      />
      <Stack.Screen
        name="SoundHunter"
        component={SoundHunterScreen}
        options={{ title: 'Sound Pollution Hunter' }}
      />
      <Stack.Screen
        name="HandFan"
        component={HandFanScreen}
        options={{ title: 'Hand Fan Challenge' }}
      />
      <Stack.Screen
        name="Earthquake"
        component={EarthquakeScreen}
        options={{ title: 'Earthquake Structure' }}
      />
      <Stack.Screen
        name="HumanPerformance"
        component={HumanPerformanceScreen}
        options={{ title: 'Human Performance Lab' }}
      />
      <Stack.Screen
        name="ReactionBoard"
        component={ReactionBoardScreen}
        options={{ title: 'Reaction Board' }}
      />
      <Stack.Screen
        name="BreathingPace"
        component={BreathingPaceScreen}
        options={{ title: 'Breathing Pace Trainer' }}
      />
    </Stack.Navigator>
  );
}
