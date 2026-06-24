import Ionicons from "@expo/vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RoleSelectionScreen({
  userId,
  userEmail,
  onRoleSelected,
}) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clean up user name for greeting
  const userName = userEmail.split("@")[0].replace(/[._-]/g, " ");
  const displayName = userName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Handles saving the selected role to Firestore
  const handleConfirmRole = async () => {
    if (!selectedRole) {
      Alert.alert("Selection Required", "Please choose a role to proceed.");
      return;
    }

    setLoading(true);
    try {
      const userRef = firestore().collection("users").doc(userId);

      // Set initial profile document on Firestore
      const initialProfile =
        selectedRole === "student"
          ? {
              uid: userId,
              email: userEmail,
              displayName: displayName,
              role: "student",
              bio: "",
              collegeName: "",
              degree: "",
              gradYear: "",
              education: "",
              experience: "",
              skills: "", // comma separated list
              achievements: "",
              resumeUrl: "",
              resumeName: "",
              createdAt: firestore.FieldValue.serverTimestamp(),
            }
          : {
              uid: userId,
              email: userEmail,
              displayName: displayName,
              role: "recruiter",
              companyName: "",
              companyBio: "",
              createdAt: firestore.FieldValue.serverTimestamp(),
            };

      await userRef.set(initialProfile, { merge: true });
      onRoleSelected(selectedRole);
    } catch (error) {
      console.error("Error saving user role:", error);
      Alert.alert(
        "Error",
        "Failed to save your profile choice. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome, {displayName} 👋</Text>
          <Text style={styles.subtitle}>
            Please select how you would like to use CareerPilot
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.optionsContainer}>
          {/* Student Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "student" && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole("student")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                selectedRole === "student" && styles.selectedIconWrapper,
              ]}
            >
              <Ionicons
                name="school"
                size={32}
                color={selectedRole === "student" ? "#2563EB" : "#64748B"}
              />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.roleTitle}>I am a Student</Text>
              <Text style={styles.roleDescription}>
                Search and apply for internships, track application status, and
                build your career resume.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recruiter Card */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "recruiter" && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole("recruiter")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                selectedRole === "recruiter" && styles.selectedIconWrapper,
              ]}
            >
              <Ionicons
                name="briefcase"
                size={32}
                color={selectedRole === "recruiter" ? "#2563EB" : "#64748B"}
              />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.roleTitle}>I am a Recruiter</Text>
              <Text style={styles.roleDescription}>
                Post internship listings, view applicants, manage hiring
                pipelines, and hire top student talent.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, !selectedRole && styles.btnDisabled]}
            onPress={handleConfirmRole}
            disabled={loading || !selectedRole}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.btnText}>Continue</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 32,
  },
  header: {
    marginTop: 40,
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
    marginVertical: 40,
  },
  roleCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedRoleCard: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  selectedIconWrapper: {
    backgroundColor: "#DBEAFE",
  },
  cardTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  footer: {
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: "#94A3B8",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
