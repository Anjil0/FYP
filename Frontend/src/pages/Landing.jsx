import {
  Brain,
  Users,
  Star,
  MessageSquare,
  Shield,
  MapPin,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Facebook,
  ChevronDown,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-6">
                #1 Tutoring Platform in Nepal
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transforming Education in
                <span className="text-blue-600"> Nepal</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl lg:max-w-none">
                Connect with verified tutors using AI-powered matching.
                Experience personalized learning that bridges the educational
                gap across Nepal.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/tutors");
                  }}
                >
                  Find a Tutor
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate("/tutorSignup");
                  }}
                >
                  Become a Tutor
                </button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white overflow-hidden"
                    >
                      <img
                        src={`/dummy.jpg`}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Trusted by 1000+ students
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-100 rounded-full"></div>
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/landingBack.png"
                    alt="TutorEase Platform"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Verified Tutors" },
              { value: "1,000+", label: "Happy Students" },
              { value: "25+", label: "Subjects" },
              { value: "10,000+", label: "Hours Taught" },
            ].map((stat, index) => (
              <div key={index} className="p-6">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              Our Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TutorEase?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering students across Nepal with accessible, quality
              education through innovative technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="h-10 w-10 text-blue-600" />,
                title: "AI-Powered Matching",
                description:
                  "Our intelligent system matches students with tutors based on learning style, subject expertise, and location",
              },
              {
                icon: <Shield className="h-10 w-10 text-blue-600" />,
                title: "Verified Tutors",
                description:
                  "Every tutor undergoes thorough verification to ensure the highest standards of teaching quality",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-blue-600" />,
                title: "Real-Time Communication",
                description:
                  "Stay connected with tutors through our integrated chat and notification system",
              },
              {
                icon: <MapPin className="h-10 w-10 text-blue-600" />,
                title: "Nationwide Access",
                description:
                  "Breaking geographical barriers to connect students with quality tutors across Nepal",
              },
              {
                icon: <Users className="h-10 w-10 text-blue-600" />,
                title: "Flexible Learning",
                description:
                  "Choose between online tutoring and home tuition based on your preferences",
              },
              {
                icon: <Star className="h-10 w-10 text-blue-600" />,
                title: "Rating System",
                description:
                  "Transparent feedback system ensures accountability and continuous improvement",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-lg mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How TutorEase Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with TutorEase in just a few simple steps
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                {
                  step: "1",
                  title: "Create Profile",
                  description:
                    "Sign up and tell us about your learning needs and preferences",
                  icon: <Users className="h-6 w-6 text-white" />,
                },
                {
                  step: "2",
                  title: "Get Matched",
                  description:
                    "Our AI finds the perfect tutors for your specific requirements",
                  icon: <Brain className="h-6 w-6 text-white" />,
                },
                {
                  step: "3",
                  title: "Connect",
                  description:
                    "Chat with tutors and schedule sessions at your convenience",
                  icon: <MessageSquare className="h-6 w-6 text-white" />,
                },
                {
                  step: "4",
                  title: "Learn & Grow",
                  description:
                    "Start your personalized learning journey and track progress",
                  icon: <Star className="h-6 w-6 text-white" />,
                },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <button
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              onClick={() => {
                window.scrollTo(0, 0);
                navigate("/tutors");
              }}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              Testimonials
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from students and tutors who have transformed their
              educational journey with TutorEase
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Aarav Sharma",
                role: "Student, Grade 10",
                image:
                  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
                quote:
                  "TutorEase helped me find the perfect math tutor who explained concepts in a way I could understand. My grades have improved significantly!",
              },
              {
                name: "Priya Patel",
                role: "Tutor, Mathematics",
                image:
                  "https://i.pinimg.com/236x/39/19/0d/39190d35334ba7d7d5e70c059baa928e.jpg",
                quote:
                  "As a tutor, TutorEase has connected me with students who truly benefit from my teaching style. The platform is intuitive and easy to use.",
              },
              {
                name: "Smarkia Sharma",
                role: "Student, Bachelors",
                image:
                  "https://img.freepik.com/free-photo/shot-positive-european-young-female-with-dark-curly-hair-has-gentle-smile-freckled-skin-wears-casual-beige-shirt_273609-15736.jpg?semt=ais_hybrid&w=740",
                quote:
                  "TutorEase helped me find the perfect math tutor who explained concepts in a way I could understand. My grades have improved significantly!",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-4 flex">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-2/3 mb-8 lg:mb-0 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Your Learning Journey Today
              </h2>
              <p className="text-xl text-white/90 max-w-2xl">
                Join thousands of students and tutors across Nepal in
                revolutionizing education. Take the first step towards academic
                success.
              </p>
            </div>
            <div className="lg:w-1/3 flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                Find a Tutor
              </button>
              <button className="bg-transparent text-white border-2 border-white px-8 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                Become a Tutor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section with Animation */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4 shadow-sm">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-700">
              Find answers to common questions about TutorEase
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How does TutorEase match students with tutors?",
                answer:
                  "TutorEase uses an AI-powered algorithm that considers learning style, subject requirements, location preferences, and scheduling needs to find the most compatible tutors for each student.",
              },
              {
                question: "How are tutors verified on the platform?",
                answer:
                  "All tutors undergo a comprehensive verification process that includes identity verification, educational credential checks, and teaching experience validation to ensure quality and safety.",
              },
              {
                question: "Can I choose between online and in-person tutoring?",
                answer:
                  "Yes, TutorEase offers both online tutoring and in-person options. You can specify your preference during the matching process.",
              },
              {
                question: "How much does it cost to use TutorEase?",
                answer:
                  "Creating an account on TutorEase is free. Tutoring rates vary depending on the tutor's experience, subject, and teaching mode. You can view rates on each tutor's profile.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className={`bg-blue-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${
                  openFaq === index ? "border-l-4 border-blue-500" : ""
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-6 flex items-start justify-between focus:outline-none"
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-start">
                    <CheckCircle className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`h-6 w-6 text-blue-600 transform transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-gray-700 p-6 pt-0 ml-8">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold">TutorEase</h3>
              <p className="text-blue-200 mt-2">
                Transforming education across Nepal
              </p>
            </div>
            <div className="flex space-x-8 mb-6 md:mb-0">
              <a
                href="#features"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-blue-200 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a
                href="/aboutus"
                className="text-blue-200 hover:text-white transition-colors"
              >
                About Us
              </a>
              <a
                href="tutors"
                className="text-blue-200 hover:text-white transition-colors"
              >
                Tutors
              </a>
            </div>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-blue-200 hover:text-white transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-blue-200 hover:text-white transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-blue-200 hover:text-white transition-colors"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800 text-center text-blue-200">
            <p>© 2025 TutorEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
