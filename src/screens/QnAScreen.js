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
  Icon,
} from "react-native-paper";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import EmptyQnA from "../components/EmptyQnA";

/* =====================
   🔑 SETTINGS KEYS
   ===================== */
const SETTINGS_KEYS = {
  HAPTICS: "haptics_enabled",
};

export default function QnAScreen({ route, navigation }) {
  const { reviewer } = route.params;
  const STORAGE_KEY = `reviewer_${reviewer.id}_qa`;

  const [qnas, setQnas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQna, setEditingQna] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isProUser, setIsProUser] = useState(false);

  /* =====================
     🔄 LOAD DATA + SETTINGS
     ===================== */
  useEffect(() => {
    loadQnA();
    loadSettings();
    setIsProUser(false);
  }, []);

  const loadSettings = async () => {
    const value = await AsyncStorage.getItem(SETTINGS_KEYS.HAPTICS);
    if (value !== null) {
      setHapticsEnabled(value === "true");
    }
  };

  /* =====================
     📳 HAPTIC HELPER
     ===================== */
  const triggerHaptic = async (type = "light") => {
    if (!hapticsEnabled) return;

    switch (type) {
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "warning":
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

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
  const openAddModal = async () => {
    await triggerHaptic("light");
    setEditingQna(null);
    setQuestion("");
    setAnswer("");
    setModalVisible(true);
  };

  const openEditModal = async (item) => {
    await triggerHaptic("light");
    setEditingQna(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setModalVisible(true);
  };

  const saveQnAItem = async () => {
    if (!question.trim() || !answer.trim()) return;

    await triggerHaptic("medium");

    let updated;
    if (editingQna) {
      updated = qnas.map((q) =>
        q.id === editingQna.id ? { ...q, question, answer } : q
      );
    } else {
      
      if (qnas.length >= 20 && !isProUser) {
        navigation.navigate("Paywall");
        return;
      }

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
    Alert.alert("Delete Q&A", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await triggerHaptic("warning");
          await saveQnA(qnas.filter((q) => q.id !== id));
        },
      },
    ]);
  };

  /* =====================
     👉 SWIPE ACTIONS
     ===================== */
  const renderRightActions = (item) => (
    <View style={styles.swipeActions}>
      <IconButton
        icon="pencil"
        iconColor="#1976d2"
        onPress={() => openEditModal(item)}
      />
      <IconButton
        icon="delete"
        iconColor="#d32f2f"
        onPress={() => deleteQnA(item.id)}
      />
    </View>
  );

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
      containerStyle={{ overflow: "visible" }}
    >
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon source="help-circle" size={20} color="#4A90E2" />
              </View>
              <Text style={styles.question}>{item.question}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon source="check-circle" size={20} color="#46923c" />
              </View>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Swipeable>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={styles.headerText}>
            {reviewer.title} Q&A
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* LIST */}
        <FlatList
          data={qnas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 140, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyQnA onPress={openAddModal} />}
        />

        {/* FAB */}
        {qnas.length > 0 && (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={openAddModal}
            backgroundColor="#4A90E2"
            color="#FFF"
          />
        )}

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
              style={{ marginBottom: 12, minHeight: 90 }}
            />

            <TextInput
              label="Answer"
              mode="outlined"
              value={answer}
              onChangeText={setAnswer}
              multiline
              style={{ marginBottom: 12, minHeight: 90 }}
            />

            <Button icon='check' mode="contained" onPress={saveQnAItem}>
              Save
            </Button>
            <Button icon='close' mode="text" style={{marginTop: 8}} onPress={async () => {
              await triggerHaptic();
              setModalVisible(false);
            }}>
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
    backgroundColor: "#FFF",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
  },
  headerText: {
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
  },
  cardWrapper: {
    paddingHorizontal: 2,
    marginBottom: 12,
    overflow: "visible",
  },
  card: {
    borderRadius: 14,
    backgroundColor: "#f6f6f6",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  iconWrap: {
    width: 32,
    alignItems: "center",
  },
  question: {
    flex: 1,
    fontWeight: "600",
    lineHeight: 20,
    fontWeight: 700
  },
  answer: {
    flex: 1,
    opacity: 0.7,
    lineHeight: 20,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    borderRadius: 14,
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
