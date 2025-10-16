import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Task from "./pages/Task";
import Search from "./components/Search";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { FilterProvider } from "./contexts/FilterContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import ChatPopup from "./components/ChatPopup";
import FriendListSidebar from "./components/FriendListSidebar";
import Loading from "./components/Loading";
import { startOnlineStatusPing } from "./services/onlineStatusManager";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [selectedFriend, setSelectedFriend] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      console.log("Starting online status ping for userId:", userId);
      const stopPing = startOnlineStatusPing(userId);
      return stopPing;
    }
  }, [userId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <LoadingProvider>
      <FilterProvider>
        <Router>
          <div className={isDarkMode ? "dark" : ""}>
            <Loading />
            
            {/* Dark mode toggle */}
            <button
              className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <AuthProvider>
              <Routes>
                <Route
                  path="/"
                  element={<PublicRoute><Login /></PublicRoute>}
                />
                <Route
                  path="/login"
                  element={<PublicRoute><Login /></PublicRoute>}
                />
                <Route
                  path="/register"
                  element={<PublicRoute><Register /></PublicRoute>}
                />
                <Route element={<MainLayout selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} />}>
                  <Route
                    path="/home"
                    element={
                      <PrivateRoute>
                        <Home />
                        <FriendListSidebar onFriendSelect={setSelectedFriend} />
                      </PrivateRoute>
                    }
                  />
                   <Route
                    path="/tasks"
                    element={
                      <PrivateRoute>
                        <Task />
                        <FriendListSidebar onFriendSelect={setSelectedFriend} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/search/:name"
                    element={
                      <PrivateRoute>
                        <Search />
                        <FriendListSidebar onFriendSelect={setSelectedFriend} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                        <FriendListSidebar onFriendSelect={setSelectedFriend} />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/:userId"
                    element={
                      <PrivateRoute>
                        <UserProfile />
                        <FriendListSidebar onFriendSelect={setSelectedFriend} />
                      </PrivateRoute>
                    }
                  />
                </Route>
              </Routes>
              
              <ChatPopup selectedFriend={selectedFriend} />
            </AuthProvider>
          </div>
        </Router>
      </FilterProvider>
    </LoadingProvider>
  );
}

export default App;