import { useNavigate } from "react-router-dom";

const CancelPayment = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/Mybookings");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Payment Canceled</h2>
        <p className="text-gray-600 mb-4">
          Your payment has been canceled. Please try again or contact support if
          you need assistance.
        </p>
        <button
          onClick={handleGoBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default CancelPayment;
