import React, { useState, useContext, useEffect } from "react";
import {
  Platform,
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { signOutWithGoogle } from "../services/googleAuth";
import Ionicons from "@expo/vector-icons/Ionicons";

// custom subcomponents
import InternshipCard from "../src/components/InternshipCard";
import CategoryPills from "../src/components/CategoryPills";
import DetailModal from "../src/components/DetailModal";
import TabBar from "../src/components/TabBar";
import ProfileView from "../src/components/ProfileView";

// Screens for role selection & recruiter mode
import RoleSelectionScreen from "./RoleSelectionScreen";
import RecruiterHomeScreen from "./RecruiterHomeScreen";

export default function HomeScreen() {
  // get user from context
  const { user } = useContext(AuthContext);
  
  // role states
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // subscribe to user role in Firestore on mount
  useEffect(() => {
    if (!user) {
      setLoadingRole(false);
      return;
    }

    const unsubscribe = firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot(
        (docSnapshot) => {
          if (docSnapshot.exists) {
            const data = docSnapshot.data();
            setRole(data?.role || null);
            setProfileData(data || null);
          } else {
            setRole(null);
            setProfileData(null);
          }
          setLoadingRole(false);
        },
        (err) => {
          console.error("Error listening to user document: ", err);
          setLoadingRole(false);
        }
      );

    return unsubscribe;
  }, [user]);

  // Allows student to reset/switch role for testing
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
              await firestore().collection("users").doc(user.uid).update({
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

  // get name, fallback to email prefix
  const displayName = user?.displayName || 
    (user?.email ? user.email.split("@")[0] : "Student");
  
  const userEmail = user?.email || "user@example.com";

  // tab and filter states
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [savedIds, setSavedIds] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);

  // Real-time internships list from database
  const [internships, setInternships] = useState([]);

  // Fetch internships from Firestore in real-time
  useEffect(() => {
    const unsubscribe = firestore()
      .collection("internships")
      .orderBy("postedAt", "desc")
      .onSnapshot(
        (querySnapshot) => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              list.push({
                id: doc.id,
                ...data,
                // Fallback text if server timestamp hasn't loaded yet
                postedAt: data.postedAt ? "Active" : "Just now",
              });
            });
          }
          setInternships(list);
        },
        (err) => {
          console.error("Error fetching internships: ", err);
        }
      );

    return unsubscribe;
  }, []);

  // Fetch current student's applied internship IDs in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection("applications")
      .where("studentId", "==", user.uid)
      .onSnapshot(
        (querySnapshot) => {
          const ids = [];
          if (querySnapshot) {
            querySnapshot.forEach((doc) => {
              ids.push(doc.data().internshipId);
            });
          }
          setAppliedIds(ids);
        },
        (err) => {
          console.error("Error fetching student applications: ", err);
        }
      );

    return unsubscribe;
  }, [user]);

  // bookmark/unbookmark a job locally
  const toggleSave = (id) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter((item) => item !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  // handle job applications (Save to database, and trigger recruiter notification)
  const applyInternship = async (internship) => {
    if (appliedIds.includes(internship.id)) {
      Alert.alert("Already Applied", "You have already submitted an application for this internship.");
      return;
    }

    try {
      // 1. Save student application document in Firestore
      await firestore().collection("applications").add({
        internshipId: internship.id,
        internshipTitle: internship.title,
        internshipCompany: internship.company,
        studentId: user.uid,
        studentName: displayName,
        studentEmail: userEmail,
        status: "Applied",
        appliedAt: firestore.FieldValue.serverTimestamp(),
        recruiterId: internship.recruiterId || "",
      });

      // 2. Create notification document in Firestore for the recruiter
      if (internship.recruiterId) {
        await firestore().collection("notifications").add({
          userId: internship.recruiterId,
          title: "New Application Received",
          message: `${displayName} has applied for the ${internship.title} role at ${internship.company}.`,
          read: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert("Success! 🎉", "Your application has been successfully submitted.");
    } catch (err) {
      console.error("Error submitting application: ", err);
      Alert.alert("Error", "Could not submit application. Please try again.");
    }
  };

  // search and category filters
  const filteredInternships = internships.filter((internship) => {
    const matchesSearch =
      internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || internship.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // filters for saved/applied lists
  const savedInternships = internships.filter((item) =>
    savedIds.includes(item.id)
  );

  const appliedInternships = internships.filter((item) =>
    appliedIds.includes(item.id)
  );

  // signout handler
  const handleLogout = () => {
    signOutWithGoogle();
  };

  // render card helper
  const renderCard = ({ item }) => (
    <InternshipCard
      item={item}
      isSaved={savedIds.includes(item.id)}
      isApplied={appliedIds.includes(item.id)}
      onPress={() => setSelectedInternship(item)}
      onSaveToggle={() => toggleSave(item.id)}
      onApply={() => applyInternship(item)}
    />
  );

  // Show loading indicator while fetching role from database
  if (loadingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Show role selector if user has not picked a role yet
  if (!role) {
    return (
      <RoleSelectionScreen
        userId={user?.uid || ""}
        userEmail={userEmail}
        onRoleSelected={(selectedRole) => setRole(selectedRole)}
      />
    );
  }

  // Render recruiter interface if role is recruiter
  if (role === "recruiter") {
    return (
      <RecruiterHomeScreen
        userId={user?.uid || ""}
        userEmail={userEmail}
      />
    );
  }

  // Render default student interface
  return (
    <SafeAreaView style={styles.container}>
      {/* top header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Hello, {displayName}</Text>
          <Text style={styles.headerTitle}>CareerPilot</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Switch Role icon button */}
          <TouchableOpacity 
            onPress={handleResetRole} 
            style={{ padding: 8, backgroundColor: "#EFF6FF", borderRadius: 8 }}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("profile")}
            style={styles.headerAvatar}
          >
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* tab screens */}
      <View style={styles.contentContainer}>
        {activeTab === "explore" && (
          <View style={{ flex: 1 }}>
            {/* search bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search job title, company..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94A3B8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* category list */}
            <View style={{ height: 50, marginBottom: 10 }}>
              <CategoryPills
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </View>

            {/* jobs list */}
            <FlatList
              data={filteredInternships}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No internships found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try searching for another keyword or change your filters.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {activeTab === "saved" && (
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Saved Internships</Text>
            <FlatList
              data={savedInternships}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="bookmark-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No saved jobs</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the bookmark icon on any internship to keep track of it here.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {activeTab === "profile" && (
          <ProfileView
            displayName={displayName}
            userEmail={userEmail}
            appliedCount={appliedIds.length}
            savedCount={savedIds.length}
            appliedInternships={appliedInternships}
            onLogout={handleLogout}
            profileData={profileData}
            userId={user?.uid}
          />
        )}
      </View>

      {/* details modal */}
      <DetailModal
        visible={selectedInternship !== null}
        internship={selectedInternship}
        isSaved={selectedInternship ? savedIds.includes(selectedInternship.id) : false}
        isApplied={selectedInternship ? appliedIds.includes(selectedInternship.id) : false}
        onClose={() => setSelectedInternship(null)}
        onSaveToggle={() => selectedInternship && toggleSave(selectedInternship.id)}
        onApply={() => selectedInternship && applyInternship(selectedInternship)}
      />

      {/* bottom tab bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
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
    paddingTop: Platform.OS === "android" ? 45 : 15,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  avatarText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
