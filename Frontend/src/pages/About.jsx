"use client";

import { useState } from "react";
import {
  MessageCircle,
  Book,
  Star,
  Video,
  Award,
  Target,
  Zap,
  Users,
  Clock,
  Shield,
  Globe,
  CheckCircle,
  MapPin,
  CreditCard,
  Plus,
  Minus,
  ChevronRight,
  Sparkles,
  Heart,
  Lightbulb,
  GraduationCap,
  Headphones,
  Mail,
  Phone,
} from "lucide-react";

const AboutUs = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How does tutor verification work?",
      answer:
        "Every tutor undergoes a rigorous verification process that includes credential validation, background checks, and teaching capability assessment. Only tutors who meet our high standards are approved.",
    },
    {
      question: "What subjects do you cover?",
      answer:
        "We cover all academic subjects for grades 1-12, as well as specialized subjects like computer programming, music, art, and test preparation for competitive exams.",
    },
    {
      question: "How are tutors matched with students?",
      answer:
        "Our AI-powered system matches tutors based on subject expertise, teaching style, geographical proximity, scheduling availability, and learning goals to ensure an optimal fit.",
    },
    {
      question: "How does online tutoring work?",
      answer:
        "Our platform features integrated video conferencing with interactive screen sharing, and document collaboration tools. Sessions can be recorded for later review with permission.",
    },
    {
      question: "How do I track my progress?",
      answer:
        "Students receive review of their after doing assignment, along with monthly comprehensive assessments that highlight improvements and areas for continued focus.",
    },
    {
      question: "How do I become a tutor on TutorEase?",
      answer:
        'Visit our "Become a Tutor" page to start the application process. You\'ll need to submit your credentials, complete a teaching assessment, and pass our verification process.',
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section with Background Image and Animation */}
      <div className="relative bg-gradient-to-r from-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-90"></div>
          {/* Animated shapes */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-96 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 right-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-36">
          <div className="text-center">
            <div className="inline-block mb-6 p-2 bg-white/10 backdrop-blur-sm rounded-full">
              <div className="px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-sm font-medium">
                Transforming Education Since 2025
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
              About TutorEase
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-blue-100 mb-10">
              Connecting Students with Expert Tutors for Personalized Learning
              Experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/tutors"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                Find a Tutor <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href="/tutorSignup"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                Become a Tutor <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            className="w-full h-auto fill-gray-50"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Our Story Section with Animation */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full z-0"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Our Journey
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our <span className="text-blue-600">Story</span>
              </h2>
              <p className="text-gray-700 mb-4 text-lg">
                TutorEase was founded in 2025 by a team of educators and tech
                enthusiasts who recognized the need for a more accessible,
                personalized approach to education. What began as a small
                initiative connecting local tutors with students has evolved
                into a comprehensive platform serving thousands across the
                country.
              </p>
              <p className="text-gray-700 mb-4 text-lg">
                Our journey has been driven by a singular mission: to
                democratize quality education by leveraging technology to break
                down barriers of distance, cost, and accessibility.
              </p>
              <p className="text-gray-700 text-lg">
                Today, TutorEase continues to innovate with AI-driven matching,
                advanced tracking tools, and a growing community of verified
                educators passionate about student success.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 transform transition-transform hover:scale-105 hover:shadow-lg">
              <div className="text-blue-600 font-bold text-4xl mb-2">5000+</div>
              <div className="text-gray-600 font-medium">Verified Tutors</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 transform transition-transform hover:scale-105 hover:shadow-lg">
              <div className="text-blue-600 font-bold text-4xl mb-2">
                15000+
              </div>
              <div className="text-gray-600 font-medium">Active Students</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 transform transition-transform hover:scale-105 hover:shadow-lg">
              <div className="text-blue-600 font-bold text-4xl mb-2">25+</div>
              <div className="text-gray-600 font-medium">Subject Areas</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-blue-50 transform transition-transform hover:scale-105 hover:shadow-lg">
              <div className="text-blue-600 font-bold text-4xl mb-2">98%</div>
              <div className="text-gray-600 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section with Improved Design */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4 mr-2" />
              Our Purpose
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mission & <span className="text-blue-600">Vision</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guided by our commitment to transform education through technology
              and human connection
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-bl-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150"></div>
              <div className="relative">
                <div className="inline-block p-4 bg-blue-100 text-blue-600 rounded-2xl mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  At TutorEase, we&apos;re revolutionizing education by making
                  quality tutoring accessible and convenient. We connect
                  students from classes 1-10 and higher education with verified
                  expert tutors, offering both home and online tuition options.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We are committed to creating an ecosystem where educational
                  support is personalized, affordable, and available to all
                  learners regardless of their geographical location or economic
                  background.
                </p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-bl-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-150"></div>
              <div className="relative">
                <div className="inline-block p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-6">
                  <Globe className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Vision
                </h2>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  We envision a world where every student has access to
                  personalized education that adapts to their unique learning
                  style and needs, powered by AI-driven recommendations and
                  supported by qualified educators.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  TutorEase aims to be at the forefront of educational
                  technology, constantly innovating to bridge gaps in
                  traditional education systems and empower both students and
                  tutors to achieve their full potential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values Section with Improved Design */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Heart className="w-4 h-4 mr-2" />
            What We Believe
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Core <span className="text-blue-600">Values</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These principles guide everything we do at TutorEase, from product
            development to customer service
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 group">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
              <Shield className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Trust</h3>
            <p className="text-gray-600">
              We build relationships based on transparency, reliability, and
              integrity in everything we do
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 group">
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors duration-300">
              <Users className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Inclusivity
            </h3>
            <p className="text-gray-600">
              We create opportunities for everyone, regardless of background or
              circumstance
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 group">
            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
              <Zap className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Innovation</h3>
            <p className="text-gray-600">
              We continuously evolve our platform with cutting-edge technology
              and fresh ideas
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 hover:shadow-xl transition-all duration-300 group">
            <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600 transition-colors duration-300">
              <Award className="w-8 h-8 text-yellow-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Excellence</h3>
            <p className="text-gray-600">
              We are committed to the highest standards in education and service
              delivery
            </p>
          </div>
        </div>
      </div>

      {/* What Sets Us Apart Section with Improved Design */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-96 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              <Lightbulb className="w-4 h-4 mr-2" />
              Our Difference
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Sets Us Apart
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Discover the TutorEase advantage and why thousands choose our
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-yellow-400/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-all duration-300">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-yellow-300 transition-colors">
                Verified Tutors
              </h3>
              <p className="text-blue-100">
                Rigorous verification process ensuring qualified and trustworthy
                educators with background checks and credential verification
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-blue-400/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-all duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-blue-300 transition-colors">
                AI-Powered Matching
              </h3>
              <p className="text-blue-100">
                Smart recommendations based on location, learning style,
                academic goals, and teaching methods to ensure the perfect
                student-tutor fit
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
              <div className="bg-green-400/90 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-all duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-green-300 transition-colors">
                Progress Tracking
              </h3>
              <p className="text-blue-100">
                Comprehensive analytics and reporting tools to monitor
                improvement, identify areas for growth, and celebrate
                achievements
              </p>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            className="w-full h-auto fill-white"
            preserveAspectRatio="none"
          >
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Platform Features Section with Online Payments instead of Resource Library */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Tools
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Platform <span className="text-blue-600">Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed with both students and tutors in mind, our platform
              offers an intuitive experience with powerful tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Real-time Communication
                </h3>
                <p className="text-gray-600 mb-6">
                  Built-in chat functionality for seamless interaction between
                  tutors and students with media sharing capabilities
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-blue-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    Instant messaging
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    File sharing
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    Read receipts
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 group-hover:from-indigo-700 group-hover:to-indigo-800 transition-all duration-300">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Flexible Learning Options
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose between home tuition and online sessions based on your
                  preference and scheduling needs
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-indigo-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    Home tuition
                  </li>
                  <li className="flex items-center">
                    <div className="bg-indigo-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    Online sessions
                  </li>
                  <li className="flex items-center">
                    <div className="bg-indigo-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    Hybrid learning
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 group-hover:from-yellow-600 group-hover:to-yellow-700 transition-all duration-300">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Quality Assurance
                </h3>
                <p className="text-gray-600 mb-6">
                  Transparent rating system and detailed reviews for continuous
                  quality improvement and accountability
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-yellow-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    Verified reviews
                  </li>
                  <li className="flex items-center">
                    <div className="bg-yellow-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    Performance metrics
                  </li>
                  <li className="flex items-center">
                    <div className="bg-yellow-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    Regular quality checks
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 group-hover:from-purple-700 group-hover:to-purple-800 transition-all duration-300">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Live Online Classes
                </h3>
                <p className="text-gray-600 mb-6">
                  HD video calling with screen sharing and virtual whiteboard
                  for interactive learning experiences
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-purple-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    HD video
                  </li>
                  <li className="flex items-center">
                    <div className="bg-purple-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    Interactive whiteboard
                  </li>
                  <li className="flex items-center">
                    <div className="bg-purple-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    Screen sharing
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-green-50 to-green-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 group-hover:from-green-700 group-hover:to-green-800 transition-all duration-300">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Smart Scheduling
                </h3>
                <p className="text-gray-600 mb-6">
                  Intelligent calendar system that finds the perfect time slots
                  for both tutors and students
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    Calendar integration
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    Automated reminders
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    Rescheduling assistance
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-red-50 to-red-100 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 group-hover:from-red-600 group-hover:to-red-700 transition-all duration-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div className="p-8 flex-grow">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Secure Online Payments
                </h3>
                <p className="text-gray-600 mb-6">
                  Hassle-free payment system with multiple options and complete
                  transaction security
                </p>
                <ul className="text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <div className="bg-red-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    </div>
                    Multiple payment methods
                  </li>
                  <li className="flex items-center">
                    <div className="bg-red-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    </div>
                    Automated invoicing
                  </li>
                  <li className="flex items-center">
                    <div className="bg-red-100 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-red-600" />
                    </div>
                    Secure transactions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials with Improved Design */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              Success Stories
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our <span className="text-blue-600">Users Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from students and tutors who have experienced the
              TutorEase difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 relative">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="bg-yellow-400 rounded-full p-4 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex text-yellow-400 mb-6">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-gray-700 mb-8 italic text-lg">
                &quot;TutorEase connected me with a math tutor who completely
                changed my approach to the subject. I went from struggling to
                excelling in just a few months!&quot;
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mr-4 flex items-center justify-center text-white font-bold text-xl">
                  BB
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Binita Bhandary</h4>
                  <p className="text-gray-600">Grade 9 Student</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 relative">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="bg-yellow-400 rounded-full p-4 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex text-yellow-400 mb-6">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-gray-700 mb-8 italic text-lg">
                &quot;As a tutor, TutorEase has revolutionized how I manage my
                teaching schedule and connect with students. The platform is
                intuitive and powerful!&quot;
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full mr-4 flex items-center justify-center text-white font-bold text-xl">
                  RC
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Ram Chen</h4>
                  <p className="text-gray-600">Science Tutor</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 relative">
              <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
                <div className="bg-yellow-400 rounded-full p-4 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex text-yellow-400 mb-6">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <p className="text-gray-700 mb-8 italic text-lg">
                &quot;As a Student, I appreciate the verification process and
                transparency. I feel confident knowing all subjects can be
                learned from qualified professionals.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mr-4 flex items-center justify-center text-white font-bold text-xl">
                  AT
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Anish Thapa</h4>
                  <p className="text-gray-600">Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section with Improved Design */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white py-20 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-96 -left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4 mr-2" />
                Get Started Today
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Join TutorEase Today
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Whether you&apos;re a student seeking guidance or a tutor
                looking to share your expertise, TutorEase provides the platform
                you need to succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/signup"
                  className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold hover:bg-blue-50  inline-block text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Get Started as a Student
                </a>
                <a
                  href="/tutorSignup"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-colors inline-block text-center"
                >
                  Get Started as a Tutor
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl font-bold mb-4">For Students</div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Find the perfect tutor</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Flexible scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Track your progress</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl font-bold mb-4">For Tutors</div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Grow your business</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Manage students easily</span>
                  </li>
                  <li className="flex items-center">
                    <div className="bg-green-400/20 p-1 rounded-full mr-3">
                      <CheckCircle className="w-4 h-4 text-green-300" />
                    </div>
                    <span>Get paid on time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section with Expandable +/- Viewing */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Headphones className="w-4 h-4 mr-2" />
            Common Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="text-blue-600">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about TutorEase
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="mb-4 border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <h3 className="text-lg font-bold text-gray-800">
                  {faq.question}
                </h3>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    openFaqIndex === index
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {openFaqIndex === index ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openFaqIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-6 pt-0 text-gray-700 border-t border-gray-100">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info Section with Improved Design */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4 mr-2" />
              Get In Touch
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contact <span className="text-blue-600">Information</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re here to help with any questions you might have
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-block p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-6">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Headquarters
              </h3>
              <p className="text-gray-600">
                TutorEase Tower
                <br />
                Itahari International College
                <br />
                Dulari, 400001
                <br />
                Nepal
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-block p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl mb-6">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Email Us</h3>
              <p className="text-gray-600 mb-2">
                <a
                  href="mailto:info@tutorease.com"
                  className="hover:text-blue-600 transition-colors"
                >
                  info@tutorease.com
                </a>
              </p>
              <p className="text-gray-600">
                <a
                  href="mailto:support@tutorease.com"
                  className="hover:text-blue-600 transition-colors"
                >
                  support@tutorease.com
                </a>
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-md border border-blue-50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-block p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl mb-6">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Call Us</h3>
              <p className="text-gray-600 mb-2">
                <a
                  href="tel:+9779812345678"
                  className="hover:text-blue-600 transition-colors"
                >
                  +977 9812345678
                </a>
              </p>
              <p className="text-gray-600">
                <span className="block text-sm text-gray-500 mt-4">
                  Support Hours
                </span>
                Monday - Friday: 9am - 8pm
                <br />
                Saturday: 10am - 6pm
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
