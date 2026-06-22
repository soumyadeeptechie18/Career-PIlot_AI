import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// google signin config
GoogleSignin.configure({
  webClientId:
    "182761119916-on58qjvuus4gcjd0uljlqvpqjaffnhf0.apps.googleusercontent.com",
});

export const signInWithGoogle = async () => {
  try {
    // check play services (needed for android)
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    if (!hasPlayServices) {
      throw new Error("Play Services not available");
    }

    // open google login popup
    const result = await GoogleSignin.signIn();

    // handle user cancellation
    if (result.type === "cancelled") {
      console.log("Google Sign-In cancelled by user");
      return null;
    }

    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error("No ID token found");
    }

    // get firebase credential using token
    const credential = auth.GoogleAuthProvider.credential(idToken);

    // login to firebase
    return auth().signInWithCredential(credential);
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signOutWithGoogle = async () => {
  try {
    // logout of google and firebase
    await GoogleSignin.signOut();
    await auth().signOut();
  } catch (error) {
    console.error("Google Sign-Out Error:", error);
  }
};
