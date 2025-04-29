const axios = require("axios");
const User = require("../users/userModel");
const Tutor = require("../tutors/tutorModel");
const Rating = require("../ratings/ratingModel");
const Booking = require("../booking/bookingModel");
const TimeSlot = require("../timeSlots/timeSlotModel");
const mongoose = require("mongoose");

const getRecommendedTutors = async (req, res) => {
  try {
    const userId = req.user.sub;

    // Find the current user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get verified tutors
    const tutors = await Tutor.find({ isVerified: "verified" });
    if (tutors.length === 0) {
      return res.json([]);
    }

    // Get tutors with their complete information
    const tutorsWithDetails = await Promise.all(
      tutors.map(async (tutor) => {
        // Get average rating for this tutor
        const ratings = await Rating.find({ tutorId: tutor._id });
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        // Get previous bookings count for this tutor
        const bookingsCount = await Booking.countDocuments({
          tutorId: tutor._id,
          status: { $in: ["ongoing", "completed", "rated"] },
        });

        // Get subjects and grade levels from the TimeSlot model
        const timeSlots = await TimeSlot.find({
          createdBy: tutor._id,
          isActive: true,
        });

        // Extract unique subjects and grade levels from time slots
        const subjectsSet = new Set();
        const gradeLevelsSet = new Set();

        // First add from tutor model if available
        if (tutor.subjects && Array.isArray(tutor.subjects)) {
          tutor.subjects.forEach((subject) => subjectsSet.add(subject));
        }

        if (tutor.gradeLevels && Array.isArray(tutor.gradeLevels)) {
          tutor.gradeLevels.forEach((level) => gradeLevelsSet.add(level));
        }

        // Then add from time slots
        timeSlots.forEach((slot) => {
          if (slot.subjectName) subjectsSet.add(slot.subjectName);
          if (slot.gradeLevel) gradeLevelsSet.add(slot.gradeLevel);
        });

        // Fallback if no subjects or grade levels found
        if (subjectsSet.size === 0) subjectsSet.add("General");
        if (gradeLevelsSet.size === 0 && tutor.grade)
          gradeLevelsSet.add(tutor.grade);

        // Convert sets to arrays as requested
        const subjects = Array.from(subjectsSet);
        const gradeLevels = Array.from(gradeLevelsSet);

        // Parse tutor's subject details for better recommendation
        let subjectDetails = [];
        if (tutor.subjectDetails && Array.isArray(tutor.subjectDetails)) {
          subjectDetails = tutor.subjectDetails;
        } else {
          // Create basic subject details if not available
          subjects.forEach((subject) => {
            subjectDetails.push({
              name: subject,
              gradeLevel: gradeLevels.length > 0 ? gradeLevels[0] : "All",
            });
          });
        }

        return {
          id: tutor._id.toString(),
          username: tutor.username,
          subjects: subjects,
          gradeLevels: gradeLevels,
          subjectDetails: subjectDetails,
          address: tutor.address,
          rating: avgRating.toFixed(1),
          bookingsCount: bookingsCount,
          experience: tutor.teachingExperience,
          education: tutor.education,
          description: tutor.description,
          teachingLocation: tutor.teachingLocation,
          image: tutor.image || null,
        };
      })
    );

    // If we have no tutors with complete information, return empty array
    if (tutorsWithDetails.length === 0) {
      return res.json([]);
    }

    // Prepare user data for recommendation service
    const userData = {
      id: user._id.toString(),
      preferredSubjects: user.preferredSubjects || [],
      address: user.address || "",
      grade: user.grade || "",
    };

    try {
      // Make request to recommendation service
      const response = await axios.post("http://127.0.0.1:5001/recommend", {
        user: userData,
        tutors: tutorsWithDetails,
      });

      console.log(response.data);

      // Create a Map for quick lookup of original tutor details by ID
      const tutorsMap = new Map(
        tutorsWithDetails.map((tutor) => [tutor.id, tutor])
      );

      // Map the recommendations to include additional info
      // Enhance recommended tutors with additional frontend-friendly information
      const enhancedRecommendations = response.data
        .filter((recommendation) => {
          // Filter out tutors with combined_score that would round to 0.00 in .2f format
          return recommendation.combined_score >= 0.005; // This will ensure scores below 0.005 (which round to 0.00) are filtered out
        })
        .map((recommendation) => {
          const tutorId = recommendation.id;
          const originalTutor = tutorsMap.get(tutorId);

          if (!originalTutor) {
            return recommendation;
          }

          // Calculate recommendation reasons
          const recommendationReasons = [];

          // Add subject match reason if available
          if (
            recommendation.subject_match_score > 0.1 &&
            userData.preferredSubjects.length > 0
          ) {
            const matchingSubjects = originalTutor.subjects.filter((subject) =>
              userData.preferredSubjects.some((pref) =>
                subject.toLowerCase().includes(pref.toLowerCase())
              )
            );

            if (matchingSubjects.length > 0) {
              const subjectList = matchingSubjects.join(", ");
              recommendationReasons.push(
                `Teaches your preferred subject${
                  matchingSubjects.length > 1 ? "s" : ""
                }: ${subjectList}`
              );
            }
          }

          // Add rating reason if available
          if (parseFloat(originalTutor.rating) >= 4.0) {
            recommendationReasons.push(
              `Highly rated (${originalTutor.rating}/5)`
            );
          }

          // Add experience reason if available
          if (
            originalTutor.experience &&
            originalTutor.experience.includes("year")
          ) {
            recommendationReasons.push(`Experienced tutor`);
          }

          // Add grade level match reason if available
          if (
            userData.grade &&
            originalTutor.gradeLevels.some((grade) =>
              grade.toLowerCase().includes(userData.grade.toLowerCase())
            )
          ) {
            recommendationReasons.push(`Teaches your grade level`);
          }

          // Add location match reason if service detected one (based on score)
          if (
            recommendation.location_match_score &&
            recommendation.location_match_score > 0.5
          ) {
            recommendationReasons.push(`Convenient location`);
          }

          // Add booking popularity reason if applicable
          if (originalTutor.bookingsCount > 10) {
            recommendationReasons.push(
              `Popular tutor (${originalTutor.bookingsCount}+ sessions completed)`
            );
          }

          // If no specific reasons, add a generic one
          if (recommendationReasons.length === 0) {
            recommendationReasons.push("Recommended based on your preferences");
          }

          // Create frontend-friendly recommendation info
          return {
            ...originalTutor,
            recommendationScore:
              recommendation.combined_score || recommendation.score || 0,
            recommendationReasons: recommendationReasons.slice(0, 3),
          };
        });

      // Success - return the enhanced recommendations
      return res.json(enhancedRecommendations);
    } catch (error) {
      console.error("Recommendation service error:", error.message);

      // Improved fallback recommendation logic with subject matching
      const fallbackRecommendations = tutorsWithDetails
        .map((tutor) => {
          // Calculate basic subject match score
          let subjectMatchScore = 0;
          if (
            userData.preferredSubjects &&
            userData.preferredSubjects.length > 0
          ) {
            const userSubjectsLower = userData.preferredSubjects.map((s) =>
              s.toLowerCase()
            );
            const tutorSubjectsLower = tutor.subjects.map((s) =>
              s.toLowerCase()
            );

            // Count matches
            const matches = userSubjectsLower.filter((s) =>
              tutorSubjectsLower.some((ts) => ts.includes(s))
            ).length;

            // Score based on percentage match
            subjectMatchScore =
              userData.preferredSubjects.length > 0
                ? matches / userData.preferredSubjects.length
                : 0;
          }

          // Final score combines rating and subject match
          const combinedScore =
            parseFloat(tutor.rating) * 0.7 + subjectMatchScore * 0.3 * 5;

          // Generate recommendation reasons for fallback method
          const recommendationReasons = [];

          // Subject match reason
          if (subjectMatchScore > 0 && userData.preferredSubjects.length > 0) {
            const matchingSubjects = tutor.subjects.filter((subject) =>
              userData.preferredSubjects.some((pref) =>
                subject.toLowerCase().includes(pref.toLowerCase())
              )
            );

            if (matchingSubjects.length > 0) {
              const subjectList = matchingSubjects.join(", ");
              recommendationReasons.push(
                `Teaches your preferred subject${
                  matchingSubjects.length > 1 ? "s" : ""
                }: ${subjectList}`
              );
            }
          }

          // Rating reason
          if (parseFloat(tutor.rating) >= 4.0) {
            recommendationReasons.push(`Highly rated (${tutor.rating}/5)`);
          }

          // Experience reason
          if (
            tutor.experience &&
            typeof tutor.experience === "string" &&
            tutor.experience.includes("year")
          ) {
            recommendationReasons.push(`Experienced tutor`);
          }

          // Grade level match
          if (
            userData.grade &&
            tutor.gradeLevels.some((grade) =>
              grade.toLowerCase().includes(userData.grade.toLowerCase())
            )
          ) {
            recommendationReasons.push(`Teaches your grade level`);
          }

          // Booking popularity
          if (tutor.bookingsCount > 10) {
            recommendationReasons.push(
              `Popular tutor (${tutor.bookingsCount}+ sessions completed)`
            );
          }

          // If no specific reasons, add a generic one
          if (recommendationReasons.length === 0) {
            recommendationReasons.push("Recommended based on your preferences");
          }

          return {
            ...tutor,
            recommendationScore: combinedScore,
            recommendationReasons: recommendationReasons.slice(0, 3),
          };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5);

      return res.json(fallbackRecommendations);
    }
  } catch (error) {
    console.error("Error recommending tutors:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

module.exports = { getRecommendedTutors };
