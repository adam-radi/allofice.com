import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://allofice.xo.je/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // باش PHP session تتبع
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor (ممكن نضيفو هنا حاجات أخرى مستقبلاً)
axiosInstance.interceptors.request.use(
    config => config,
    error => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 && window.location.pathname !== '/login') {
            // redirect المستخدم لتسجيل الدخول
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
