import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { signInWithGoogle } from "../services/googleAuth";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // redirects automatically
    } catch (error) {
      console.log("login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* logo and branding */}
      <View style={styles.brandContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="compass" size={54} color="#2563EB" />
        </View>
        <Text style={styles.title}>CareerPilot</Text>
        <Text style={styles.subtitle}>Your AI-Powered Internship Guide</Text>
      </View>

      {/* login buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="logo-google"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By signing in, you agree to our Terms and Conditions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#93bbdf",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  brandContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    // drop shadow styling
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 12,
    color: "#030f21",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
