import { aiService } from "./aiService";

interface ExtractedLessonData {
  title?: string;
  subject?: string;
  gradeLevel?: string;
  objective?: string;
  activities?: string;
  materials?: string;
  duration?: number;
  topics?: string;
  standardsCovered?: string[];
  estimatedStudentCount?: number;
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
      // For Word documents, extract text content
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
      } catch (mammothError) {
        console.warn("Mammoth not available, falling back to buffer text extraction");
        textContent = file.buffer.toString("utf-8");
      }
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
Please analyze the following lesson plan text and extract key information. Return the data as a JSON object with the following fields (use exact field names):

{
  "title": "lesson title",
  "subject": "subject area (e.g., Computer Science, Mathematics, English Language Arts, Science, Social Studies)",
  "gradeLevel": "grade level (e.g., K, 1st, 2nd, 3rd, 9th, 10th, 11th, 12th)",
  "objective": "main learning objectives separated by newlines",
  "activities": "description of lesson activities and agenda items",
  "materials": "materials and resources needed",
  "duration": 50,
  "topics": "specific topics covered in the lesson",
  "standardsCovered": ["array", "of", "educational", "standards"],
  "estimatedStudentCount": 25
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
  const originalText = text;
  const lines = text.split('\n');
  const lowerLines = text.toLowerCase().split('\n');
  const extractedData: ExtractedLessonData = {};

  // Extract title - look for "Lesson Title:" or similar patterns
  const titlePattern = /(?:lesson title|title):\s*(.+)/i;
  const titleMatch = originalText.match(titlePattern);
  if (titleMatch) {
    extractedData.title = titleMatch[1].trim();
  } else {
    // Fallback: find first meaningful line
    const titleLine = lines.find(line => 
      line.trim().length > 10 && 
      line.trim().length < 100 && 
      !line.includes('📅') &&
      !line.includes('🎓') &&
      !/^(objective|goal|aim|purpose|subject|grade|duration|time|materials|activities|standards)/i.test(line)
    );
    if (titleLine) {
      extractedData.title = titleLine.trim().replace(/^📚\s*/, '');
    }
  }

  // Extract subject - look for course information
  const subjectPattern = /(?:course|subject):\s*(.+)/i;
  const subjectMatch = originalText.match(subjectPattern);
  if (subjectMatch) {
    extractedData.subject = subjectMatch[1].trim();
  } else if (originalText.toLowerCase().includes('computer science')) {
    extractedData.subject = 'Computer Science';
  }

  // Extract grade level
  const gradePattern = /(?:grade level):\s*(.+)/i;
  const gradeMatch = originalText.match(gradePattern);
  if (gradeMatch) {
    extractedData.gradeLevel = gradeMatch[1].trim();
  }

  // Extract objectives - look for objectives section
  const objectivePattern = /🎯\s*objectives?:\s*([\s\S]*?)(?=\n(?:📄|📅|🌐|📊|🛠️|🔗|\n))/i;
  const objectiveMatch = originalText.match(objectivePattern);
  if (objectiveMatch) {
    const objectives = objectiveMatch[1]
      .split(/[-•]\s*/)
      .filter(obj => obj.trim().length > 0)
      .map(obj => obj.trim())
      .join('\n');
    extractedData.objective = objectives;
  }

  // Extract activities from agenda
  const agendaPattern = /📅\s*agenda:\s*([\s\S]*?)(?=\n(?:🌐|📊|🛠️|🔗|\n))/i;
  const agendaMatch = originalText.match(agendaPattern);
  if (agendaMatch) {
    extractedData.activities = agendaMatch[1].trim();
  }

  // Extract materials
  const materialsPattern = /🌐\s*materials:\s*([\s\S]*?)(?=\n(?:📊|🛠️|🔗|\n))/i;
  const materialsMatch = originalText.match(materialsPattern);
  if (materialsMatch) {
    extractedData.materials = materialsMatch[1].trim();
  }

  // Extract duration
  const durationPattern = /📅\s*duration:\s*(\d+)/i;
  const durationMatch = originalText.match(durationPattern);
  if (durationMatch) {
    extractedData.duration = parseInt(durationMatch[1]);
  }

  // Extract standards
  const standardsPattern = /📄\s*standards alignment:\s*([\s\S]*?)(?=\n(?:📅|🌐|📊|🛠️|🔗|\n))/i;
  const standardsMatch = originalText.match(standardsPattern);
  if (standardsMatch) {
    const standards = standardsMatch[1]
      .split(/[-•]\s*/)
      .filter(std => std.trim().length > 0)
      .map(std => std.trim());
    extractedData.standardsCovered = standards;
  }

  // Extract topics
  if (originalText.toLowerCase().includes('classes and objects')) {
    extractedData.topics = 'Classes and Objects in Java, Object-Oriented Programming';
  }

  return extractedData;
}