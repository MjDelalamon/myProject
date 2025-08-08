import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/SideBar";
import Intro from "./Intro";
import Staff from "./StaffSide";
import Owner from "./OwnerSide";
import Dashboard from "./AdminPage/Dashboard";
import Customer from "./AdminPage/Customer";
import Orders from "./AdminPage/Orders";
import Rewards from "./AdminPage/Reward";
import Menu from "./AdminPage/Menu";
import WalletSystem from "./AdminPage/Wallet";

import "./Style/Dashboard.css";
import "./Style/App.css";
import "./Style/index.css";
import "./Style/intro.css";
import "./Style/sideBar.css";
import "./Style/Customer.css";
import "./Style/Order.css";
import "./Style/Reward.css";
import "./Style/Menu.css";
import "./Style/Wallet.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Intro" replace />} />
      <Route path="/Intro" element={<Intro />} />
      <Route path="/Staff" element={<Staff />} />
      <Route path="/Owner" element={<Owner />} />
      <Route path="/Sidebar" element={<Sidebar />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/customers" element={<Customer />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/wallet" element={<WalletSystem />} />
    </Routes>
  );
}

export default App;
