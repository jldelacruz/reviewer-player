import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import {
  Text,
  FAB,
  Card,
  TextInput,
  Button,
} from "react-native-paper";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const STORAGE_KEY = "reviewers";

export default function ReviewersScreen({navigation}) {

  const [reviewers, setReviewers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");

  // 🔄 Load reviewers
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadReviewers();
    });

    return unsubscribe;
  }, [navigation]);


  const loadReviewers = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const reviewersList = JSON.parse(stored);

    const reviewersWithCount = await Promise.all(
      reviewersList.map(async (reviewer) => {
        const qnaKey = `reviewer_${reviewer.id}_qa`;
        const qnaStored = await AsyncStorage.getItem(qnaKey);
        const qnaList = qnaStored ? JSON.parse(qnaStored) : [];

        return {
          ...reviewer,
          count: qnaList.length,
        };
      })
    );

    setReviewers(reviewersWithCount);
  };

  const saveReviewers = async (data) => {
    setReviewers(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // ➕ Create reviewer
  const createReviewer = async () => {
    if (!title.trim()) return;

    const newReviewer = {
      id: uuid.v4(),
      title: title.trim(),
    };


    const updated = [...reviewers, newReviewer];
    await saveReviewers(updated);

    setTitle("");
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() =>
        navigation.navigate("ReviewerDetails", { reviewer: item })
      }
    >
      <Card.Content>
        <Text variant="titleMedium">{item.title}</Text>
        <Text style={styles.countText}>
          {item.count} Q&A
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        <FlatList
          data={reviewers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No reviewers yet. Tap + to create one.
            </Text>
          }
        />

        {/* ➕ FAB */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        />

        {/* 🪟 CREATE MODAL */}
        <Modal
          transparent
          visible={modalVisible}
          animationType="fade"
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modal}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Create Reviewer
            </Text>

            <TextInput
              label="Reviewer title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              autoFocus
            />

            <Button
              mode="contained"
              onPress={createReviewer}
              style={{ marginTop: 16 }}
            >
              Create
            </Button>

            <Button
              mode="text"
              onPress={() => setModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f6f7fb",
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  countText: {
    marginTop: 4,
    opacity: 0.6,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    opacity: 0.5,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
  },
  modalTitle: {
    marginBottom: 12,
    fontWeight: "700",
  },
});