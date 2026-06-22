import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// bottom navigation tab bar
export default function TabBar({ activeTab, onTabChange }) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange("explore")}
      >
        <Ionicons
          name={activeTab === "explore" ? "search" : "search-outline"}
          size={22}
          color={activeTab === "explore" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "explore" && styles.activeTabLabel,
          ]}
        >
          Explore
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange("saved")}
      >
        <Ionicons
          name={activeTab === "saved" ? "bookmark" : "bookmark-outline"}
          size={22}
          color={activeTab === "saved" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "saved" && styles.activeTabLabel,
          ]}
        >
          Saved
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onTabChange("profile")}
      >
        <Ionicons
          name={activeTab === "profile" ? "person" : "person-outline"}
          size={22}
          color={activeTab === "profile" ? "#2563EB" : "#64748B"}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === "profile" && styles.activeTabLabel,
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: 58,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  activeTabLabel: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
