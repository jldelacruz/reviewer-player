import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

import BottomTabs from './BottomTabs';
import ReviewerDetailsScreen from '../screens/ReviewerDetailsScreen';
import QnAScreen from "../screens/QnAScreen";
import QuizScreen from "../screens/QuizScreen";

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabs} 
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="ReviewerDetails" 
          component={ReviewerDetailsScreen}
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="QnA" 
          component={QnAScreen}
          options={{ headerShown: false }} 
        />

        <Stack.Screen 
          name="Quiz" 
          component={QuizScreen}
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;