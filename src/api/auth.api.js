import axiosInstance from './axios';

const authAPI = {

    login: (phone, password) => {
        return axiosInstance.post('/auth.php', {
            action: 'login',
            phone,
            password
        });
    },

    registerManual: (name, email, password, phone, city) => {

        return axiosInstance.post('/auth.php', {

            action: 'register_manual',
            name,
            email,
            password,
            phone,
            city
        });
    },
    verifyReset : (payload) => {
        return axiosInstance.post('/auth.php', {
            action: 'verify-reset',
            email: payload.email,
            phone: payload.phone
        });
    },

    resetPassword : (payload) => {
        return axiosInstance.post('/auth.php', {
            action: 'reset-password',  // ✅ صحيح
            email: payload.email,
            phone: payload.phone,
            newPassword: payload.newPassword
        });
    },
    guestCheckout : (fullName, phone, city) => {
        return axiosInstance.post('/auth.php', {
            action: 'guest_checkout',
            name: fullName,
            phone,
            city
        });
    },

    logout: () => {
        return axiosInstance.post('/auth.php', {
            action: 'logout'
        });
    },

    checkAuth: () => {
        return axiosInstance.get('/auth.php', {
            params: { action: 'check' }
        });
    },

    updateProfile: ({ email, new_password }) =>
        axiosInstance.post("/auth.php", {
            action: "update_profile",
            email,
            new_password, // backend باغيها هكذا
        }),
};

export default authAPI;
