import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// individual job card
export default function InternshipCard({
  item,
  isSaved,
  isApplied,
  onPress,
  onSaveToggle,
  onApply,
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* header section */}
      <View style={styles.cardHeader}>
        <View style={styles.companyIconContainer}>
          <Text style={styles.companyIconText}>
            {item.company.charAt(0)}
          </Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCompany}>{item.company}</Text>
        </View>
        <TouchableOpacity
          style={styles.saveIcon}
          onPress={onSaveToggle}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? "#2563EB" : "#64748B"}
          />
        </TouchableOpacity>
      </View>

      {/* job tag badges */}
      <View style={styles.cardTags}>
        <View style={styles.tag}>
          <Ionicons name="location-outline" size={12} color="#64748B" />
          <Text style={styles.tagText}>{item.location}</Text>
        </View>
        <View style={styles.tag}>
          <Ionicons name="briefcase-outline" size={12} color="#64748B" />
          <Text style={styles.tagText}>{item.type}</Text>
        </View>
        <View style={styles.tag}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <Text style={styles.tagText}>{item.duration}</Text>
        </View>
      </View>

      {/* stipend and apply button */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.stipendLabel}>Stipend / Salary</Text>
          <Text style={styles.stipendValue}>{item.stipend}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.applyCardButton,
            isApplied && styles.appliedCardButton,
          ]}
          onPress={onApply}
        >
          <Text
            style={[
              styles.applyCardButtonText,
              isApplied && styles.appliedCardButtonText,
            ]}
          >
            {isApplied ? "Applied" : "Apply"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  companyIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardCompany: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 1,
  },
  saveIcon: {
    padding: 4,
  },
  cardTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 11,
    color: "#475569",
    marginLeft: 4,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  stipendLabel: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  stipendValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  applyCardButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  appliedCardButton: {
    backgroundColor: "#E2E8F0",
  },
  applyCardButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  appliedCardButtonText: {
    color: "#64748B",
  },
});
