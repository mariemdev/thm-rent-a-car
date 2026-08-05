const API_BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorText);
    } catch (e) {
      if (e instanceof Error && e.message !== errorText) throw e;
      throw new Error(errorText);
    }
  }
  return response.json();
}

export const api = {
  login: (credentials: any) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getAgencies: () => request("/agencies"),
  createAgency: (data: any) => request("/agencies", { method: "POST", body: JSON.stringify(data) }),
  updateAgency: (id: number, data: any) => request(`/agencies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgency: (id: number) => request(`/agencies/${id}`, { method: "DELETE" }),
  getBranches: () => request("/branches"),
  createBranch: (data: any) => request("/branches", { method: "POST", body: JSON.stringify(data) }),
  updateBranch: (id: number, data: any) => request(`/branches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBranch: (id: number) => request(`/branches/${id}`, { method: "DELETE" }),
  getCars: () => request("/cars"),
  createCar: (data: any) => request("/cars", { method: "POST", body: JSON.stringify(data) }),
  updateCar: (id: number, data: any) => request(`/cars/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCar: (id: number) => request(`/cars/${id}`, { method: "DELETE" }),
  bulkDeleteCars: (ids: number[]) => request("/cars/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
  getCustomers: () => request("/customers"),
  createCustomer: (data: any) => request("/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: any) => request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: (id: number, cascade = false) => request(`/customers/${id}${cascade ? "?cascade=true" : ""}`, { method: "DELETE" }),
  getRepairs: (carId: number) => request(`/cars/${carId}/repairs`),
  createRepair: (carId: number, data: any) => request(`/cars/${carId}/repairs`, { method: "POST", body: JSON.stringify(data) }),
  updateRepair: (id: number, data: any) => request(`/repairs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRepair: (id: number) => request(`/repairs/${id}`, { method: "DELETE" }),
  getRentals: () => request("/rentals"),
  getRental: (id: number) => request(`/rentals/${id}`),
  createRental: (data: any) => request("/rentals", { method: "POST", body: JSON.stringify(data) }),
  updateRental: (id: number, data: any) => request(`/rentals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  returnCar: (id: number, data: any) => request(`/rentals/${id}/return`, { method: "POST", body: JSON.stringify(data) }),
  swapCar: (id: number, data: any) => request(`/rentals/${id}/swap-car`, { method: "POST", body: JSON.stringify(data) }),
  deleteRental: (id: number) => request(`/rentals/${id}`, { method: "DELETE" }),
  createLeaseGroup: (rentalIds: number[]) => request("/rentals/group", { method: "POST", body: JSON.stringify({ rentalIds }) }),
  addToLeaseGroup: (groupNumber: string, rentalIds: number[]) => request("/rentals/group/add", { method: "POST", body: JSON.stringify({ groupNumber, rentalIds }) }),
  removeFromLeaseGroup: (rentalId: number) => request("/rentals/group/remove", { method: "POST", body: JSON.stringify({ rentalId }) }),
  getAnalytics: () => request("/dashboard/stats"),
  getUsers: () => request("/users"),
  createUser: (data: any) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),
  getSettings: () => request("/settings"),
  createSettings: (data: any) => request("/settings", { method: "POST", body: JSON.stringify(data) }),
  updateSettings: (data: any) => request("/settings", { method: "PUT", body: JSON.stringify(data) }),
  getBrands: () => request("/brands"),
  createBrand: (data: any) => request("/brands", { method: "POST", body: JSON.stringify(data) }),
  getColors: () => request("/colors"),
  createColor: (data: any) => request("/colors", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (email: string) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  resendVerification: (email: string) => request("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
};
