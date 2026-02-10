import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import BottomTabs from './BottomTabs';
import ReviewerPlayerScreen from '../screens/ReviewerPlayerScreen';
import QnAScreen from "../screens/QnAScreen";
import QuizScreen from "../screens/QuizScreen";
import QuizSummaryScreen from "../screens/QuizSummaryScreen";
import QuizStartScreen from "../screens/QuizStartScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="MainTabs" 
            component={BottomTabs} 
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="ReviewerDetails" 
            component={ReviewerPlayerScreen}
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="QuizStart" 
            component={QuizStartScreen}
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="Quiz" 
            component={QuizScreen}
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="QuizSummary" 
            component={QuizSummaryScreen}
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="QnA" 
            component={QnAScreen}
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigation;