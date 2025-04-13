from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/recommend', methods=['POST'])
def recommend():
    """Generate tutor recommendations based on user preferences"""
    try:
        # Log incoming request data
        logger.info("Received recommendation request")
        data = request.get_json()
        
        # Extract user and tutor data from the request
        user = data["user"]
        tutors_data = data["tutors"]
        
        logger.info(f"Processing recommendation for user: {user['id']}")
        logger.info(f"Number of tutors available: {len(tutors_data)}")
        
        # Convert tutors to DataFrame for easier processing
        tutors = pd.DataFrame(tutors_data)
        
        # Check if we have tutors to recommend
        if tutors.empty:
            logger.warning("No tutors available for recommendation")
            return jsonify([])
        
        # Handle array format for subjects and gradeLevels
        tutors = preprocess_tutor_data(tutors)
        
        # Create feature vectors for similarity calculation with updated weights
        tutors["features"] = create_feature_vectors(tutors, user)
        
        # Create user preference vector
        user_vector = create_user_vector(user)
        
        # Compute similarity scores
        logger.info("Computing similarity scores")
        recommendations = compute_recommendations(user_vector, tutors, user)
        
        # Return top 5 recommendations
        logger.info(f"Returning {len(recommendations)} recommendations")
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error in recommendation service: {str(e)}")
        # Return empty list in case of errors
        return jsonify([])

def preprocess_tutor_data(tutors):
    """Ensure tutors data has proper format for subjects and gradeLevels"""
    
    # Handle subjects - ensure it's a list and join for feature creation
    if 'subjects' in tutors.columns:
        # Convert string representation to lists if needed
        tutors['subjects_list'] = tutors['subjects'].apply(
            lambda x: x if isinstance(x, list) else [x] if isinstance(x, str) else []
        )
        # Create a string version for feature creation
        tutors['subjects_str'] = tutors['subjects_list'].apply(
            lambda x: ", ".join(x) if x else ""
        )
    else:
        tutors['subjects_list'] = [[]]
        tutors['subjects_str'] = ""
    
    # Handle grade levels - ensure it's a list and join for feature creation
    if 'gradeLevels' in tutors.columns:
        # Convert string representation to lists if needed
        tutors['gradeLevels_list'] = tutors['gradeLevels'].apply(
            lambda x: x if isinstance(x, list) else [x] if isinstance(x, str) else []
        )
        # Create a string version for feature creation
        tutors['gradeLevels_str'] = tutors['gradeLevels_list'].apply(
            lambda x: ", ".join(x) if x else ""
        )
    else:
        tutors['gradeLevels_list'] = [[]]
        tutors['gradeLevels_str'] = ""
    
    # Convert bookingsCount to numeric for popularity ranking
    if 'bookingsCount' in tutors.columns:
        tutors['bookingsCount'] = pd.to_numeric(tutors['bookingsCount'], errors='coerce').fillna(0)
    
    # Normalize experience field for ranking
    if 'experience' in tutors.columns:
        tutors['experience_years'] = tutors['experience'].apply(extract_years_from_experience)
    else:
        tutors['experience_years'] = 0
    
    return tutors

def extract_years_from_experience(exp_str):
    """Extract number of years from experience text"""
    if not isinstance(exp_str, str):
        return 0
        
    # Look for numbers followed by "year" or "yr"
    year_pattern = r'(\d+)\s*(?:year|yr)'
    match = re.search(year_pattern, exp_str.lower())
    if match:
        return int(match.group(1))
    
    # If no match, check if experience contains any numbers
    numbers = re.findall(r'\d+', exp_str)
    if numbers:
        # Take the first number as a approximation
        return int(numbers[0])
    
    return 0

def create_feature_vectors(tutors, user):
    """Create feature vectors for tutors that emphasize relevant attributes
    with higher weight on location"""
    
    # Extract features from tutors DataFrame
    features = []
    for _, tutor in tutors.iterrows():
        # Create a weighted feature string
        feature_parts = []
        
        # Add subjects with moderate weight
        subjects_str = tutor.get("subjects_str", "").lower()
        feature_parts.append(subjects_str)
        
        # Get list of subjects for exact matching
        subject_list = tutor.get("subjects_list", [])
        if isinstance(subject_list, list):
            subject_list_lower = [s.lower() for s in subject_list if isinstance(s, str)]
        else:
            subject_list_lower = []
        
        # Process preferred subjects with medium emphasis (priority #3)
        if "preferredSubjects" in user and user["preferredSubjects"]:
            for subject in user["preferredSubjects"]:
                subject_lower = subject.lower()
                
                # Check for exact matches in subject list
                if any(s == subject_lower or subject_lower in s for s in subject_list_lower):
                    feature_parts.extend([subject_lower] * 3)  # Medium weight for subject matches
                
                # Also check in detailed subject names for exact matches
                if "subjectDetails" in tutor and isinstance(tutor["subjectDetails"], list):
                    exact_matches = [
                        detail.get("name", "").lower() 
                        for detail in tutor["subjectDetails"] 
                        if detail.get("name", "").lower() == subject_lower
                    ]
                    
                    # If we have exact matches in the subject details, add emphasis
                    if exact_matches:
                        feature_parts.extend([subject_lower] * 3)
        
        # Add grade levels 
        feature_parts.append(tutor.get("gradeLevels_str", "").lower())
        
        # Add user grade (if relevant)
        if "grade" in user and user["grade"]:
            user_grade = user["grade"].lower()
            grade_levels_str = tutor.get("gradeLevels_str", "").lower()
            
            if user_grade in grade_levels_str:
                feature_parts.extend([user_grade] * 2)
        
        # Add location features (normalized) with highest emphasis (priority #1)
        tutor_location = normalize_location(tutor.get("address", ""))
        user_location = normalize_location(user.get("address", ""))
        
        # Calculate location similarity
        loc_similarity = location_similarity(tutor_location, user_location)
        
        # If locations match at area level, give very high emphasis
        if loc_similarity > 0.5:
            # Add multiple copies to heavily emphasize location - highest priority
            feature_parts.extend([tutor_location] * 6)
        elif loc_similarity > 0.3:
            feature_parts.extend([tutor_location] * 4)
        else:
            feature_parts.append(tutor_location)
        
        # Add rating with high emphasis (priority #2)
        if "rating" in tutor:
            try:
                rating_val = float(tutor["rating"])
                # Add rating based emphasis (more stars = more emphasis)
                if rating_val >= 4.5:
                    feature_parts.extend(["high_rating"] * 5)
                elif rating_val >= 4.0:
                    feature_parts.extend(["good_rating"] * 4)
                elif rating_val >= 3.5:
                    feature_parts.extend(["average_rating"] * 3)
            except (ValueError, TypeError):
                pass
                
        # Add popularity/booking count with low-medium emphasis (priority #4)
        if "bookingsCount" in tutor:
            try:
                bookings = int(tutor["bookingsCount"])
                if bookings > 20:
                    feature_parts.extend(["popular_tutor"] * 2)
                elif bookings > 10:
                    feature_parts.append("experienced_tutor")
            except (ValueError, TypeError):
                pass
                
        # Add teaching experience with low emphasis (priority #5)
        if "experience_years" in tutor:
            try:
                years = int(tutor["experience_years"])
                if years > 5:
                    feature_parts.append("veteran_teacher")
                elif years > 3:
                    feature_parts.append("experienced_teacher")
                elif years > 1:
                    feature_parts.append("qualified_teacher")
            except (ValueError, TypeError):
                pass
            
        # Combine all features
        features.append(" ".join(feature_parts))
    
    return features

def create_user_vector(user):
    """Create a feature vector for user preferences with weights matching our priority"""
    feature_parts = []
    
    # Location - highest priority (#1)
    if "address" in user and user["address"]:
        location = normalize_location(user["address"])
        # Add multiple times to give location the highest weight
        feature_parts.extend([location] * 6)
    
    # Rating preference is implicit (always prioritized - #2)
    feature_parts.extend(["high_rating"] * 4)
    
    # Preferred subjects - medium priority (#3)
    if "preferredSubjects" in user and user["preferredSubjects"]:
        for subject in user["preferredSubjects"]:
            # Add with medium emphasis
            feature_parts.extend([subject.lower()] * 3)
    
    # Popularity is implicit (medium-low priority - #4)
    feature_parts.append("popular_tutor")
    
    # Experience is lowest priority (#5)
    feature_parts.append("experienced_teacher")
    
    # Add user's grade
    if "grade" in user and user["grade"]:
        feature_parts.append(user["grade"].lower())
    
    # Return the combined user preference vector
    return " ".join(feature_parts)

def normalize_location(address):
    """Extract and normalize location information"""
    if not isinstance(address, str):
        return ""
        
    # Convert to lowercase
    address = address.lower()
    
    # Remove common words, punctuation
    address = re.sub(r'[^\w\s]', ' ', address)
    
    # Return normalized address
    return address.strip()

def location_similarity(loc1, loc2):
    """Calculate simple location similarity score"""
    # Handle empty strings
    if not loc1 or not loc2:
        return 0
        
    # Count common words
    words1 = set(loc1.split())
    words2 = set(loc2.split())
    
    common = words1.intersection(words2)
    
    if not words1 or not words2:
        return 0
    
    # Return Jaccard similarity
    return len(common) / len(words1.union(words2))

def compute_recommendations(user_vector, tutors, user_data):
    """Compute and return recommendations based on similarity with updated weights"""
    try:
        # If user vector is empty, use a ranking based on our priority criteria
        if not user_vector.strip():
            logger.warning("Empty user vector, using weighted criteria-based recommendation")
            
            # Calculate weighted score based on our priorities
            tutors["weighted_score"] = (
                tutors.apply(lambda x: calculate_location_score(x, user_data) * 0.35, axis=1) +  # Location (35%)
                tutors["rating"].astype(float) / 5.0 * 0.25 +  # Rating (25%) 
                tutors.apply(lambda x: calculate_subject_match(x, user_data) * 0.20, axis=1) +  # Subject (20%)
                tutors["bookingsCount"] / 100 * 0.15 +  # Popularity (15%, capped at 100 bookings)
                tutors["experience_years"] / 10 * 0.05  # Experience (5%, capped at 10 years)
            )
            
            recommended = tutors.sort_values(by="weighted_score", ascending=False).head(5)
            return prepare_recommendations_for_response(recommended, user_data)
        
        # Use TF-IDF vectorizer for better feature extraction
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        
        # Create corpus with user vector first
        corpus = [user_vector] + list(tutors["features"])
        
        # Fit and transform
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Extract user vector and tutor matrix
        user_tfidf = tfidf_matrix[0]
        tutors_tfidf = tfidf_matrix[1:]
        
        # Compute similarity
        similarities = cosine_similarity(user_tfidf, tutors_tfidf)[0]
        
        # Add similarity scores to DataFrame
        tutors["cosine_similarity"] = similarities
        
        # Calculate individual component scores
        tutors["location_score"] = tutors.apply(lambda x: calculate_location_score(x, user_data), axis=1)
        tutors["rating_score"] = tutors["rating"].astype(float) / 5.0
        tutors["subject_match_score"] = tutors.apply(lambda x: calculate_subject_match(x, user_data), axis=1)
        tutors["popularity_score"] = tutors["bookingsCount"] / 100  # Normalize to 0-1 (capped at 100 bookings)
        tutors["experience_score"] = tutors["experience_years"] / 10  # Normalize to 0-1 (capped at 10 years)
        
        # Cap scores at 1.0
        for score_col in ["location_score", "rating_score", "subject_match_score", "popularity_score", "experience_score"]:
            tutors[score_col] = tutors[score_col].clip(0, 1)
        
        # Calculate weighted final score with our priority weights
        tutors["combined_score"] = (
            tutors["location_score"] * 0.35 +     # Location (35%)
            tutors["rating_score"] * 0.25 +       # Rating (25%)
            tutors["subject_match_score"] * 0.20 + # Subject (20%)
            tutors["popularity_score"] * 0.15 +    # Popularity (15%)
            tutors["experience_score"] * 0.05      # Experience (5%)
        )
        
        # Recommend top 5 tutors
        recommended = tutors.sort_values(by="combined_score", ascending=False).head(5)
        
        # Log what factors influenced each recommendation
        for idx, tutor in recommended.iterrows():
            logger.info(
                f"Recommendation: {tutor.get('username', 'Unknown')} - " +
                f"Location: {tutor['location_score']:.2f}, " +
                f"Rating: {tutor['rating_score']:.2f}, " +
                f"Subject: {tutor['subject_match_score']:.2f}, " +
                f"Popularity: {tutor['popularity_score']:.2f}, " +
                f"Experience: {tutor['experience_score']:.2f}, " +
                f"Final score: {tutor['combined_score']:.2f}"
            )
        
        # Prepare recommendations for the response
        return prepare_recommendations_for_response(recommended, user_data)
        
    except Exception as e:
        logger.error(f"Error in compute_recommendations: {str(e)}")
        # Sort by rating as fallback
        if "rating" in tutors.columns:
            tutors["score"] = tutors["rating"].astype(float)
            recommended = tutors.sort_values(by="score", ascending=False).head(5)
            return recommended.to_dict(orient="records")
        else:
            # Return first 5 tutors if we can't sort
            return tutors.head(5).to_dict(orient="records")

def calculate_location_score(tutor_row, user_data):
    """Calculate location similarity score between tutor and user"""
    tutor_location = normalize_location(tutor_row.get("address", ""))
    user_location = normalize_location(user_data.get("address", ""))
    
    # Return location similarity score (0-1)
    return location_similarity(tutor_location, user_location)

def calculate_subject_match(tutor_row, user_data):
    """Calculate subject match score between tutor and user"""
    user_preferred_subjects = [s.lower() for s in user_data.get("preferredSubjects", [])]
    
    # If user has no preferred subjects, return 0.5 (neutral)
    if not user_preferred_subjects:
        return 0.5
    
    # Get tutor's subjects
    tutor_subjects = []
    
    # Add from subjects_list
    if 'subjects_list' in tutor_row and isinstance(tutor_row['subjects_list'], list):
        tutor_subjects.extend([s.lower() for s in tutor_row['subjects_list'] if isinstance(s, str)])
    
    # Add from subjectDetails
    if 'subjectDetails' in tutor_row and isinstance(tutor_row['subjectDetails'], list):
        for detail in tutor_row['subjectDetails']:
            if isinstance(detail, dict) and 'name' in detail and isinstance(detail['name'], str):
                tutor_subjects.append(detail['name'].lower())
    
    # If tutor has no subjects, return 0
    if not tutor_subjects:
        return 0
    
    # Remove duplicates
    tutor_subjects = list(set(tutor_subjects))
    
    # Count exact and partial matches
    exact_matches = sum(1 for subj in user_preferred_subjects if subj in tutor_subjects)
    partial_matches = sum(1 for subj in user_preferred_subjects 
                        if not subj in tutor_subjects and any(subj in ts for ts in tutor_subjects))
    
    # Calculate weighted score (exact matches are worth more)
    return (exact_matches * 1.0 + partial_matches * 0.5) / len(user_preferred_subjects)

def prepare_recommendations_for_response(recommended_df, user_data):
    """Prepare the recommendation DataFrame for response with needed frontend info"""
    recommendations = []
    
    for idx, tutor in recommended_df.iterrows():
        # Create a dictionary with all the original tutor data
        tutor_dict = tutor.to_dict()
        
        # Add component scores for frontend display
        tutor_dict["combined_score"] = float(tutor.get("combined_score", 0))
        tutor_dict["location_match_score"] = float(tutor.get("location_score", 0))
        tutor_dict["subject_match_score"] = float(tutor.get("subject_match_score", 0))
        
        # Generate recommendation reasons
        reasons = []
        
        # Location reason (highest priority)
        loc_score = tutor.get("location_score", 0)
        if loc_score > 0.7:
            reasons.append("Very close to your location")
        elif loc_score > 0.5:
            reasons.append("Near your location")
        elif loc_score > 0.3:
            reasons.append("In your area")
        
        # Rating reason (second priority)
        try:
            rating = float(tutor.get("rating", 0))
            if rating >= 4.5:
                reasons.append(f"Excellent rating ({rating}/5)")
            elif rating >= 4.0:
                reasons.append(f"Very good rating ({rating}/5)")
            elif rating >= 3.5:
                reasons.append(f"Good rating ({rating}/5)")
        except (ValueError, TypeError):
            pass
        
        # Subject match reason (third priority)
        subj_score = tutor.get("subject_match_score", 0)
        if subj_score > 0.8 and user_data.get("preferredSubjects"):
            matching_subjects = []
            if 'subjects_list' in tutor and isinstance(tutor['subjects_list'], list):
                user_subjects = [s.lower() for s in user_data.get("preferredSubjects", [])]
                tutor_subjects = [s.lower() for s in tutor['subjects_list'] if isinstance(s, str)]
                
                matching_subjects = [s for s in user_data.get("preferredSubjects", []) 
                                    if any(s.lower() in ts.lower() for ts in tutor_subjects)]
            
            if matching_subjects:
                subject_str = ", ".join(matching_subjects[:2])
                reasons.append(f"Teaches your preferred subject(s): {subject_str}")
            else:
                reasons.append("Matches your subject preferences")
        elif subj_score > 0.5:
            reasons.append("Teaches subjects you're interested in")
        
        # Popularity reason (fourth priority)
        try:
            bookings = int(tutor.get("bookingsCount", 0))
            if bookings > 30:
                reasons.append(f"Very popular tutor ({bookings}+ completed sessions)")
            elif bookings > 15:
                reasons.append(f"Popular tutor ({bookings}+ completed sessions)")
            elif bookings > 5:
                reasons.append(f"Has completed {bookings}+ tutoring sessions")
        except (ValueError, TypeError):
            pass
        
        # Experience reason (fifth priority)
        try:
            years = int(tutor.get("experience_years", 0))
            if years > 5:
                reasons.append(f"{years}+ years of teaching experience")
            elif years > 0:
                reasons.append(f"{years} year{'' if years == 1 else 's'} of teaching experience")
        except (ValueError, TypeError):
            pass
        
        # Add reasons to the tutor data
        tutor_dict["recommendationReasons"] = reasons[:3]  # Limit to top 3 reasons
        
        recommendations.append(tutor_dict)
    
    return recommendations

if __name__ == '__main__':
    logger.info("Starting recommendation service on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=True)