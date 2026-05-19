import axiosInstance from './axios';

const productsAPI = {
    // ✅ List
    getProducts: ({
        type = '',
        category_id = 0,
        search = '',
        limit = 12,
        offset = 0
    } = {}) => {
        return axiosInstance.get('/products.php', {
            params: {
                action: 'list',
                type,
                category_id,
                search,
                limit,
                offset
            }
        });
    },

    // ✅ Single (slug preferred)
    getProduct: ({ id = null, slug = null } = {}) => {
        return axiosInstance.get('/products.php', {
            params: {
                action: 'single',
                id,
                slug
            }
        });
    },

    // Create
    createProduct: (formData) => {
        formData.append('action', 'create');
        return axiosInstance.post('/products.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Update
    updateProduct: (formData) => {
        formData.append('action', 'update');
        return axiosInstance.post('/products.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Delete
    deleteProduct: (id) => {
        return axiosInstance.post('/products.php', { action: 'delete', id });
    },
     // 🖼️ Get product images
    getImages: (productId) => {
        return axiosInstance.get('/product_images.php', {
            params: {
                action: 'list',
                product_id: productId
            }
        });
    },

    // ⬆️ Upload images
    uploadImages: (productId, files) => {
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('product_id', productId);

        files.forEach(file => {
            formData.append('images[]', file);
        });

        return axiosInstance.post('/product_images.php', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // ❌ Delete image
    deleteImage: (imageId) => {
        return axiosInstance.delete('/product_images.php', {
            data: {
                action: 'delete',
                id: imageId
            }
        });
    }
};


export default productsAPI;
