// services/geminiService.js

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Analyzes the match between a student's profile and an internship requirements.
 * @param {Object} studentProfile - The profile document from Firestore
 * @param {Object} internshipDetails - The internship document from Firestore
 * @returns {Promise<Object>} JSON containing matchPercentage, strengths, gaps, and recommendations.
 */
export const analyzeInternshipMatch = async (
  studentProfile,
  internshipDetails,
) => {
  const prompt = `
    Compare this student's profile details with the internship requirements.
    
    Student Profile:
    - Bio: ${studentProfile.bio || "None"}
    - Skills: ${studentProfile.skills ? studentProfile.skills.join(", ") : "None"}
    - Education: ${studentProfile.degree || ""} at ${studentProfile.collegeName || ""}
    - Projects: ${studentProfile.projects || "None"}
    - Experience: ${studentProfile.experience || "None"}
    
    Internship Details:
    - Title: ${internshipDetails.title}
    - Company: ${internshipDetails.company}
    - Description: ${internshipDetails.description}
    - Requirements: ${internshipDetails.requirements || "None"}
    
    Respond ONLY with a JSON object. Do not include any markdown formatting (like \`\`\`json) or extra text. Match this exact format:
    {
      "matchPercentage": 85,
      "strengths": ["list 2 key matching skills"],
      "gaps": ["list 2 missing requirements"],
      "recommendations": "Provide a brief tip."
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(
      "Could not connect to Gemini API. Please check your internet connection and API key.",
    );
  }
};
