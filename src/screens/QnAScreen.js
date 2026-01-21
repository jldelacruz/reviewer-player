import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import {
  Text,
  FAB,
  Card,
  TextInput,
  Button,
  IconButton,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import EmptyQnA from "../components/EmptyQnA";

export default function QnAScreen({ route, navigation }) {
  const { reviewer } = route.params;
  const STORAGE_KEY = `reviewer_${reviewer.id}_qa`;

  const [qnas, setQnas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQna, setEditingQna] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    loadQnA();
  }, []);

  /* =====================
     📥 LOAD / SAVE
     ===================== */

  const loadQnA = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) setQnas(JSON.parse(stored));
  };

  const saveQnA = async (data) => {
    setQnas(data);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /* =====================
     ➕ ADD / ✏️ EDIT
     ===================== */

  const openAddModal = () => {
    setEditingQna(null);
    setQuestion("");
    setAnswer("");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingQna(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setModalVisible(true);
  };

  const saveQnAItem = async () => {
    if (!question.trim() || !answer.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let updated;

    if (editingQna) {
      updated = qnas.map((q) =>
        q.id === editingQna.id
          ? { ...q, question, answer }
          : q
      );
    } else {
      updated = [
        ...qnas,
        {
          id: uuid.v4(),
          question: question.trim(),
          answer: answer.trim(),
        },
      ];
    }

    await saveQnA(updated);
    setModalVisible(false);
  };

  /* =====================
     🗑️ DELETE
     ===================== */

  const deleteQnA = (id) => {
    Alert.alert(
      "Delete Q&A",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            const updated = qnas.filter((q) => q.id !== id);
            await saveQnA(updated);
          },
        },
      ]
    );
  };

  /* =====================
     🎴 RENDER ITEM
     ===================== */

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        {/* ACTION ICONS */}
        <View style={styles.cardActions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openEditModal(item);
            }}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#e53935"
            onPress={() => deleteQnA(item.id)}
          />
        </View>

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
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerText}>
            {reviewer.title}
          </Text>
        </View>

        {/* LIST */}
        <FlatList
          data={qnas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          ListEmptyComponent={<EmptyQnA onPress={openAddModal} />}
        />

        {/* FAB */}
        { qnas.count > 0 ? (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openAddModal();
            }}
          />
          ) : null
        }


        {/* MODAL */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <Pressable
            style={styles.overlay}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modal}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingQna ? "Edit Q&A" : "Add Q&A"}
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
              onPress={saveQnAItem}
              style={{ marginTop: 16 }}
            >
              Save
            </Button>

            <Button mode="text" onPress={() => setModalVisible(false)}>
              Cancel
            </Button>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* =====================
   🎨 STYLES
   ===================== */

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

  cardActions: {
    position: "absolute",
    top: -6,
    right: -6,
    flexDirection: "row",
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
