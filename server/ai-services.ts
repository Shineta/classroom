// AI-powered automation services
import OpenAI from "openai";
import { getAllStandards, getStandardsForSubject } from "@shared/standards";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StandardsSuggestion {
  suggestedStandards: string[];
  confidence: number;
  reasoning: string;
}

export interface FeedbackSuggestion {
  strengths: string;
  areasForGrowth: string;
  additionalComments: string;
  confidence: number;
}

export interface PatternAnalysis {
  commonStrengths: Array<{ pattern: string; frequency: number; teachers: string[] }>;
  growthAreas: Array<{ pattern: string; frequency: number; teachers: string[] }>;
  trends: Array<{ trend: string; description: string; recommendation: string }>;
  insights: string;
}

// Suggest standards based on lesson objective and subject
export async function suggestStandards(
  lessonObjective: string,
  subject: string
): Promise<StandardsSuggestion> {
  try {
    const availableStandards = getStandardsForSubject(subject);
    const prompt = `
You are an educational standards expert. Given a lesson objective and subject area, suggest which curriculum standards are most likely being addressed.

Lesson Objective: "${lessonObjective}"
Subject: "${subject}"

Available Standards:
${availableStandards.map((std, idx) => `${idx + 1}. ${std}`).join('\n')}

Analyze the lesson objective and suggest the 3-5 most relevant standards from the list above. Consider:
- Direct alignment with the objective
- Grade-level appropriateness
- Common instructional practices

Respond with JSON in this format:
{
  "suggestedStandards": ["standard1", "standard2", "standard3"],
  "confidence": 0.85,
  "reasoning": "Explanation of why these standards were selected"
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate suggested standards exist in our list
    const validStandards = result.suggestedStandards?.filter((std: string) => 
      availableStandards.includes(std)
    ) || [];

    return {
      suggestedStandards: validStandards,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || "AI analysis of lesson objective alignment with standards",
    };
  } catch (error) {
    console.error("Error suggesting standards:", error);
    return {
      suggestedStandards: [],
      confidence: 0,
      reasoning: "Unable to analyze standards due to AI service error",
    };
  }
}

// Generate feedback suggestions based on observation data
export async function generateFeedbackSuggestions(observationData: {
  subject: string;
  gradeLevel: string;
  lessonObjective: string;
  engagementLevel: string;
  climate: string;
  evidenceOfLearning: string;
  effectivenessRatings: any;
}): Promise<FeedbackSuggestion> {
  try {
    const prompt = `
You are an experienced instructional coach providing feedback on a classroom observation. Based on the observation data, suggest constructive feedback focusing on strengths and growth areas.

Observation Data:
- Subject: ${observationData.subject}
- Grade Level: ${observationData.gradeLevel}
- Lesson Objective: ${observationData.lessonObjective}
- Engagement Level: ${observationData.engagementLevel}/5
- Classroom Climate: ${observationData.climate}
- Evidence of Learning: ${observationData.evidenceOfLearning}
- Teaching Effectiveness: ${JSON.stringify(observationData.effectivenessRatings)}

Provide constructive, specific, and actionable feedback. Focus on:
1. Concrete strengths observed
2. Specific areas for growth with actionable suggestions
3. Additional supportive comments

Respond with JSON in this format:
{
  "strengths": "Specific strengths with examples from the observation",
  "areasForGrowth": "Specific growth areas with actionable suggestions",
  "additionalComments": "Supportive comments and next steps",
  "confidence": 0.8
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      strengths: result.strengths || "Positive classroom environment observed",
      areasForGrowth: result.areasForGrowth || "Continue implementing effective teaching strategies",
      additionalComments: result.additionalComments || "Keep up the excellent work",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
    };
  } catch (error) {
    console.error("Error generating feedback suggestions:", error);
    return {
      strengths: "Unable to generate feedback due to AI service error",
      areasForGrowth: "Please provide manual feedback",
      additionalComments: "AI assistance temporarily unavailable",
      confidence: 0,
    };
  }
}

// Analyze patterns across multiple walkthroughs
export async function analyzeWalkthroughPatterns(walkthroughs: Array<{
  id: string;
  teacherId: string;
  subject: string;
  strengths: string;
  areasForGrowth: string;
  engagementLevel: string;
  dateTime: string;
}>): Promise<PatternAnalysis> {
  try {
    if (walkthroughs.length === 0) {
      return {
        commonStrengths: [],
        growthAreas: [],
        trends: [],
        insights: "Insufficient data for pattern analysis",
      };
    }

    const prompt = `
You are an educational data analyst examining patterns across classroom observations. Analyze the following walkthrough data to identify trends, common strengths, and areas for organizational growth.

Walkthrough Data:
${walkthroughs.map(w => `
- Teacher: ${w.teacherId}
- Subject: ${w.subject}
- Engagement: ${w.engagementLevel}/5
- Date: ${w.dateTime}
- Strengths: ${w.strengths}
- Growth Areas: ${w.areasForGrowth}
`).join('\n')}

Analyze for:
1. Most frequent strengths patterns across teachers
2. Most common growth areas needing attention
3. Trends over time or by subject
4. Organizational insights and recommendations

Respond with JSON in this format:
{
  "commonStrengths": [
    {"pattern": "strength description", "frequency": 5, "teachers": ["id1", "id2"]}
  ],
  "growthAreas": [
    {"pattern": "growth area description", "frequency": 3, "teachers": ["id1", "id3"]}
  ],
  "trends": [
    {"trend": "trend name", "description": "trend description", "recommendation": "action suggestion"}
  ],
  "insights": "Overall organizational insights and recommendations"
}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      commonStrengths: result.commonStrengths || [],
      growthAreas: result.growthAreas || [],
      trends: result.trends || [],
      insights: result.insights || "Pattern analysis completed successfully",
    };
  } catch (error) {
    console.error("Error analyzing walkthrough patterns:", error);
    return {
      commonStrengths: [],
      growthAreas: [],
      trends: [],
      insights: "Unable to analyze patterns due to AI service error",
    };
  }
}

// Generate automated reports
export async function generateAutomatedReport(
  timeframe: string,
  stats: {
    totalWalkthroughs: number;
    pendingReviews: number;
    averageEngagement: number;
    topSubjects: Array<{ subject: string; count: number }>;
    teachersObserved: number;
  },
  patterns: PatternAnalysis
): Promise<string> {
  try {
    const prompt = `
Generate a professional summary report for educational leadership based on classroom observation data.

Timeframe: ${timeframe}
Statistics:
- Total Walkthroughs: ${stats.totalWalkthroughs}
- Pending Reviews: ${stats.pendingReviews}
- Average Engagement Level: ${stats.averageEngagement}/5
- Teachers Observed: ${stats.teachersObserved}
- Top Subjects: ${stats.topSubjects.map(s => `${s.subject} (${s.count})`).join(', ')}

Pattern Analysis:
- Common Strengths: ${patterns.commonStrengths.map(s => s.pattern).join(', ')}
- Growth Areas: ${patterns.growthAreas.map(g => g.pattern).join(', ')}
- Key Trends: ${patterns.trends.map(t => t.trend).join(', ')}

Create a concise, professional report suitable for educational leadership that:
1. Summarizes key metrics
2. Highlights organizational strengths
3. Identifies areas for improvement
4. Provides actionable recommendations
5. Maintains a positive, growth-oriented tone

Format as a professional email body or report summary.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "Report generation failed";
  } catch (error) {
    console.error("Error generating automated report:", error);
    return "Unable to generate automated report due to AI service error";
  }
}