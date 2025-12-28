import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-100"
      data-oid="7n.3yd5"
    >
      <div className="text-center" data-oid="-6xg:wi">
        <h1 className="mb-4 text-4xl font-bold" data-oid="f2zbxz9">
          404
        </h1>
        <p className="mb-4 text-xl text-gray-600" data-oid="npv2p5s">
          Oops! Page not found
        </p>
        <a
          href="/"
          className="text-blue-500 underline hover:text-blue-700"
          data-oid="ldgi9h6"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
