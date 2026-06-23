import React from "react";
import Sidebar from "./components/Sidebar";
import Gallery from "./components/Gallery";
import AdminPage from "./components/AdminPage";

function App() {
  const isAdmin = window.location.pathname === "/admin";

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <>
      <Sidebar />
      <Gallery />
    </>
  );
}

export default App;
