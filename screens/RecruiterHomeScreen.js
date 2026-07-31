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
  Modal,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { signOutWithGoogle } from "../services/googleAuth";

export default function RecruiterHomeScreen({ userId, userEmail }) {
  // Navigation tab: 'dashboard', 'notifications', or 'post_job'
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Dashboard states
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [totalApplicantsCount, setTotalApplicantsCount] = useState(0);

  // Selected Internship and Applicant states
  const [selectedListing, setSelectedListing] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantProfile, setApplicantProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Interview scheduling states
  const [showSchedulingForm, setShowSchedulingForm] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

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

  // 2. Fetch applications for the selected internship in real-time
  useEffect(() => {
    if (!selectedListing) {
      setApplicants([]);
      return;
    }

    setLoadingApplicants(true);
    const unsubscribe = firestore()
      .collection("applications")
      .where("internshipId", "==", selectedListing.id)
      .where("recruiterId", "==", userId)
      .onSnapshot(
        (querySnapshot) => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
          }
          // Sort by applied date descending
          list.sort((a, b) => {
            const timeA = a.appliedAt?.seconds || 0;
            const timeB = b.appliedAt?.seconds || 0;
            return timeB - timeA;
          });
          setApplicants(list);
          setLoadingApplicants(false);
        },
        (err) => {
          console.error("Error loading internship applications:", err);
          setLoadingApplicants(false);
        }
      );

    return unsubscribe;
  }, [selectedListing]);

  // 3. Fetch the selected applicant's full profile details in real-time
  useEffect(() => {
    setShowSchedulingForm(false);
    setInterviewDate("");
    setInterviewTime("");
    setInterviewLink("");
    setInterviewNotes("");

    if (!selectedApplicant) {
      setApplicantProfile(null);
      return;
    }

    setLoadingProfile(true);
    const unsubscribe = firestore()
      .collection("users")
      .doc(selectedApplicant.studentId)
      .onSnapshot(
        (docSnapshot) => {
          if (docSnapshot.exists) {
            setApplicantProfile(docSnapshot.data());
          } else {
            setApplicantProfile(null);
          }
          setLoadingProfile(false);
        },
        (err) => {
          console.error("Error loading applicant profile details:", err);
          setLoadingProfile(false);
        }
      );

    return unsubscribe;
  }, [selectedApplicant]);

  // 4. Update application status and dispatch notification to student
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await firestore().collection("applications").doc(applicationId).update({
        status: newStatus,
      });

      // Send a notification to the student user
      if (selectedApplicant) {
        await firestore().collection("notifications").add({
          userId: selectedApplicant.studentId,
          title: "Application Status Update",
          message: `Your application for the "${selectedListing.title}" internship at "${selectedListing.company}" has been updated to: ${newStatus}.`,
          read: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert("Success", `Application marked as ${newStatus}.`);
    } catch (err) {
      console.error("Error updating application status:", err);
      Alert.alert("Error", "Could not update status. Please try again.");
    }
  };

  // save interview and notify student
  const handleConfirmScheduleInterview = async () => {
    if (!interviewDate.trim() || !interviewTime.trim()) {
      Alert.alert("Required Fields", "Please enter a date and time for the interview.");
      return;
    }

    if (!selectedApplicant) return;

    try {
      // update status in applications collection
      await firestore().collection("applications").doc(selectedApplicant.id).update({
        status: "Interview Scheduled",
        interview: {
          date: interviewDate.trim(),
          time: interviewTime.trim(),
          link: interviewLink.trim(),
          notes: interviewNotes.trim(),
          scheduledAt: firestore.FieldValue.serverTimestamp(),
        }
      });

      // add alert document for candidate
      await firestore().collection("notifications").add({
        userId: selectedApplicant.studentId,
        title: "Interview Scheduled! 📅",
        message: `Your interview for the "${selectedListing.title}" internship at "${selectedListing.company}" has been scheduled for ${interviewDate.trim()} at ${interviewTime.trim()}.\nMeeting Link/Location: ${interviewLink.trim() || "Unspecified"}`,
        read: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert("Success 🎉", "Interview scheduled successfully and candidate notified!");
      setShowSchedulingForm(false);
    } catch (err) {
      console.error("Error scheduling interview:", err);
      Alert.alert("Error", "Could not schedule interview. Please try again.");
    }
  };

  // open resume link in external browser
  const handleOpenResume = () => {
    const resumeUrl = (selectedApplicant?.resumeUrl && selectedApplicant.resumeUrl !== "Profile Application")
      ? selectedApplicant.resumeUrl
      : (applicantProfile?.resumeUrl && applicantProfile.resumeUrl !== "Profile Application" ? applicantProfile.resumeUrl : null);

    if (resumeUrl) {
      WebBrowser.openBrowserAsync(resumeUrl);
    } else {
      Alert.alert("No Resume", "This candidate has no uploaded resume.");
    }
  };

  // 6. Submit a new internship posting
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
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => setSelectedListing(item)}
      activeOpacity={0.8}
    >
      <View style={styles.listingHeader}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyLetter}>{item.company.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.listingTitle}>{item.title}</Text>
          <Text style={styles.listingCompany}>{item.company}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
      <View style={styles.listingMeta}>
        <Text style={styles.metaLabel}>{item.type} • {item.location}</Text>
        <Text style={styles.metaStipend}>{item.stipend}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render individual applicant card in job details screen
  const renderApplicantCard = ({ item }) => {
    let badgeBg = "#EFF6FF";
    let badgeText = "#2563EB";

    if (item.status === "Shortlisted") {
      badgeBg = "#ECFDF5";
      badgeText = "#059669";
    } else if (item.status === "Rejected") {
      badgeBg = "#FEF2F2";
      badgeText = "#EF4444";
    } else if (item.status === "Reviewed") {
      badgeBg = "#F1F5F9";
      badgeText = "#475569";
    }

    return (
      <TouchableOpacity
        style={styles.applicantCard}
        onPress={() => setSelectedApplicant(item)}
        activeOpacity={0.8}
      >
        <View style={styles.applicantHeader}>
          <View style={styles.applicantAvatar}>
            <Text style={styles.avatarLetter}>
              {item.studentName ? item.studentName.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.applicantName}>{item.studentName}</Text>
            <Text style={styles.applicantEmail}>{item.studentEmail}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.statusText, { color: badgeText }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.applicantFooter}>
          <Text style={styles.appliedAtText}>
            Applied: {item.appliedAt ? new Date(item.appliedAt.seconds * 1000).toLocaleDateString() : "Recently"}
          </Text>
          <Text style={styles.viewProfileLink}>Review Candidate →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Convert comma separated skills into a list of pill tags
  const rawSkills = applicantProfile?.skills || "";
  const skillsArray = rawSkills
    ? rawSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

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
            {selectedListing ? (
              // Sub-view: List of applicants for a selected job
              <View style={{ flex: 1 }}>
                <View style={styles.subHeader}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setSelectedListing(null)}
                  >
                    <Ionicons name="arrow-back" size={16} color="#2563EB" />
                    <Text style={styles.backButtonText}>Back to Listings</Text>
                  </TouchableOpacity>
                  <Text style={styles.selectedJobTitle}>{selectedListing.title}</Text>
                  <Text style={styles.selectedJobCompany}>{selectedListing.company}</Text>
                </View>

                <Text style={styles.sectionTitle}>Applicants ({applicants.length})</Text>

                {loadingApplicants ? (
                  <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 20 }} />
                ) : (
                  <FlatList
                    data={applicants}
                    keyExtractor={(item) => item.id}
                    renderItem={renderApplicantCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>No applicants yet</Text>
                        <Text style={styles.emptyDesc}>
                          Candidates applying for this internship listing will show up here.
                        </Text>
                      </View>
                    }
                  />
                )}
              </View>
            ) : (
              // Main-view: List of recruiter's postings
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
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CareerPilot AI"
              placeholderTextColor="#94A3B8"
              value={company}
              onChangeText={setCompany}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bangalore, India"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 6 Months"
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
                  value={stipend}
                  onChangeText={setStipend}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Job Type</Text>
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
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Requirements (Comma separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="React Native, Java, Strong communication skills..."
              placeholderTextColor="#94A3B8"
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
          onPress={() => {
            setActiveTab("dashboard");
            setSelectedListing(null);
          }}
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

      {/* Applicant Full Profile Detail Review Modal */}
      <Modal
        visible={selectedApplicant !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedApplicant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Candidate</Text>
              <TouchableOpacity onPress={() => setSelectedApplicant(null)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {loadingProfile ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {/* Candidate Overview Card */}
                <View style={styles.modalCandidateCard}>
                  <View style={styles.modalAvatarBig}>
                    <Text style={styles.modalAvatarTextBig}>
                      {selectedApplicant?.studentName ? selectedApplicant.studentName.charAt(0).toUpperCase() : "S"}
                    </Text>
                  </View>
                  <Text style={styles.modalCandidateName}>{selectedApplicant?.studentName}</Text>
                  <Text style={styles.modalCandidateEmail}>{selectedApplicant?.studentEmail}</Text>
                  {applicantProfile?.bio ? (
                    <Text style={styles.modalCandidateBio}>{applicantProfile.bio}</Text>
                  ) : (
                    <Text style={styles.modalCandidateBioPlaceholder}>No headline/bio added.</Text>
                  )}
                </View>
                {/* Candidate Resume Section */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="document-text" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Candidate Resume</Text>
                  </View>
                  {(() => {
                    const resumeUrl = (selectedApplicant?.resumeUrl && selectedApplicant.resumeUrl !== "Profile Application")
                      ? selectedApplicant.resumeUrl
                      : (applicantProfile?.resumeUrl && applicantProfile.resumeUrl !== "Profile Application" ? applicantProfile.resumeUrl : null);
                    
                    const resumeName = (selectedApplicant?.resumeUrl && selectedApplicant.resumeUrl !== "Profile Application")
                      ? (selectedApplicant.resumeName || "resume.pdf")
                      : (applicantProfile?.resumeName || "resume.pdf");

                    return resumeUrl ? (
                      <TouchableOpacity
                        style={styles.resumeDownloadCard}
                        onPress={handleOpenResume}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="document-attach" size={24} color="#2563EB" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.resumeFilename}>
                            {resumeName}
                          </Text>
                          <Text style={styles.resumeFilesize}>Tap to view/download file</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color="#64748B" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.emptyInfoCard}>
                        <Text style={styles.emptyInfoText}>This candidate has not uploaded a resume yet.</Text>
                      </View>
                    );
                  })()}
                </View>

                {/* Candidate Education Section */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="school" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Education Details</Text>
                  </View>
                  {applicantProfile?.collegeName || applicantProfile?.degree ? (
                    <View style={styles.educationDetailCard}>
                      <Text style={styles.modalDegreeText}>
                        {applicantProfile.degree || "Degree details unspecified"}
                      </Text>
                      <Text style={styles.modalCollegeText}>
                        {applicantProfile.collegeName || "College details unspecified"}
                      </Text>
                      {applicantProfile.gradYear ? (
                        <Text style={styles.modalGradYearText}>
                          Graduation Year: {applicantProfile.gradYear}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.emptyInfoCard}>
                      <Text style={styles.emptyInfoText}>No education details listed.</Text>
                    </View>
                  )}
                </View>

                {/* Candidate Skills Section */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="construct" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Skills</Text>
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
                    <View style={styles.emptyInfoCard}>
                      <Text style={styles.emptyInfoText}>No skills listed.</Text>
                    </View>
                  )}
                </View>

                {/* Candidate Achievements Section */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="trophy" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSectionTitle}>Achievements & Projects</Text>
                  </View>
                  {applicantProfile?.achievements ? (
                    <View style={styles.achievementsDetailCard}>
                      <Text style={styles.modalAchievementsText}>
                        {applicantProfile.achievements}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptyInfoCard}>
                      <Text style={styles.emptyInfoText}>No achievements/projects listed.</Text>
                    </View>
                  )}
                </View>

                {/* Recruiter Review Status Actions */}
                <View style={styles.statusReviewSection}>
                  <Text style={styles.statusReviewTitle}>Set Application Status</Text>
                  <View style={styles.statusButtonContainer}>
                    <TouchableOpacity
                      style={[styles.reviewButton, styles.buttonReviewed]}
                      onPress={() => handleUpdateStatus(selectedApplicant.id, "Reviewed")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonReviewedText}>Reviewed</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reviewButton, styles.buttonShortlist]}
                      onPress={() => handleUpdateStatus(selectedApplicant.id, "Shortlisted")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonShortlistText}>Shortlist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reviewButton, styles.buttonReject]}
                      onPress={() => handleUpdateStatus(selectedApplicant.id, "Rejected")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonRejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Interview Scheduling UI */}
                  <View style={styles.interviewSectionBorder} />
                  
                  {showSchedulingForm ? (
                    <View style={styles.schedulingFormContainer}>
                      <Text style={styles.schedulingFormTitle}>Schedule Interview Details</Text>
                      
                      <Text style={styles.fieldLabel}>Date</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={interviewDate}
                        onChangeText={setInterviewDate}
                        placeholder="e.g. August 5, 2026"
                        placeholderTextColor="#94A3B8"
                      />
                      
                      <Text style={styles.fieldLabel}>Time Slot</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={interviewTime}
                        onChangeText={setInterviewTime}
                        placeholder="e.g. 10:00 AM - 10:30 AM"
                        placeholderTextColor="#94A3B8"
                      />
                      
                      <Text style={styles.fieldLabel}>Link / Venue</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={interviewLink}
                        onChangeText={setInterviewLink}
                        placeholder="e.g. Google Meet link or Room 302"
                        placeholderTextColor="#94A3B8"
                      />
                      
                      <Text style={styles.fieldLabel}>Interview Notes</Text>
                      <TextInput
                        style={[styles.fieldInput, { height: 60, textAlignVertical: "top" }]}
                        multiline
                        value={interviewNotes}
                        onChangeText={setInterviewNotes}
                        placeholder="e.g. Prepare a demo of your projects"
                        placeholderTextColor="#94A3B8"
                      />
                      
                      <View style={styles.formButtonRow}>
                        <TouchableOpacity
                          style={[styles.formActionBtn, styles.formCancelBtn]}
                          onPress={() => setShowSchedulingForm(false)}
                        >
                          <Text style={styles.formCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.formActionBtn, styles.formConfirmBtn]}
                          onPress={handleConfirmScheduleInterview}
                        >
                          <Text style={styles.formConfirmBtnText}>Confirm Schedule</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.reviewButton, styles.buttonSchedule]}
                      onPress={() => setShowSchedulingForm(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonScheduleText}>Schedule Interview</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  subHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 6,
  },
  selectedJobTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  selectedJobCompany: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  applicantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  applicantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  applicantName: {
    fontSize: 14,
    fontWeight: "750",
    color: "#0F172A",
  },
  applicantEmail: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  applicantFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 12,
    marginTop: 12,
  },
  appliedAtText: {
    fontSize: 11,
    color: "#64748B",
  },
  viewProfileLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
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
  modalScroll: {
    marginTop: 16,
  },
  modalCandidateCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalAvatarBig: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DBEAFE",
    marginBottom: 10,
  },
  modalAvatarTextBig: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB",
  },
  modalCandidateName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCandidateEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCandidateBio: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
    fontWeight: "500",
  },
  modalCandidateBioPlaceholder: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 8,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  resumeDownloadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 10,
    padding: 12,
  },
  resumeFilename: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0369A1",
  },
  resumeFilesize: {
    fontSize: 11,
    color: "#0284C7",
    marginTop: 2,
  },
  educationDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalDegreeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalCollegeText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  modalGradYearText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 6,
    fontWeight: "500",
  },
  achievementsDetailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalAchievementsText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
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
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "600",
  },
  emptyInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyInfoText: {
    fontSize: 11,
    color: "#64748B",
  },
  statusReviewSection: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  statusReviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#78350F",
    marginBottom: 12,
  },
  statusButtonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  reviewButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonReviewed: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  buttonReviewedText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonShortlist: {
    backgroundColor: "#10B981",
  },
  buttonShortlistText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonReject: {
    backgroundColor: "#EF4444",
  },
  buttonRejectText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonSchedule: {
    backgroundColor: "#2563EB",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
  },
  buttonScheduleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  interviewSectionBorder: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  schedulingFormContainer: {
    marginTop: 6,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  schedulingFormTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#1E293B",
    marginBottom: 10,
  },
  formButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  formActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  formCancelBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  formCancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  formConfirmBtn: {
    backgroundColor: "#2563EB",
  },
  formConfirmBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
