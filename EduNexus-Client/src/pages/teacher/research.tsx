import React from "react";
import { Navbar } from "../../components/navbar";

const Research = () => {
  return (
    <>
    <Navbar />
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-gray-900">Welcome to Our Website</h1>
      <p className="mt-4 text-lg text-gray-700 text-center max-w-md">
        Discover amazing content and join our community today.
      </p>
      <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700">
        Get Started
      </button>
    </div>
    </>
  );
};

export default Research;
