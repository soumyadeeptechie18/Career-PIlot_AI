import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { signOutWithGoogle } from "../services/googleAuth";

export default function RecruiterHomeScreen({ userId, userEmail }) {
  
  // Clean up user name for greeting
  const userName = userEmail.split("@")[0].replace(/[._-]/g, " ");
  const displayName = userName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Allows recruiter to reset role for testing
  const handleResetRole = async () => {
    Alert.alert(
      "Reset Role",
      "Are you sure you want to reset your role? You will be prompted to select a role on next reload.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("users").doc(userId).update({
                role: null,
              });
            } catch (err) {
              console.error("Error resetting role:", err);
            }
          },
        },
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    signOutWithGoogle();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header section */}
        <View style={styles.header}>
          <Text style={styles.title}>Recruiter Console</Text>
          <Text style={styles.subtitle}>Welcome back, {displayName}</Text>
        </View>

        {/* Dashboard Placeholder */}
        <View style={styles.dashboardCard}>
          <Ionicons name="construct-outline" size={48} color="#2563EB" />
          <Text style={styles.cardTitle}>Recruiter Dashboard</Text>
          <Text style={styles.cardDesc}>
            Under construction! In the next commits, we will build out the stats dashboard, internship posting form, and applicant manager.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetRole}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#2563EB" />
            <Text style={styles.resetButtonText}>Switch/Reset Role</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  dashboardCard: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 40,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  resetButton: {
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
