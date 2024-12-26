const SignupPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="flex w-11/12 lg:w-4/5 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left Section */}
        <div className="flex flex-col w-full lg:w-1/2 p-8 md:p-12">
          <h1 className="text-2xl font-semibold text-blue-600 ">TutorEase</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mt-4">
            Signup To Your Account
          </h2>
          <form className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-[600] text-gray-600"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your full name"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-[600] text-gray-600"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-[600] text-gray-600"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-[600] text-gray-600"
              >
                Grade
              </label>
              <select
                id="grade"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="class1">Class 1</option>
                <option value="class2">Class 2</option>
                <option value="class3">Class 3</option>
                <option value="class4">Class 4</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-[600] text-gray-600"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                placeholder="Enter your address"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-[600] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Sign up
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Login now
            </a>
          </p>
        </div>

        {/* Right Section */}
        <div className="hidden lg:flex w-1/2 bg-blue-600 text-white flex-col justify-center items-center relative overflow-hidden">
          {/* Main Content */}
          <div className="w-2/3 text-center relative flex flex-col items-center">
            {/* Overlapping Main Logo/Image */}
            <img
              src="/LoginMain.png"
              alt="Logo"
              className="w-[250px] object-contain mb-4"
            />
            <h3 className="text-2xl font-semibold">
              Simplifying Tutoring for Parents.
            </h3>
            <p className="mt-2 text-sm">
              Expert Tutors, Tailored for Your Child&apos;s Success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
