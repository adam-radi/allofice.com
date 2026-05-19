
import axiosInstance from "./axios";

const ordersAPI = {
  /**
   * ✅ Create order (works for cart checkout AND buy-now)
   * payload = {
   *   items: [{ product_id?, offer_id?, quantity }],
   *   name: string,
   *   phone: string,
   *   city: string
   * }
   */
  getPendingOrdersCount: () => {
    return axiosInstance.get("/orders.php?action=pending-count")
      .then(res => res.data) // ديما خدم مع data
      .catch(err => {
        console.error('Failed fetching pending count', err);
        return { success: false, count: 0 };
      });
  },



  createOrder: (payload) => {
    return axiosInstance.post("/orders.php", payload);
  },

  /**
   * ✅ Helper: convert cart array -> backend items format
   * Cart item can be:
   * - product: {id, quantity}
   * - offer standalone: {offer_id, quantity}
   * - offer linked to product: {id/product_id, offer_id, quantity}
   */
  buildItemsFromCart: (cart = []) => {
    return cart
      .filter((it) => Number(it?.quantity || 0) > 0)
      .map((it) => {
        const qty = Number(it.quantity || 1);

        // Try best-known keys
        const productId =
          it.product_id ||
          (typeof it.id === "number" ? it.id : null) ||
          (typeof it.id === "string" && it.id.startsWith("offer-") ? null : null);

        const offerId = it.offer_id || null;

        if (offerId && productId) return { product_id: productId, offer_id: offerId, quantity: qty };
        if (offerId && !productId) return { offer_id: offerId, quantity: qty };
        return { product_id: productId, quantity: qty };
      });
  },

  // (Optional) Get orders (user/admin)
  getOrders: () => axiosInstance.get("/orders.php"),

  // (Optional) Update status (admin)
  updateOrderStatus: ({ order_id, status }) =>
    axiosInstance.put("/orders.php", { order_id, status }),
};

export default ordersAPI;
