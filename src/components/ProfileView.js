import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// profile dashboard
export default function ProfileView({
  displayName,
  userEmail,
  appliedCount,
  savedCount,
  appliedInternships,
  onLogout,
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* user details card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarBig}>
          <Text style={styles.profileAvatarTextBig}>
            {displayName.charAt(0)}
          </Text>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>

        {/* count badges */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{appliedCount}</Text>
            <Text style={styles.statLabel}>Applied</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      {/* applied list */}
      <View style={styles.appliedSection}>
        <Text style={styles.sectionTitle}>Applied Internships</Text>
        {appliedInternships.length > 0 ? (
          appliedInternships.map((item) => (
            <View key={item.id} style={styles.appliedItemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedItemTitle}>{item.title}</Text>
                <Text style={styles.appliedItemCompany}>{item.company}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Under Review</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyAppliedContainer}>
            <Text style={styles.emptyAppliedText}>
              {"You haven't applied to any internships yet."}
            </Text>
          </View>
        )}
      </View>

      {/* logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  profileAvatarBig: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DBEAFE",
    marginBottom: 12,
  },
  profileAvatarTextBig: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2563EB",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 18,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  appliedSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  appliedItemCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  appliedItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  appliedItemCompany: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  emptyAppliedContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyAppliedText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginBottom: 30,
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
});
