import axios from "./axios";

export const getPrintingServices = () => axios.get("/services/printing");
