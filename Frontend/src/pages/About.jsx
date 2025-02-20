import { MessageCircle, Book, Star,Video, Award, Target, Zap } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            About TutorEase
          </h1>
          <p className="text-xl text-gray-800">
            Connecting Students with Expert Tutors for Personalized Learning
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-blue-50 p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-800">
              At TutorEase, we&apos;re revolutionizing education by making
              quality tutoring accessible and convenient. We connect students
              from classes 1-10 and higher education with verified expert
              tutors, offering both home and online tuition options.
            </p>
          </div>
          <div className="bg-blue-50 p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-800">
              We envision a world where every student has access to personalized
              education that adapts to their unique learning style and needs,
              powered by AI-driven recommendations and supported by qualified
              educators.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-blue-700 mb-12 text-center">
            What Sets Us Apart
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-300 transition-all">
              <Award className="w-16 h-16 mx-auto mb-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Verified Tutors
              </h3>
              <p className="text-gray-600">
                Rigorous verification process ensuring qualified and trustworthy
                educators
              </p>
            </div>
            <div className="text-center p-8 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-300 transition-all">
              <Zap className="w-16 h-16 mx-auto mb-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600">
                Smart recommendations based on location and Grades
              </p>
            </div>
            <div className="text-center p-8 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-300 transition-all">
              <Target className="w-16 h-16 mx-auto mb-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Progress Tracking
              </h3>
              <p className="text-gray-600">
                Comprehensive tools to monitor and measure student improvement
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-12 rounded-xl mb-16">
          <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">
            Our Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-6 bg-white p-6 rounded-lg shadow-sm">
              <MessageCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Real-time Communication
                </h3>
                <p className="text-gray-600">
                  Built-in chat functionality for seamless interaction between
                  tutors and students
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-white p-6 rounded-lg shadow-sm">
              <Book className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Flexible Learning Options
                </h3>
                <p className="text-gray-600">
                  Choose between home tuition and online sessions based on your
                  preference
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-white p-6 rounded-lg shadow-sm">
              <Star className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Quality Assurance
                </h3>
                <p className="text-gray-600">
                  Transparent rating system and reviews for continuous quality
                  improvement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 bg-white p-6 rounded-lg shadow-sm">
            <Video className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Live Online Classes
                </h3>
                <p className="text-gray-600">
                HD video calling with screen sharing and virtual whiteboard for interactive learning
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center bg-blue-700 text-white p-12 rounded-xl">
          <h2 className="text-3xl font-bold mb-4">Join TutorEase Today</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Whether you&apos;re a student seeking guidance or a tutor looking to
            share your expertise, TutorEase provides the platform you need to
            succeed.
          </p>
          <a
            href="/signup"
            className="bg-white text-blue-700 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
