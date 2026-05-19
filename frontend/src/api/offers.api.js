import axiosInstance from "./axios";

const offersAPI = {
  // ✅ SINGLE OFFER: /offers.php?id=1
  getOffer: (id) => {
    return axiosInstance.get("/offers.php", {
      params: { id },
    });
  },

  getOffers: ({ offer_type = "", limit = 10, offset = 0 } = {}) => {
    return axiosInstance.get("/offers.php", {
      params: { offer_type, limit, offset },
    });
  },

  createOffer: (formData) => {
    return axiosInstance.post("/offers.php", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateOffer: (id, data) => {
    return axiosInstance.put("/offers.php", { id, ...data });
  },

  deleteOffer: (id) => {
    return axiosInstance.delete("/offers.php", { data: { id } });
  },
};

export default offersAPI;
