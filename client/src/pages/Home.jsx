import React from "react";
import Navbar from "../components/NavBar";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-4rem)]">
          
          {/* Card 1 - User Info */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg row-span-2 h-full">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
            </div>
            <h2 className="text-xl font-bold text-center">Badges</h2>
            <p className="text-center text-gray-600">Badges 53</p>
          </div>

          {/* Right Top Row */}
          <div className="col-span-2 grid grid-cols-3 gap-6 h-1/2">
            {/* Done Recently - wider (2/3) */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2">
              <h2 className="text-xl font-bold text-center">Done Recently</h2>
              <p className="text-center text-gray-600">Content goes here</p>
            </div>

            {/* Leaderboard - narrower (1/3) */}
            <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-1">
              <h2 className="text-xl font-bold text-center">Leaderboard</h2>
              <p className="text-center text-gray-600">Content goes here</p>
            </div>
          </div>

          {/* Right Bottom Row - Daily Challenge */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg col-span-2 h-1/2">
            <h2 className="text-xl font-bold text-center">Daily Challenge</h2>
            <p className="text-center text-gray-600">Content goes here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
