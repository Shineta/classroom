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

  async extractLessonPlanData(prompt: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert educational assistant that extracts structured information from lesson plans. Always respond with valid JSON containing only the requested fields. If information is not available, omit that field from the response."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || "{}";
    } catch (error) {
      console.error("Error extracting lesson plan data with AI:", error);
      throw new Error("Failed to extract lesson plan data");
    }
  }
}

export const aiService = new AIService();