import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/SideBar";
import Intro from "./Intro";
import Owner from "./OwnerSide";
import Dashboard from "./AdminPage/Dashboard";
import Customer from "./AdminPage/Customer";
import Orders from "./AdminPage/Orders";
import Promotion from "./AdminPage/Promotion";
import Menu from "./AdminPage/Menu";
import WalletSystem from "./AdminPage/Wallet";
import SidebarStaff from "./components/SideBarStaff";
import TakeOrder from "./StaffPage/TakeOrder";
import TransactionsList from "./AdminPage/TransactionsList";
import PromoRedemption from "./StaffPage/PromoRedemption";
import FeedbackList from "./AdminPage/FeedbackList";
import OrdersStaff from "./StaffPage/OrdersStaff";
import WalletPageStaff from "./StaffPage/WalletStaff";



import "./Style/App.css";
import "./Style/index.css";

import "./Style/sideBar.css";








function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Intro" replace />} />
      <Route path="/Intro" element={<Intro />} />
      <Route path="/Owner" element={<Owner />} />
      <Route path="/Sidebar" element={<Sidebar />} />
      <Route path="/SideBarStaff" element={<SidebarStaff />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/customers" element={<Customer />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/transactions" element={<TransactionsList />} />

      <Route path="/rewards" element={<Promotion />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/wallet" element={<WalletSystem />} />
      <Route path="/take-order" element={<TakeOrder />} />
      <Route path="/promo-redemption" element={<PromoRedemption />} />
      <Route path="/feedback" element={<FeedbackList />} />
      <Route path="/orders-staff" element={<OrdersStaff />} />
      <Route path="/wallet-staff" element={<WalletPageStaff />} />
      
      
      </Routes>
  );
}

export default App;
