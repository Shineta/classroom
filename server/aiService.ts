import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WalkthroughAnalysis {
  strengths: string;
  areasForGrowth: string;
  additionalComments: string;
}

export class AIService {
  async generateWalkthroughFeedback(walkthroughData: {
    subject: string;
    gradeLevel?: string;
    teacherName: string;
    lessonObjective?: string;
    evidenceOfLearning?: string;
    behaviorRoutines?: {
      routines: string[];
      notes?: string;
    };
    climate?: string;
    climateNotes?: string;
    engagementLevel?: string;
    transitions?: string;
    transitionComments?: string;
    effectivenessRatings?: {
      clearInstructions?: string;
      questioningTechniques?: string;
      useOfMaterials?: string;
      studentInteraction?: string;
      differentiation?: string;
      timeManagement?: string;
    };
  }): Promise<WalkthroughAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(walkthroughData);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an experienced instructional coach and educational expert specializing in classroom observations and teacher development. Provide constructive, specific, and actionable feedback based on walkthrough data. Be professional, supportive, and focus on evidence-based observations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure all fields are strings, not arrays
      const ensureString = (value: any): string => {
        if (Array.isArray(value)) {
          return value.join('\n\n');
        }
        return typeof value === 'string' ? value : String(value || '');
      };
      
      return {
        strengths: ensureString(result.strengths) || "Unable to generate strengths analysis.",
        areasForGrowth: ensureString(result.areasForGrowth) || "Unable to generate growth recommendations.",
        additionalComments: ensureString(result.additionalComments) || "Unable to generate additional insights."
      };
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      throw new Error("Failed to generate AI feedback. Please try again.");
    }
  }

  private buildAnalysisPrompt(data: any): string {
    let prompt = `Analyze this classroom walkthrough data and provide specific, constructive feedback in JSON format with three fields: "strengths", "areasForGrowth", and "additionalComments".

**Walkthrough Details:**
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel || 'Not specified'}
- Teacher: ${data.teacherName}
- Lesson Objective: ${data.lessonObjective || 'Not provided'}

**Observations:**`;

    if (data.evidenceOfLearning) {
      prompt += `\n- Evidence of Learning: ${data.evidenceOfLearning}`;
    }

    if (data.behaviorRoutines?.routines?.length) {
      prompt += `\n- Behavior Management Routines: ${data.behaviorRoutines.routines.join(', ')}`;
      if (data.behaviorRoutines.notes) {
        prompt += `\n  Notes: ${data.behaviorRoutines.notes}`;
      }
    }

    if (data.climate) {
      prompt += `\n- Classroom Climate: ${data.climate}`;
      if (data.climateNotes) {
        prompt += ` (${data.climateNotes})`;
      }
    }

    if (data.engagementLevel) {
      prompt += `\n- Student Engagement Level: ${data.engagementLevel}/5`;
    }

    if (data.transitions) {
      prompt += `\n- Transitions: ${data.transitions}`;
      if (data.transitionComments) {
        prompt += ` (${data.transitionComments})`;
      }
    }

    if (data.effectivenessRatings) {
      prompt += `\n**Teaching Effectiveness Ratings:**`;
      Object.entries(data.effectivenessRatings).forEach(([key, value]) => {
        if (value) {
          const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          prompt += `\n- ${readableKey}: ${value}`;
        }
      });
    }

    prompt += `

**Instructions:**
1. **Strengths**: Highlight 2-3 specific positive teaching practices observed, referencing the actual data points. Be concrete and celebratory. Return as a single string with multiple paragraphs if needed.

2. **Areas for Growth**: Provide 2-3 constructive suggestions for improvement based on the ratings and observations. Include specific, actionable strategies the teacher can implement. Return as a single string with multiple paragraphs if needed.

3. **Additional Comments**: Synthesize overall observations, note patterns, and provide any additional context or recommendations for professional development. Return as a single string.

Keep feedback professional, supportive, and evidence-based. Avoid generic statements and focus on specific observations from the data provided.

IMPORTANT: Each field (strengths, areasForGrowth, additionalComments) must be a single string value, not an array. Use line breaks or paragraphs within the string if you need to separate multiple points.

Respond in JSON format only.`;

    return prompt;
  }

  async extractLessonPlanData(text: string): Promise<ExtractedLessonData> {
    // Limit input text to prevent token limit issues
    const processedText = text.length > 50000 ? text.substring(0, 50000) + "\n[Content truncated for processing]" : text;
    
    const prompt = `
You are an expert educational specialist. Extract lesson plan information from the following text and return it as a JSON object.

Look for these fields:
- title: The lesson title or activity name
- subject: The subject area (e.g., Computer Science, Math, Science, English)
- gradeLevel: Target grade level (e.g., "9-12", "High School")
- duration: Time in minutes (estimate if not specified)
- objectives: Learning objectives and goals
- activities: Description of lesson activities
- materials: Required materials and resources
- lessonTopics: Key topics and concepts covered
- standardsCovered: Educational standards referenced (as array)
- studentCount: Estimated class size (number)

Text to analyze:
${processedText}

Return only valid JSON in this format:
{
  "title": "...",
  "subject": "...",
  "gradeLevel": "...",
  "duration": 45,
  "objectives": "...",
  "activities": "...",
  "materials": "...",
  "lessonTopics": "...",
  "standardsCovered": ["..."],
  "studentCount": 25
}`;

    try {
      console.log("Sending text to OpenAI for lesson plan extraction...");
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const extractedData = JSON.parse(content) as ExtractedLessonData;
      
      // Validate and clean the extracted data
      const cleanedData: ExtractedLessonData = {
        title: extractedData.title || "Untitled Lesson",
        subject: extractedData.subject || "General",
        gradeLevel: extractedData.gradeLevel || "K-12",
        duration: Number(extractedData.duration) || 45,
        objectives: extractedData.objectives || "",
        activities: extractedData.activities || "",
        materials: extractedData.materials || "",
        lessonTopics: extractedData.lessonTopics || "",
        standardsCovered: Array.isArray(extractedData.standardsCovered) ? extractedData.standardsCovered : [],
        studentCount: Number(extractedData.studentCount) || 25,
      };

      return cleanedData;
    } catch (error) {
      console.error("Error extracting lesson plan data with AI:", error);
      throw new Error("Failed to extract lesson plan data");
    }
  }
}

export const aiService = new AIService();