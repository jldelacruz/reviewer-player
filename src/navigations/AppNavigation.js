import { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomTabs from "./BottomTabs";
import ReviewerPlayerScreen from "../screens/ReviewerPlayerScreen";
import QnAScreen from "../screens/QnAScreen";
import QuizScreen from "../screens/QuizScreen";
import QuizSummaryScreen from "../screens/QuizSummaryScreen";
import QuizStartScreen from "../screens/QuizStartScreen";
import SettingsScreen from "../screens/SettingsScreen";
import OnboardingScreen from "../screens/OnboardingScreen";

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const check = async () => {
      const value = await AsyncStorage.getItem("onboarding_completed");
      setShowOnboarding(true);
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return null; // or return <SplashScreen />

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
          />
        ) : null }
        <Stack.Screen
          name="MainTabs"
          component={BottomTabs}
        />
        <Stack.Screen
          name="ReviewerDetails"
          component={ReviewerPlayerScreen}
        />
        <Stack.Screen
          name="QuizStart"
          component={QuizStartScreen}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
        />
        <Stack.Screen
          name="QuizSummary"
          component={QuizSummaryScreen}
        />
        <Stack.Screen
          name="QnA"
          component={QnAScreen}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
