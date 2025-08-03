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
      try {
        const pdfParse = await import("pdf-parse");
        const pdfData = await pdfParse.default(file.buffer);
        textContent = pdfData.text;
        console.log("PDF text extracted, length:", textContent.length);
      } catch (pdfError) {
        console.error("Error parsing PDF:", pdfError);
        throw new Error("Failed to extract text from PDF file");
      }
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
You are analyzing educational content to extract lesson plan information. The content may be from a structured lesson plan document, an activity guide, or educational material. Extract relevant information and return it as a JSON object with these fields:

{
  "title": "lesson or activity title",
  "subject": "subject area (e.g., Computer Science, Mathematics, English Language Arts, Science, Social Studies)",
  "gradeLevel": "grade level (e.g., K, 1st, 2nd, 3rd, 9th-12th, High School)",
  "objective": "learning goals and objectives separated by newlines",
  "activities": "description of learning activities, exercises, and tasks",
  "materials": "required materials, tools, and resources",
  "duration": 50,
  "topics": "specific topics and concepts covered",
  "standardsCovered": ["educational", "standards", "if", "mentioned"],
  "estimatedStudentCount": 25
}

Instructions:
- If this is an activity guide rather than a complete lesson plan, extract the activity information as lesson content
- For duration, estimate based on content complexity (default: 50 minutes for substantial activities)
- Include any programming concepts, learning goals, or educational objectives mentioned
- List any specific tools, software, or materials mentioned
- If standards are referenced, include them in the array

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
  const lowerText = text.toLowerCase();
  const extractedData: ExtractedLessonData = {};

  // Extract title - look for activity titles or lesson names
  const titlePatterns = [
    /activity\s+[\d.]+\s+(.+)/i,
    /(?:lesson title|title):\s*(.+)/i,
    /getting started with\s+(.+)/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      extractedData.title = match[1].trim();
      break;
    }
  }
  
  // Fallback title extraction
  if (!extractedData.title) {
    const titleLine = lines.find(line => 
      line.trim().length > 10 && 
      line.trim().length < 100 && 
      !line.includes('📅') &&
      !line.includes('🎓') &&
      !/^(objective|goal|aim|purpose|subject|grade|duration|time|materials|activities|standards)/i.test(line) &&
      !line.includes('Section') &&
      !line.includes('Page')
    );
    if (titleLine) {
      extractedData.title = titleLine.trim().replace(/^📚\s*/, '');
    }
  }

  // Extract subject - look for course information and programming languages
  const subjectPatterns = [
    /(?:course|subject):\s*(.+)/i,
    /(computer science|java programming|programming)/i
  ];
  
  for (const pattern of subjectPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      extractedData.subject = match[1].includes('java') || match[1].includes('Java') ? 'Computer Science' : match[1].trim();
      break;
    }
  }
  
  if (!extractedData.subject && (lowerText.includes('java') || lowerText.includes('programming'))) {
    extractedData.subject = 'Computer Science';
  }

  // Extract grade level - look for AP, high school indicators
  const gradePatterns = [
    /(?:grade level):\s*(.+)/i,
    /(ap\s+computer science|high school|9th|10th|11th|12th)/i
  ];
  
  for (const pattern of gradePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      if (match[1].toLowerCase().includes('ap')) {
        extractedData.gradeLevel = '11th-12th';
      } else {
        extractedData.gradeLevel = match[1].trim();
      }
      break;
    }
  }

  // Extract objectives - look for goals, objectives, or learning outcomes
  const objectivePatterns = [
    /🎯\s*objectives?:\s*([\s\S]*?)(?=\n(?:📄|📅|🌐|📊|🛠️|🔗|\n))/i,
    /goals?\s*:?\s*([\s\S]*?)(?=\n\s*(?:resources|materials|activities|section))/i,
    /learn about\s+([\s\S]*?)(?=\n\s*(?:[A-Z]|$))/i
  ];
  
  for (const pattern of objectivePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      const objectives = match[1]
        .split(/[-•]\s*/)
        .filter(obj => obj.trim().length > 5)
        .map(obj => obj.trim())
        .join('\n');
      if (objectives.length > 10) {
        extractedData.objective = objectives;
        break;
      }
    }
  }

  // Extract activities - look for various activity sections
  const activityPatterns = [
    /📅\s*agenda:\s*([\s\S]*?)(?=\n(?:🌐|📊|🛠️|🔗|\n))/i,
    /debug your first\s+([\s\S]*?)(?=section|computer science notebook)/i,
    /examine the following\s+([\s\S]*?)(?=\n\s*[A-Z])/i
  ];
  
  for (const pattern of activityPatterns) {
    const match = originalText.match(pattern);
    if (match && match[1].trim().length > 20) {
      extractedData.activities = match[1].trim();
      break;
    }
  }
  
  // If no specific activities found, extract general activity content
  if (!extractedData.activities && lowerText.includes('examine') && lowerText.includes('code')) {
    extractedData.activities = 'Students examine and debug Java code, identify compiler and runtime errors, and create basic Java programs';
  }

  // Extract materials - look for resources and tools
  const materialsPatterns = [
    /🌐\s*materials:\s*([\s\S]*?)(?=\n(?:📊|🛠️|🔗|\n))/i,
    /resources\s*:?\s*([\s\S]*?)(?=\n\s*(?:[A-Z]|goals))/i,
    /(computer science notebook|interactive code editor|java)/i
  ];
  
  for (const pattern of materialsPatterns) {
    const match = originalText.match(pattern);
    if (match && match[1].trim().length > 10) {
      extractedData.materials = match[1].trim();
      break;
    }
  }
  
  // Default materials for programming activities
  if (!extractedData.materials && (lowerText.includes('java') || lowerText.includes('code'))) {
    extractedData.materials = 'Computer Science Notebook, Interactive Code Editor, Java IDE or online compiler';
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

  // Extract topics based on content analysis
  if (originalText.toLowerCase().includes('classes and objects')) {
    extractedData.topics = 'Classes and Objects in Java, Object-Oriented Programming';
  } else if (originalText.toLowerCase().includes('getting started with java')) {
    extractedData.topics = 'Java Programming Fundamentals, Syntax, Basic Programming Concepts';
  } else if (originalText.toLowerCase().includes('compiler') && originalText.toLowerCase().includes('runtime')) {
    extractedData.topics = 'Java Programming, Compiler Errors, Runtime Errors, Debugging';
  }

  // Set default estimated student count
  if (!extractedData.estimatedStudentCount) {
    extractedData.estimatedStudentCount = 25;
  }

  return extractedData;
}