import {
  Brain,
  Users,
  Star,
  MessageSquare,
  Shield,
  MapPin,
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transforming Education in
            <span className="text-blue-600"> Nepal</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with verified tutors using AI-powered matching. Experience
            personalized learning that bridges the educational gap across Nepal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
              Find a Tutor
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50">
              Become a Tutor
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose TutorEase?
            </h2>
            <p className="text-xl text-gray-600">
              Empowering students across Nepal with accessible, quality
              education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="h-12 w-12 text-blue-600" />,
                title: "AI-Powered Matching",
                description:
                  "Our intelligent system matches students with tutors based on learning style, subject expertise, and location",
              },
              {
                icon: <Shield className="h-12 w-12 text-blue-600" />,
                title: "Verified Tutors",
                description:
                  "Every tutor undergoes thorough verification to ensure the highest standards of teaching quality",
              },
              {
                icon: <MessageSquare className="h-12 w-12 text-blue-600" />,
                title: "Real-Time Communication",
                description:
                  "Stay connected with tutors through our integrated chat and notification system",
              },
              {
                icon: <MapPin className="h-12 w-12 text-blue-600" />,
                title: "Nationwide Access",
                description:
                  "Breaking geographical barriers to connect students with quality tutors across Nepal",
              },
              {
                icon: <Users className="h-12 w-12 text-blue-600" />,
                title: "Flexible Learning",
                description:
                  "Choose between online tutoring and home tuition based on your preferences",
              },
              {
                icon: <Star className="h-12 w-12 text-blue-600" />,
                title: "Rating System",
                description:
                  "Transparent feedback system ensures accountability and continuous improvement",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-blue-50 py-20" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How TutorEase Works
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Profile",
                description: "Sign up and tell us about your learning needs",
              },
              {
                step: "2",
                title: "Get Matched",
                description: "Our AI finds the perfect tutors for you",
              },
              {
                step: "3",
                title: "Connect",
                description: "Chat with tutors and schedule sessions",
              },
              {
                step: "4",
                title: "Learn & Grow",
                description: "Start your personalized learning journey",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Your Learning Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students and tutors across Nepal in
            revolutionizing education
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100">
            Get Started Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TutorEase</h3>
              <p className="text-gray-400">
                Transforming education through technology and accessibility
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Platform</h3>
              <div className="space-y-2 text-gray-400">
                <p>Find Tutors</p>
                <p>Become a Tutor</p>
                <p>How It Works</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <p>Help Center</p>
                <p>Contact Us</p>
                <p>Privacy Policy</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Connect</h3>
              <div className="space-y-2 text-gray-400">
                <p>Facebook</p>
                <p>Twitter</p>
                <p>LinkedIn</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 TutorEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
