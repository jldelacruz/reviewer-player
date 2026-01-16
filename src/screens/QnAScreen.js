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
  IconButton,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

export default function QnAScreen({ route, navigation }) {
  const { reviewer } = route.params;

  const STORAGE_KEY = `reviewer_${reviewer.id}_qa`;

  const [qnas, setQnas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    loadQnA();
  }, []);

  // 📥 Load Q&A
  const loadQnA = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) setQnas(JSON.parse(stored));
  };

  // 💾 Save Q&A
  const saveQnA = async (data) => {
    setQnas(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // ➕ Create Q&A
  const createQnA = async () => {
    if (!question.trim() || !answer.trim()) return;

    const newItem = {
      id: uuid.v4(),
      question: question.trim(),
      answer: answer.trim(),
    };

    const updated = [...qnas, newItem];
    await saveQnA(updated);

    setQuestion("");
    setAnswer("");
    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <IconButton icon="help-circle-outline" size={20} />
          <Text style={styles.question}>{item.question}</Text>
        </View>

        <View style={styles.row}>
          <IconButton icon="check-circle-outline" size={20} />
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerText}>
            {reviewer.title}
          </Text>
        </View>

        {/* LIST */}
        <FlatList
          data={qnas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No Q&A yet. Tap + to add one.
            </Text>
          }
        />

        {/* FAB */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        />

        {/* CREATE MODAL */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <Pressable
            style={styles.overlay}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modal}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Add Q&A
            </Text>

            <TextInput
              label="Question"
              mode="outlined"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              style={{ marginBottom: 12, minHeight: 100 }}
            />

            <TextInput
              label="Answer"
              mode="outlined"
              value={answer}
              onChangeText={setAnswer}
              multiline
              numberOfLines={4}
              style={{ marginBottom: 12, minHeight: 100 }}
            />

            <Button
              mode="contained"
              onPress={createQnA}
              style={{ marginTop: 16 }}
            >
              Save
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  headerText: {
    fontWeight: "700",
  },

  card: {
    marginBottom: 12,
    borderRadius: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  question: {
    fontWeight: "600",
    flex: 1,
    marginTop: 6,
  },

  answer: {
    flex: 1,
    marginTop: 6,
    opacity: 0.7,
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
    top: "25%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
  },

  modalTitle: {
    marginBottom: 12,
    fontWeight: "700",
  },
});
