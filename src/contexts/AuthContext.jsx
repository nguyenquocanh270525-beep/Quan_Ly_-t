import React, { createContext, useContext, useState, useEffect } from "react";
import { getDB, initDatabase } from "../services/storageService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("PHONE_STORE_CURRENT_USER");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    initDatabase(false);
  }, []);

  const login = (username, password) => {
    const db = getDB();
    const found = db?.users?.find(
      (u) =>
        u.username === username.trim() &&
        u.password === password &&
        u.status === "ACTIVE"
    );
    if (!found) {
      throw new Error("Sai tên đăng nhập, mật khẩu hoặc tài khoản bị khóa");
    }
    const sessionUser = {
      user_id: found.user_id,
      username: found.username,
      role: found.role,
      full_name: found.full_name,
    };
    setUser(sessionUser);
    localStorage.setItem("PHONE_STORE_CURRENT_USER", JSON.stringify(sessionUser));
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("PHONE_STORE_CURRENT_USER");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);