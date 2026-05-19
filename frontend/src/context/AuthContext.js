import React, { createContext, useContext, useState, useEffect } from 'react';
import authAPI from '../api/auth.api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // بيانات المستخدم
  const [isAuthenticated, setIsAuthenticated] = useState(false); // حالة تسجيل الدخول
  const [loading, setLoading] = useState(true); // loading أثناء التحقق من session

  // دالة تسجيل الدخول
  const login = async (phone, password) => {
    try {
      const res = await authAPI.login(phone, password);
      if (res.data.success) {
        setUser({
          id: res.data.data.id,
          name: res.data.data.name,
          phone: res.data.data.phone,
          role: res.data.data.role
        });

        setIsAuthenticated(true);
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  // دالة تسجيل يدوي
  const registerManual = async (name, email, password, phone, city) => {
    try {
      const res = await authAPI.registerManual(name, email, password, phone, city);
      if (res.data.success) {
        setUser({
          id: res.data.data.id,
          name: res.data.data.name,
          email: res.data.data.email,
          phone: res.data.data.phone,
          role: res.data.data.role
        });
        setIsAuthenticated(true);
      } else {
        throw new Error(res.data.message || 'Registration failed');

      }
      return res.data;
    } catch (error) {

      console.error('Register error:', error);
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  // دالة guest checkout






  const guestCheckout = async (fullName, phone, city) => {
    try {
      const res = await authAPI.guestCheckout(fullName, phone, city);

      if (res.data?.success) {
        setUser({ id: res.data.data.user_id, name: fullName, role: "user", phone });
        setIsAuthenticated(true);
        return res.data;
      }

      // ✅ إلا backend رجّع success=false
      const msg = res.data?.message || "Guest checkout failed";
      throw new Error(msg);
    } catch (err) {
      // ✅ خليه يطلع ل Checkout باش نقدروا نشوفو status 409
      throw err;
    }
  };

  // دالة logout
  const logout = async () => {
    try {
      const res = await authAPI.logout();
      if (res.data.success) {
        setUser(null);
        setIsAuthenticated(false);
      }
      return res.data;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  };

  // تحقق من session عند تحميل التطبيق
  const checkAuth = async () => {
    try {
      const res = await authAPI.checkAuth();
      if (res.data.success) {
        setUser(res.data.data);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Check auth error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };
  const updateProfile = async ({ email, newPassword }) => {
    const res = await authAPI.updateProfile({
      email,
      new_password: newPassword || "",
    });

    if (!res.data.success) throw new Error(res.data.message || "Update failed");

    await checkAuth();
    return res.data;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        registerManual,
        guestCheckout,
        isAdmin: isAuthenticated && user?.role === "admin",
        logout,
        updateProfile,
        checkAuth,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook للاستعمال في أي مكان
export const useAuth = () => useContext(AuthContext);