import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

// horizontal filter list
export default function CategoryPills({ selectedCategory, onSelectCategory }) {
  const categories = ["All", "Development", "Design", "Product", "Marketing"];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryPill,
            selectedCategory === cat && styles.activeCategoryPill,
          ]}
          onPress={() => onSelectCategory(cat)}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === cat && styles.activeCategoryText,
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    alignItems: "center",
    paddingRight: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  activeCategoryPill: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
});
