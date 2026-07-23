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
import storage from "@react-native-firebase/storage";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";

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
  const [uploading, setUploading] = useState(false);

  // Pick a PDF document and upload it to Firebase Storage
  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      // User cancelled the picker, do nothing
      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      console.log("Starting resume upload. File details:", {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        size: file.size,
      });

      // Create a storage path: resumes/userId/timestamp.pdf
      const fileExtension = file.name.split(".").pop() || "pdf";
      const storagePath = `resumes/${userId}/${Date.now()}.${fileExtension}`;
      const reference = storage().ref(storagePath);

      // Upload file to storage and wait for snapshot
      const taskSnapshot = await reference.putFile(file.uri);

      console.log("Upload completed. Fetching download URL...");
      // Get download url from task snapshot reference
      const downloadUrl = await taskSnapshot.ref.getDownloadURL();

      // Update student user profile in firestore
      await firestore().collection("users").doc(userId).update({
        resumeUrl: downloadUrl,
        resumeName: file.name,
      });

      Alert.alert("Success 🎉", "Resume uploaded successfully!");
    } catch (error) {
      console.error("Error uploading resume:", error);
      
      let errorMessage = "Could not upload the resume. Please try again.";
      if (error.code === "storage/unauthorized") {
        errorMessage = "Permission denied. Please check your Firebase Storage security rules.";
      } else if (error.code === "storage/object-not-found" || error.message?.includes("object-not-found")) {
        errorMessage = "Storage bucket or file reference not found. Please ensure Firebase Storage is enabled in the Firebase Console.";
      }
      
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
    }
  };


  // Open the resume URL in browser
  const handleViewResume = async () => {
    if (profileData?.resumeUrl) {
      try {
        await WebBrowser.openBrowserAsync(profileData.resumeUrl);
      } catch (error) {
        console.error("Error opening resume browser:", error);
        Alert.alert("Error", "Could not open resume. Please try again.");
      }
    } else {
      Alert.alert("No Resume", "Please upload a resume first.");
    }
  };

  // Remove the resume from firestore fields
  const handleDeleteResume = async () => {
    Alert.alert(
      "Delete Resume",
      "Are you sure you want to remove your resume?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setUploading(true);
              await firestore().collection("users").doc(userId).update({
                resumeUrl: "",
                resumeName: "",
              });
              Alert.alert("Success", "Resume removed successfully.");
            } catch (error) {
              console.error("Error deleting resume:", error);
              Alert.alert("Error", "Could not remove resume. Please try again.");
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

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

      {/* Resume Section */}
      <View style={styles.infoSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Resume</Text>
        </View>

        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Uploading your resume...</Text>
          </View>
        ) : profileData?.resumeUrl ? (
          <View style={styles.resumeContainer}>
            <TouchableOpacity 
              style={styles.resumeCard}
              onPress={handleViewResume}
              activeOpacity={0.7}
            >
              <Ionicons name="document-attach" size={24} color="#2563EB" />
              <View style={styles.resumeInfo}>
                <Text style={styles.resumeName} numberOfLines={1}>
                  {profileData.resumeName || "Uploaded Resume"}
                </Text>
                <Text style={styles.resumeSubtext}>Tap to view resume</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteResumeButton}
              onPress={handleDeleteResume}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={styles.deleteResumeText}>Remove Resume</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadBox}
            onPress={handleUploadResume}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={32} color="#2563EB" />
            <Text style={styles.uploadTitle}>Upload your resume</Text>
            <Text style={styles.uploadSubtitle}>PDF format only</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
  },
  resumeContainer: {
    gap: 12,
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resumeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resumeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  resumeSubtext: {
    fontSize: 12,
    color: "#2563EB",
    marginTop: 2,
    fontWeight: "500",
  },
  deleteResumeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  deleteResumeText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 6,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#DBEAFE",
    borderStyle: "dashed",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 10,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});
