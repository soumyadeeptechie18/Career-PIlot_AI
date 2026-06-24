import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { signOutWithGoogle } from "../services/googleAuth";

export default function RecruiterHomeScreen({ userId, userEmail }) {
  // Navigation tab: 'dashboard', 'notifications', or 'post_job'
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Dashboard states
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [totalApplicantsCount, setTotalApplicantsCount] = useState(0);

  // Notifications states
  const [notifications, setNotifications] = useState([]);

  // Form states for posting a new internship
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [stipend, setStipend] = useState("");
  const [duration, setDuration] = useState("");
  const [type, setType] = useState("Remote"); // Default type
  const [category, setCategory] = useState("Development"); // Default category
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState(""); // comma separated text
  const [submitting, setSubmitting] = useState(false);

  // Clean name for greeting
  const userName = userEmail.split("@")[0].replace(/[._-]/g, " ");
  const displayName = userName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // 1. Fetch recruiter's listings, total applicants, and notifications in real-time
  useEffect(() => {
    // Listen to internships posted by this recruiter
    const unsubscribeListings = firestore()
      .collection("internships")
      .where("recruiterId", "==", userId)
      .onSnapshot(
        (querySnapshot) => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
          }
          setMyListings(list);
          setLoadingListings(false);
        },
        (err) => {
          console.error("Error loading recruiter listings:", err);
          setLoadingListings(false);
        }
      );

    // Listen to applications sent to this recruiter's postings
    const unsubscribeApplicants = firestore()
      .collection("applications")
      .where("recruiterId", "==", userId)
      .onSnapshot(
        (querySnapshot) => {
          setTotalApplicantsCount(querySnapshot ? querySnapshot.size : 0);
        },
        (err) => {
          console.error("Error loading recruiter applications:", err);
        }
      );

    // Listen to notifications targeted to this recruiter
    const unsubscribeNotifications = firestore()
      .collection("notifications")
      .where("userId", "==", userId)
      .onSnapshot(
        (querySnapshot) => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
          }
          // Sort client-side by creation timestamp (descending) to avoid building indexes
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          setNotifications(list);
        },
        (err) => {
          console.error("Error loading notifications:", err);
        }
      );

    return () => {
      unsubscribeListings();
      unsubscribeApplicants();
      unsubscribeNotifications();
    };
  }, [userId]);

  // 2. Submit a new internship posting
  const handlePostInternship = async () => {
    // Validate required fields
    if (!title || !company || !location || !stipend || !duration || !description) {
      Alert.alert("Missing Fields", "Please fill in all details before posting.");
      return;
    }

    setSubmitting(true);
    try {
      // Split requirements by commas and clean empty lines
      const reqList = requirementsText
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const newListing = {
        title,
        company,
        location,
        stipend,
        duration,
        type,
        category,
        description,
        requirements: reqList.length > 0 ? reqList : ["Experience in the field"],
        postedAt: firestore.FieldValue.serverTimestamp(),
        recruiterId: userId,
      };

      // Add document to Firestore 'internships' collection
      await firestore().collection("internships").add(newListing);

      Alert.alert("Success 🎉", "Your internship listing is now live!");
      
      // Reset form fields
      setTitle("");
      setCompany("");
      setLocation("");
      setStipend("");
      setDuration("");
      setDescription("");
      setRequirementsText("");
      
      // Go back to dashboard tab
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Error posting internship:", err);
      Alert.alert("Error", "Could not post the internship. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset recruiter role (utility for development/testing)
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

  // Render individual posted internship card
  const renderListingCard = ({ item }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyLetter}>{item.company.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.listingTitle}>{item.title}</Text>
          <Text style={styles.listingCompany}>{item.company}</Text>
        </View>
      </View>
      <View style={styles.listingMeta}>
        <Text style={styles.metaLabel}>{item.type} • {item.location}</Text>
        <Text style={styles.metaStipend}>{item.stipend}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Recruiter Console</Text>
          <Text style={styles.headerSubtitle}>Hello, {displayName}</Text>
        </View>
        <TouchableOpacity onPress={handleResetRole} style={styles.resetIcon}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Main View Area */}
      <View style={styles.content}>
        
        {/* DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <View style={{ flex: 1 }}>
            {/* Quick Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{myListings.length}</Text>
                <Text style={styles.statLabel}>Active Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalApplicantsCount}</Text>
                <Text style={styles.statLabel}>Applicants</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your Posted Internships</Text>

            {loadingListings ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={myListings}
                keyExtractor={(item) => item.id}
                renderItem={renderListingCard}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No postings yet</Text>
                    <Text style={styles.emptyDesc}>
                      Click the "Post Job" tab below to add your first job opening.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* NOTIFICATIONS VIEW */}
        {activeTab === "notifications" && (
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <Ionicons name="mail" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyDesc}>
                    When students apply to your postings, you will see alerts here.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* POST JOB FORM VIEW */}
        {activeTab === "post_job" && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Create New Listing</Text>

            {/* Input Fields */}
            <Text style={styles.inputLabel}>Internship Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Software Engineering Intern"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CareerPilot AI"
              value={company}
              onChangeText={setCompany}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bangalore, India"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 6 Months"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Stipend</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ₹25,000 / month"
                  value={stipend}
                  onChangeText={setStipend}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Job Type</Text>
                {/* Simplified Segmented Picker */}
                <View style={styles.pickerRow}>
                  {["Remote", "Hybrid", "On-site"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.pickerPill, type === t && styles.pickerPillActive]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.pickerText, type === t && styles.pickerTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.pickerRow}>
              {["Development", "Design", "Product", "Marketing"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pickerPill, category === c && styles.pickerPillActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.pickerText, category === c && styles.pickerTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Role Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the duties, projects, and work environment..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Requirements (Comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="React Native, Java, Strong communication skills..."
              value={requirementsText}
              onChangeText={setRequirementsText}
              multiline
              numberOfLines={2}
            />

            {/* Post Submit Button */}
            <TouchableOpacity
              style={[styles.postButton, submitting && styles.postButtonDisabled]}
              onPress={handlePostInternship}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.postButtonText}>Post Internship Listing</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Recruiter Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("dashboard")}
        >
          <Ionicons
            name={activeTab === "dashboard" ? "grid" : "grid-outline"}
            size={22}
            color={activeTab === "dashboard" ? "#2563EB" : "#64748B"}
          />
          <Text style={[styles.tabLabel, activeTab === "dashboard" && styles.activeTabLabel]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("notifications")}
        >
          <Ionicons
            name={activeTab === "notifications" ? "notifications" : "notifications-outline"}
            size={22}
            color={activeTab === "notifications" ? "#2563EB" : "#64748B"}
          />
          <Text style={[styles.tabLabel, activeTab === "notifications" && styles.activeTabLabel]}>
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("post_job")}
        >
          <Ionicons
            name={activeTab === "post_job" ? "add-circle" : "add-circle-outline"}
            size={22}
            color={activeTab === "post_job" ? "#2563EB" : "#64748B"}
          />
          <Text style={[styles.tabLabel, activeTab === "post_job" && styles.activeTabLabel]}>
            Post Job
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => signOutWithGoogle()}>
          <Ionicons name="log-out-outline" size={22} color="#64748B" />
          <Text style={styles.tabLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  resetIcon: {
    padding: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  companyLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  listingCompany: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  listingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 10,
    marginTop: 12,
  },
  metaLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  metaStipend: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  notificationMessage: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pickerPillActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  pickerText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  pickerTextActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
  postButton: {
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  postButtonDisabled: {
    backgroundColor: "#94A3B8",
  },
  postButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    height: 58,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
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
