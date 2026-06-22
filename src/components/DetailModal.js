import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// popup details sheet
export default function DetailModal({
  visible,
  internship,
  isSaved,
  isApplied,
  onClose,
  onSaveToggle,
  onApply,
}) {
  if (!internship) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* close and save buttons */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="chevron-down" size={24} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSaveToggle}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSaved ? "#2563EB" : "#64748B"}
              />
            </TouchableOpacity>
          </View>

          {/* details container */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
            {/* company info */}
            <View style={styles.modalCompanyRow}>
              <View style={styles.companyIconContainerLarge}>
                <Text style={styles.companyIconTextLarge}>
                  {internship.company.charAt(0)}
                </Text>
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.modalRoleTitle}>{internship.title}</Text>
                <Text style={styles.modalCompanyTitle}>{internship.company}</Text>
              </View>
            </View>

            {/* metadata tags */}
            <View style={styles.modalMetaRow}>
              <View style={styles.modalMetaItem}>
                <Ionicons name="location-outline" size={16} color="#475569" />
                <Text style={styles.modalMetaText}>{internship.location}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Ionicons name="briefcase-outline" size={16} color="#475569" />
                <Text style={styles.modalMetaText}>{internship.type}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Ionicons name="cash-outline" size={16} color="#475569" />
                <Text style={styles.modalMetaText}>{internship.stipend}</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Ionicons name="time-outline" size={16} color="#475569" />
                <Text style={styles.modalMetaText}>{internship.duration}</Text>
              </View>
            </View>

            {/* role description */}
            <View style={styles.detailsBlock}>
              <Text style={styles.detailsSectionTitle}>Role Description</Text>
              <Text style={styles.detailsBody}>{internship.description}</Text>
            </View>

            {/* requirements list */}
            <View style={styles.detailsBlock}>
              <Text style={styles.detailsSectionTitle}>Requirements</Text>
              {internship.requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#10B981"
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* footer submit button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalApplyButton,
                isApplied && styles.modalApplyButtonDisabled,
              ]}
              onPress={onApply}
            >
              <Text style={styles.modalApplyButtonText}>
                {isApplied ? "Applied Success!" : "Submit Application"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "85%",
    paddingTop: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalCloseButton: {
    padding: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  companyIconContainerLarge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconTextLarge: {
    fontSize: 26,
    fontWeight: "700",
    color: "#334155",
  },
  modalRoleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCompanyTitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  modalMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "47%",
    marginVertical: 4,
  },
  modalMetaText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
    fontWeight: "500",
  },
  detailsBlock: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  detailsBody: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  modalApplyButton: {
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalApplyButtonDisabled: {
    backgroundColor: "#10B981",
  },
  modalApplyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
