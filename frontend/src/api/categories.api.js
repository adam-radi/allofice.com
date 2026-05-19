


// import axiosInstance from './axios';

// const categoriesAPI = {

//     // 📌 Get all categories
//     getCategories: () => {
//         return axiosInstance.get('/categories.php', {
//             params: {
//                 action: 'list'
//             }
//         });
//     },

//     // 📌 Get single category (by id or slug)
//     getCategory: ({ id = null, slug = null }) => {
//         return axiosInstance.get('/categories.php', {
//             params: {
//                 action: 'single',
//                 id,
//                 slug
//             }
//         });
//     },
//     // ✅ Create category
//     createCategory: ({ name, description = "", type = "office" }) => {
//         return axiosInstance.post("/categories.php", {
//             action: "create",
//             name,
//             description,
//             type,
//         });
//     },

//     // ✅ Update category
//     updateCategory: ({ id, name, description = "", type = "office" }) => {
//         return axiosInstance.post("/categories.php", {
//             action: "update",
//             id,
//             name,
//             description,
//             type,
//         });
//     },

//     // 📌 Delete category
//     deleteCategory: (id) => {
//         return axiosInstance.post('/categories.php', {
//             action: 'delete',
//             id
//         });
//     }

// };

// export default categoriesAPI;
import axiosInstance from "./axios";

const categoriesAPI = {
  // GET /categories.php?type=office|printing (optional)
  getCategories: (type = null) => {
    return axiosInstance.get("/categories.php", {
      params: type ? { type } : {},
    });
  },

  // GET single category (backend ديالك ما فيهش single حالياً)
  // نخليوها بسيطة: ترجع من list وتفلتر
  getCategory: async ({ id = null, slug = null }) => {
    const res = await axiosInstance.get("/categories.php");
    if (!res.data?.success) return res;

    const all = res.data.data || [];
    const one =
      id != null
        ? all.find((c) => Number(c.id) === Number(id))
        : slug
        ? all.find((c) => String(c.slug) === String(slug))
        : null;

    return {
      ...res,
      data: { success: true, message: "Category loaded", data: one },
    };
  },

  // POST create
  createCategory: ({ name, description = "", type = "office" }) => {
    return axiosInstance.post("/categories.php", { name, description, type });
  },

  // PUT update
  updateCategory: ({ id, name, description = "", type = "office" }) => {
    return axiosInstance.put("/categories.php", { id, name, description, type });
  },

  // DELETE delete
  deleteCategory: (id) => {
    return axiosInstance.delete("/categories.php", {
      data: { id },
    });
  },
};

export default categoriesAPI;
