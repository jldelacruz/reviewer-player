import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaywallScreen({ navigation }) {
  const [selected, setSelected] = useState("yearly");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.wrapper}>
        {/* CLOSE BUTTON */}
        <IconButton
          icon="close"
          size={22}
          style={styles.close}
          onPress={() => navigation.goBack()}
        />

        {/* ILLUSTRATION */}
        <Image
          source={require("../assets/images/5.png")}
          style={styles.image}
          resizeMode="contain"
        />

        {/* CONTENT CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>
            Upgrade to <Text style={{ color: "#4A90E2" }}>Pro</Text>
          </Text>

          <Text style={styles.subtitle}>
            Study unlimited. Listen unlimited.
            Master faster.
          </Text>

          {/* FEATURES LINK STYLE */}
          <Text style={styles.featuresLink}>
            + Unlimited Reviewers
          </Text>

          {/* YEARLY PLAN */}
          <TouchableOpacity
            style={[
              styles.plan,
              selected === "yearly" && styles.selectedPlan,
            ]}
            onPress={() => setSelected("yearly")}
          >
            <View>
              <Text style={styles.planTitle}>
                Yearly Plan 🔥
              </Text>
              <Text style={styles.planSub}>
                Best value • Save more
              </Text>
            </View>

            <Text style={styles.price}>$24.99</Text>
          </TouchableOpacity>

          {/* MONTHLY PLAN */}
          <TouchableOpacity
            style={[
              styles.plan,
              selected === "monthly" && styles.selectedPlan,
            ]}
            onPress={() => setSelected("monthly")}
          >
            <View>
              <Text style={styles.planTitle}>
                Monthly Plan
              </Text>
              <Text style={styles.planSub}>
                Flexible billing
              </Text>
            </View>

            <Text style={styles.price}>$3.99</Text>
          </TouchableOpacity>

          {/* LIFETIME */}
          <TouchableOpacity
            style={[
              styles.plan,
              selected === "lifetime" && styles.selectedPlan,
            ]}
            onPress={() => setSelected("lifetime")}
          >
            <View>
              <Text style={styles.planTitle}>
                Lifetime Access
              </Text>
              <Text style={styles.planSub}>
                One-time payment
              </Text>
            </View>

            <Text style={styles.price}>$49.99</Text>
          </TouchableOpacity>

          {/* CTA */}
          <Button
            mode="contained"
            style={styles.subscribeBtn}
            onPress={() => {
              // Hook up purchase logic later
              navigation.goBack();
            }}
          >
            Subscribe Now
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
  },
  illustrationBox: {
    alignItems: "center",
    marginTop: 60,
  },
  emoji: {
    fontSize: 60,
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.6,
    marginTop: 6,
    marginBottom: 16,
  },
  featuresLink: {
    textAlign: "center",
    color: "#4A90E2",
    marginBottom: 20,
    fontWeight: "600",
  },
  plan: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  selectedPlan: {
    borderColor: "#4A90E2",
    backgroundColor: "#F0F6FF",
  },
  planTitle: {
    fontWeight: "700",
    fontSize: 15,
  },
  planSub: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  price: {
    fontWeight: "800",
    fontSize: 16,
    color: "#4A90E2",
  },
  subscribeBtn: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: "#4A90E2",
  },
  link: {
    fontSize: 12,
    opacity: 0.6,
  },
  image: { height: 260, width: "100%", marginTop: 40 },
});
