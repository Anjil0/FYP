const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[4.5rem] items-center">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center">
            <a
              href="/"
              className="flex items-center gap-2 text-gray-900 font-bold text-lg"
            >
              <img src="/vite.svg" alt="TutorEase Logo" className="h-8 w-8" />
              <span>TutorEase</span>
            </a>
            <ul className="hidden md:flex ml-10 space-x-8">
              <li>
                <a
                  href="/"
                  className="text-gray-900 hover:text-blue-600 font-medium"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/tutors"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Tutors
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/become-a-tutor"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Become a Tutor
                </a>
              </li>
            </ul>
          </div>

          {/* Right: Search bar and Buttons */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2.5">
              <input
                type="text"
                placeholder="What do you want to learn..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
              <button className="text-gray-500 hover:text-gray-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            {/* Buttons */}
            <a
              href="/signup"
              className="px-5 py-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-bold"
            >
              Create Account
            </a>
            <a
              href="/login"
              className="px-5 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 font-bold"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
