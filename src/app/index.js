import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import LoginScreen from "../../screens/LoginScreen";
import HomeScreen from "../../screens/HomeScreen";

export default function Index() {
  // get user and loading state from auth provider
  const { user, loading } = useContext(AuthContext);

  // show a spinner while checking firebase login status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // route user depending on whether they are logged in or not
  return user ? <HomeScreen /> : <LoginScreen />;
}
