import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import OwnerLogin from './pages/OwnerLogin.jsx'
import OwnerDashboard from './pages/OwnerDashboard.jsx'
import OwnerRoute from './components/OwnerRoute.jsx'
import DishDetail from './pages/DishDetail.jsx'
import Orders from './pages/Orders.jsx'
import MyBookings from './pages/MyBookings.jsx'
import { CartProvider } from './context/CartContext.jsx'

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu/:id" element={<DishDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route path="/owner" element={<OwnerLogin />} />
        <Route
          path="/owner/dashboard"
          element={
            <OwnerRoute>
              <OwnerDashboard />
            </OwnerRoute>
          }
        />
      </Routes>
    </CartProvider>
  )
}