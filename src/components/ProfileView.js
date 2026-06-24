import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import firestore from "@react-native-firebase/firestore";

export default function ProfileView({
  displayName,
  userEmail,
  appliedCount,
  savedCount,
  appliedInternships,
  onLogout,
  profileData,
  userId,
}) {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states initialized to profileData values or defaults
  const [editName, setEditName] = useState(displayName);
  const [editBio, setEditBio] = useState(profileData?.bio || "");
  const [editCollegeName, setEditCollegeName] = useState(profileData?.collegeName || "");
  const [editDegree, setEditDegree] = useState(profileData?.degree || "");
  const [editGradYear, setEditGradYear] = useState(profileData?.gradYear || "");
  const [editSkills, setEditSkills] = useState(profileData?.skills || "");
  const [editAchievements, setEditAchievements] = useState(profileData?.achievements || "");

  // Update form inputs to current database values when opening the modal
  const handleOpenEditModal = () => {
    setEditName(profileData?.displayName || displayName);
    setEditBio(profileData?.bio || "");
    setEditCollegeName(profileData?.collegeName || "");
    setEditDegree(profileData?.degree || "");
    setEditGradYear(profileData?.gradYear || "");
    setEditSkills(profileData?.skills || "");
    setEditAchievements(profileData?.achievements || "");
    setIsEditModalVisible(true);
  };

  // Save profile updates to Firebase Firestore
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Required Field", "Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      await firestore().collection("users").doc(userId).update({
        displayName: editName.trim(),
        bio: editBio.trim(),
        collegeName: editCollegeName.trim(),
        degree: editDegree.trim(),
        gradYear: editGradYear.trim(),
        skills: editSkills.trim(),
        achievements: editAchievements.trim(),
      });
      setIsEditModalVisible(false);
      Alert.alert("Success 🎉", "Your profile has been updated successfully.");
    } catch (error) {
      console.error("Error saving profile details:", error);
      Alert.alert("Error", "Could not save profile details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Convert comma separated skills into a list of pill tags
  const rawSkills = profileData?.skills || "";
  const skillsArray = rawSkills
    ? rawSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)
    : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* User Details & Summary Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarBig}>
          <Text style={styles.profileAvatarTextBig}>
            {(profileData?.displayName || displayName).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {profileData?.displayName || displayName}
        </Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>

        {profileData?.bio ? (
          <Text style={styles.profileBio}>{profileData.bio}</Text>
        ) : (
          <Text style={styles.profileBioPlaceholder}>No headline/bio added yet.</Text>
        )}

        {/* Edit Action Button */}
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={handleOpenEditModal}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Quick Stats Row */}
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

      {/* Education Information */}
      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Education</Text>
        </View>
        {profileData?.collegeName || profileData?.degree ? (
          <View style={styles.educationCard}>
            <Text style={styles.degreeText}>
              {profileData.degree || "Degree details unspecified"}
            </Text>
            <Text style={styles.collegeText}>
              {profileData.collegeName || "College details unspecified"}
            </Text>
            {profileData.gradYear ? (
              <Text style={styles.gradYearText}>
                Graduation Year: {profileData.gradYear}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>
              No education details added yet. Click Edit Profile to add college details.
            </Text>
          </View>
        )}
      </View>

      {/* Skills Section */}
      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="construct" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Skills</Text>
        </View>
        {skillsArray.length > 0 ? (
          <View style={styles.skillsContainer}>
            {skillsArray.map((skill, index) => (
              <View key={index} style={styles.skillPill}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>
              No skills added yet. Add comma-separated skills in Edit Profile.
            </Text>
          </View>
        )}
      </View>

      {/* Achievements / Projects Section */}
      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Achievements & Projects</Text>
        </View>
        {profileData?.achievements ? (
          <View style={styles.achievementsCard}>
            <Text style={styles.achievementsText}>{profileData.achievements}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>
              No achievements listed yet. Keep track of your awards or projects here.
            </Text>
          </View>
        )}
      </View>

      {/* Applied list */}
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

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Form Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Fields */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94A3B8"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.inputLabel}>Headline / Bio</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="e.g. Computer Science Student | Aspiring Web Dev"
                placeholderTextColor="#94A3B8"
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>School or College Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Stanford University"
                placeholderTextColor="#94A3B8"
                value={editCollegeName}
                onChangeText={setEditCollegeName}
              />

              <Text style={styles.inputLabel}>Degree / Course</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. B.Tech in Computer Science"
                placeholderTextColor="#94A3B8"
                value={editDegree}
                onChangeText={setEditDegree}
              />

              <Text style={styles.inputLabel}>Graduation Year</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2027"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={editGradYear}
                onChangeText={setEditGradYear}
              />

              <Text style={styles.inputLabel}>Skills (separated by commas)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="e.g. React Native, JavaScript, Firebase, Git"
                placeholderTextColor="#94A3B8"
                value={editSkills}
                onChangeText={setEditSkills}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Achievements & Projects</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput, { height: 90 }]}
                placeholder="e.g. Won Hackathon 2026, Built a chat app in React Native..."
                placeholderTextColor="#94A3B8"
                value={editAchievements}
                onChangeText={setEditAchievements}
                multiline
                numberOfLines={4}
              />

              {/* Form Submission Buttons */}
              {loading ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsEditModalVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveProfile}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveButtonText}>Save Details</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* Extra spacing at bottom to avoid keyboard overlap */}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  profileBio: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  profileBioPlaceholder: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 8,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },
  editProfileButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
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
  infoSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  educationCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  degreeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  collegeText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  gradYearText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "500",
  },
  achievementsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  achievementsText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillPill: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  skillText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyCardText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  appliedSection: {
    marginBottom: 16,
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
    borderColor: "#E2E8F0",
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
    borderColor: "#E2E8F0",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: "85%",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalForm: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#0F172A",
  },
  textAreaInput: {
    height: 60,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
