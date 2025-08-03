import { aiService } from "./aiService";

interface ExtractedLessonData {
  title?: string;
  subject?: string;
  gradeLevel?: string;
  objective?: string;
  activities?: string;
  materials?: string;
  duration?: number;
  lessonTopics?: string;
  standardsCovered?: string[];
  studentCount?: number;
}

export async function extractLessonPlanData(file: Express.Multer.File): Promise<ExtractedLessonData> {
  let textContent = "";

  try {
    // Extract text based on file type
    if (file.mimetype === "application/pdf") {
      const pdfParse = await import("pdf-parse");
      const pdfData = await pdfParse.default(file.buffer);
      textContent = pdfData.text;
    } else if (
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // For Word documents, we'll treat them as text for now
      // In production, you might want to use a library like mammoth
      textContent = file.buffer.toString("utf-8");
    } else if (file.mimetype === "text/plain") {
      textContent = file.buffer.toString("utf-8");
    } else {
      throw new Error("Unsupported file type");
    }

    // Use AI to extract structured data from the text
    const extractedData = await extractDataWithAI(textContent);
    return extractedData;
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

async function extractDataWithAI(textContent: string): Promise<ExtractedLessonData> {
  try {
    const prompt = `
Please analyze the following lesson plan text and extract key information. Return the data as a JSON object with the following fields:

{
  "title": "lesson title",
  "subject": "subject area (e.g., Mathematics, English Language Arts, Science, Social Studies, etc.)",
  "gradeLevel": "grade level (e.g., K, 1st, 2nd, 3rd, etc.)",
  "objective": "main learning objective or goal",
  "activities": "description of lesson activities",
  "materials": "materials and resources needed",
  "duration": "lesson duration in minutes (number only)",
  "lessonTopics": "specific topics covered in the lesson",
  "standardsCovered": ["array", "of", "educational", "standards"],
  "studentCount": "estimated class size (number only)"
}

Only include fields where you can extract meaningful information. If a field cannot be determined from the text, omit it from the response.

Lesson plan text:
${textContent}
`;

    const response = await aiService.extractLessonPlanData(prompt);
    
    // Parse the AI response
    let extractedData: ExtractedLessonData = {};
    
    try {
      extractedData = JSON.parse(response);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback: try to extract basic information with simple text analysis
      extractedData = extractBasicInfo(textContent);
    }

    return extractedData;
  } catch (error) {
    console.error("Error with AI extraction:", error);
    // Fallback to basic text analysis
    return extractBasicInfo(textContent);
  }
}

function extractBasicInfo(text: string): ExtractedLessonData {
  const lines = text.toLowerCase().split('\n');
  const extractedData: ExtractedLessonData = {};

  // Try to find title (usually first meaningful line)
  const titleLine = lines.find(line => 
    line.trim().length > 5 && 
    line.trim().length < 100 && 
    !line.includes(':') &&
    !/^(objective|goal|aim|purpose|subject|grade|duration|time|materials|activities)/i.test(line)
  );
  if (titleLine) {
    extractedData.title = titleLine.trim();
  }

  // Look for subject
  const subjectLine = lines.find(line => line.includes('subject:') || line.includes('subject area:'));
  if (subjectLine) {
    const match = subjectLine.match(/subject\s*:?\s*(.+)/i);
    if (match) extractedData.subject = match[1].trim();
  }

  // Look for grade level
  const gradeLine = lines.find(line => line.includes('grade:') || line.includes('grade level:'));
  if (gradeLine) {
    const match = gradeLine.match(/grade\s*(?:level)?\s*:?\s*(.+)/i);
    if (match) extractedData.gradeLevel = match[1].trim();
  }

  // Look for objective
  const objectiveLine = lines.find(line => 
    line.includes('objective:') || 
    line.includes('learning objective:') || 
    line.includes('goal:') ||
    line.includes('aim:')
  );
  if (objectiveLine) {
    const match = objectiveLine.match(/(?:objective|goal|aim)\s*:?\s*(.+)/i);
    if (match) extractedData.objective = match[1].trim();
  }

  // Look for materials
  const materialsLine = lines.find(line => line.includes('materials:') || line.includes('resources:'));
  if (materialsLine) {
    const match = materialsLine.match(/(?:materials|resources)\s*:?\s*(.+)/i);
    if (match) extractedData.materials = match[1].trim();
  }

  // Look for duration
  const durationLine = lines.find(line => line.includes('duration:') || line.includes('time:'));
  if (durationLine) {
    const match = durationLine.match(/\d+/);
    if (match) extractedData.duration = parseInt(match[0]);
  }

  return extractedData;
}