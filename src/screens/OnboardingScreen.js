import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  Image,
} from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Master What You Study",
    subtitle:
      "Turn your notes into powerful Q&A reviewers and remember them faster.",
    image: require("../assets/images/1.png"),
  },
  {
    id: "2",
    title: "Listen and Learn Anywhere",
    subtitle:
      "Absorb your study notes while listening on the go.",
    image: require("../assets/images/2.png"),
  },
  {
    id: "3",
    title: "Test Yourself Smartly",
    subtitle:
      "Built-in quizzes automatically measure if you've truly mastered the material.",
    image: require("../assets/images/3.png"),
  },
  {
    id: "4",
    title: "Ready to Level Up?",
    subtitle:
      "Create your first reviewer and start mastering your subjects today.",
    image: require("../assets/images/4.png"),
  },
];

export default function OnboardingScreen({ navigation }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  /* =========================
     📦 CREATE SAMPLE REVIEWERS
     ========================= */
  const createSampleReviewers = async () => {
    const alreadyCreated = await AsyncStorage.getItem(
      "default_reviewers_created"
    );

    if (alreadyCreated) return;

    const sampleReviewers = [
      {
        id: "sample_1",
        title: "How to Study Smarter",
        isSample: true,
      },
      {
        id: "sample_2",
        title: "Brain Warm-Up",
        isSample: true,
      },
    ];

    await AsyncStorage.setItem(
      "reviewers",
      JSON.stringify(sampleReviewers)
    );

    await AsyncStorage.setItem(
      "reviewer_sample_1_qa",
      JSON.stringify([
        {
          id: "1",
          question: "What is active recall?",
          answer:
            "Actively testing yourself instead of re-reading notes.",
        },
        {
          id: "2",
          question: "Why is spaced repetition effective?",
          answer:
            "It strengthens memory over time by reviewing at intervals.",
        },
        {
          id: "3",
          question: "How can listening help memory?",
          answer:
            "Audio repetition reinforces retention passively.",
        },
      ])
    );

    await AsyncStorage.setItem(
      "reviewer_sample_2_qa",
      JSON.stringify([
        {
          id: "1",
          question: "What is the capital of France?",
          answer: "Paris.",
        },
        {
          id: "2",
          question: "What is the powerhouse of the cell?",
          answer: "The mitochondria.",
        },
        {
          id: "3",
          question: "What year did World War II end?",
          answer: "1945.",
        },
      ])
    );

    await AsyncStorage.setItem(
      "default_reviewers_created",
      "true"
    );
  };

  const finishOnboarding = async () => {
    await createSampleReviewers();
    await AsyncStorage.setItem("onboarding_completed", "true");
    navigation.replace("MainTabs");
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
      });
    } else {
      await finishOnboarding();
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image
        source={item.image}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />

      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [
              width * (index - 1),
              width * index,
              width * (index + 1),
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, { opacity }]}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <Button mode="text" onPress={finishOnboarding}>
          Skip
        </Button>

        <Button mode="text" onPress={handleNext}>
          {currentIndex === slides.length - 1
            ? "Let's Begin"
            : "Next"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  slide: { width, padding: 40, justifyContent: "center" },
  image: { height: 260, width: "100%", marginBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#4A90E2",
    marginHorizontal: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
});
