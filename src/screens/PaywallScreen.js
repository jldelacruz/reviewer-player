import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Icon } from "react-native-paper";
import { Text, Button, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Purchases from 'react-native-purchases';

export default function PaywallScreen({ navigation }) {
  const [selected, setSelected] = useState("yearly");
  const [packages, setPackages] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.log("Error fetching offerings:", e);
      }
    };

    loadProducts();
  }, []);

  // const startTrial = async () => {
  //   const now = Date.now();
  //   await AsyncStorage.setItem("trial_start_date", now.toString());
  // };

  const subscribeToPro = async () => {
    try {
      if (!packages) return;

      let selectedPackage;

      if (selected === "monthly") {
        selectedPackage = packages.find(p => p.identifier === "$rc_monthly");
      } else {
        selectedPackage = packages.find(p => p.identifier === "$rc_annual");
      }

      if (!selectedPackage) {
        console.log("Package not found");
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      if (customerInfo.entitlements.active["Recally AI Pro"]) {
        // console.log("✅ User is now Recally AI Pro!");
        Alert.alert(
          "Subscription Successful",
          "Successfully subscribed to Recally AI Pro! Enjoy unlimited reviewers, Q&A and AI features.",
          [
            { text: "Ok", onPress: () => navigation.goBack() }
          ]
        );
      }

    } catch (e) {
      if (!e.userCancelled) {
        console.log("Purchase error:", e);
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active["Recally AI Pro"]) {
        alert("✅ Subscription restored!");
        navigation.goBack();
      } else {
        alert("⚠️No active subscription found.");
      }

    } catch (e) {
      console.log("Restore error:", e);
      alert("Something went wrong while restoring.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        {/* CLOSE */}
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

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>
            Upgrade to <Text style={{ color: "#4A90E2" }}>Pro</Text>
          </Text>

          <Text style={styles.subtitle}>
            Unlock unlimited reviewers and Q&A.
            Study without limits.
          </Text>

          {/* FEATURES */}
          <View style={styles.featureList}>
            <Text style={styles.feature}><Icon source='book-open-variant' size={15} /> Unlimited Reviewers</Text>
            <Text style={styles.feature}><Icon source='list-status' size={15} />  Unlimited Q&A</Text>
            {/* <Text style={styles.feature}><Icon source='headphones' size={15} /> Background Play</Text> */}
            <Text style={styles.feature}><Icon source='rocket-launch' size={15} /> Future Premium Features</Text>
          </View>

          {/* PLANS ROW */}
          <View style={styles.planRow}>
            {/* MONTHLY */}
            <TouchableOpacity
              style={[
                styles.planBox,
                selected === "monthly" && styles.selectedPlan,
              ]}
              onPress={() => setSelected("monthly")}
            >
              <Text style={styles.planLabel}>Monthly</Text>
              <Text style={styles.planPrice}>$4.99</Text>
              <Text style={styles.planSub}>per month</Text>
            </TouchableOpacity>

            {/* YEARLY */}
            <TouchableOpacity
              style={[
                styles.planBox,
                selected === "yearly" && styles.selectedPlan,
              ]}
              onPress={() => setSelected("yearly")}
            >
              {/* DISCOUNT BADGE */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Save 40%</Text>
              </View>

              <Text style={styles.planLabel}>Yearly</Text>
              <Text style={styles.planPrice}>$39.99</Text>
              <Text style={styles.planSub}>Free for 7 days, then $39.99/year</Text>
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <Button
            mode="contained"
            style={styles.subscribeBtn}
            contentStyle={{ paddingVertical: 6 }}
            onPress={subscribeToPro}
            >
            {selected === 'yearly' ? 'Start 7-Day Unlimited Free Trial' : 'Subscribe Monthly'}
          </Button>

          <Text style={styles.trialNote}>
            No charge today • Cancel anytime
          </Text>

          {/* RESTORE BUTTON */}
          <TouchableOpacity onPress={restorePurchases}>
            <Text style={styles.restoreText}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },
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
  image: {
    height: 240,
    width: "100%",
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
  featureList: {
    marginBottom: 20,
  },
  feature: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 4,
    opacity: 0.8,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  planBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 5,
    alignItems: "center",
    position: "relative",
  },
  selectedPlan: {
    borderColor: "#4A90E2",
    backgroundColor: "#F0F6FF",
  },
  badge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#4A90E2",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  planLabel: {
    fontWeight: "700",
    fontSize: 15,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4A90E2",
    marginTop: 4,
  },
  planSub: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  subscribeBtn: {
    borderRadius: 18,
    backgroundColor: "#4A90E2",
  },
  trialNote: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
  },
  restoreText: {
    textAlign: "center",
    fontSize: 13,
    opacity: 0.6,
    marginTop: 12,
    textDecorationLine: "underline",
  },
});
