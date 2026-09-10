export const GlobalComponent = {
  // Api Calling
  API_URL: 'http://localhost:8000/api/',
  headerToken: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },

  // Auth Api
  AUTH_API: 'http://localhost:8000/api/auth/',

  // Products Api
  product: 'apps/product',
  productDelete: 'apps/product/',

  // Orders Api
  order: 'apps/order',
  orderId: 'apps/order/',

  // Customers Api
  customer: 'apps/customer',
};