import React, { createContext, useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";

// auth state context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // listen to login state changes
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // cleanup on unmount
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
