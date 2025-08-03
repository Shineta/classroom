import { aiService } from "./aiService";

interface ExtractedLessonData {
  title?: string;
  subject?: string;
  gradeLevel?: string;
  duration?: number;
  objectives?: string;
  activities?: string;
  materials?: string;
  lessonTopics?: string;
  standardsCovered?: string[];
  studentCount?: number;
  assessment?: string;
  differentiation?: string;
}

// Enhanced pattern matching for comprehensive lesson plan extraction
const LESSON_PATTERNS = {
  title: /(?:lesson\s+title|title)\s*:?\s*(.+?)(?:\n|$)/i,
  subject: /(?:subject(?:\s+area)?|course)\s*:?\s*(.+?)(?:\n|$)/i,
  gradeLevel: /(?:grade\s+level|target\s+grade|grade)\s*:?\s*(.+?)(?:\n|$)/i,
  duration: /(?:duration|time|length)\s*:?\s*(.+?)(?:\n|$)/i,
  objectives: /(?:learning\s+objectives?|objectives?)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  activities: /(?:lesson\s+activities?|activities?|procedures?)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  materials: /(?:required\s+materials?|materials?|resources?|equipment)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  topics: /(?:lesson\s+topics?|topics?|key\s+concepts?|content)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  standards: /(?:standards?\s+alignment?|standards?|ap\s+computer\s+science|csta|common\s+core)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  studentCount: /(?:estimated\s+student\s+count|student\s+count|class\s+size|enrollment)\s*:?\s*(.+?)(?:\n|$)/i,
  assessment: /(?:assessment\s+methods?|assessment|evaluation|how\s+will\s+you\s+assess)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
  differentiation: /(?:differentiation\s+strategies?|differentiation|accommodations?|how\s+will\s+you\s+accommodate)\s*:?\s*((?:.|\n)*?)(?=\n\s*(?:[A-Z][^:]*:|$))/i,
};

function extractWithPatterns(text: string): Partial<ExtractedLessonData> {
  const extracted: Partial<ExtractedLessonData> = {};
  
  // Extract title
  const titleMatch = text.match(LESSON_PATTERNS.title);
  if (titleMatch) extracted.title = titleMatch[1].trim();
  
  // Extract subject
  const subjectMatch = text.match(LESSON_PATTERNS.subject);
  if (subjectMatch) extracted.subject = subjectMatch[1].trim();
  
  // Extract grade level
  const gradeMatch = text.match(LESSON_PATTERNS.gradeLevel);
  if (gradeMatch) extracted.gradeLevel = gradeMatch[1].trim();
  
  // Extract duration
  const durationMatch = text.match(LESSON_PATTERNS.duration);
  if (durationMatch) {
    const durationStr = durationMatch[1].trim();
    const minutes = parseInt(durationStr.match(/\d+/)?.[0] || "45");
    extracted.duration = minutes;
  }
  
  // Extract objectives with enhanced pattern recognition
  const objectivesMatch = text.match(LESSON_PATTERNS.objectives);
  if (objectivesMatch) {
    let objectives = objectivesMatch[1].trim();
    // Clean up the objectives text
    objectives = objectives
      .replace(/\s+/g, ' ')
      .replace(/Students will/gi, 'Students will')
      .trim();
    extracted.objectives = objectives;
  }
  
  // Extract activities
  const activitiesMatch = text.match(LESSON_PATTERNS.activities);
  if (activitiesMatch) {
    let activities = activitiesMatch[1].trim();
    // Clean up activities text
    activities = activities
      .replace(/\s+/g, ' ')
      .replace(/(\d+\.)/g, '\n$1')
      .trim();
    extracted.activities = activities;
  }
  
  // Extract materials
  const materialsMatch = text.match(LESSON_PATTERNS.materials);
  if (materialsMatch) {
    extracted.materials = materialsMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  // Extract topics
  const topicsMatch = text.match(LESSON_PATTERNS.topics);
  if (topicsMatch) {
    extracted.lessonTopics = topicsMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  // Extract standards with enhanced parsing
  const standardsMatch = text.match(LESSON_PATTERNS.standards);
  if (standardsMatch) {
    const standardsText = standardsMatch[1].trim();
    // Parse standards into array with better recognition
    const standards = [];
    
    // Look for specific patterns like "AP Computer Science A:", "CSTA:", etc.
    const lines = standardsText.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim().replace(/^[-•]\s*/, '');
      if (cleanLine.length > 5 && !cleanLine.match(/^\s*$/) && !cleanLine.match(/^[a-z\s]*$/)) {
        standards.push(cleanLine);
      }
    }
    
    if (standards.length > 0) {
      extracted.standardsCovered = standards;
    }
  }
  
  // Extract student count
  const studentCountMatch = text.match(LESSON_PATTERNS.studentCount);
  if (studentCountMatch) {
    const countStr = studentCountMatch[1].trim();
    const count = parseInt(countStr.match(/\d+/)?.[0] || "25");
    extracted.studentCount = count;
  }
  
  // Extract assessment methods
  const assessmentMatch = text.match(LESSON_PATTERNS.assessment);
  if (assessmentMatch) {
    extracted.assessment = assessmentMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  // Extract differentiation strategies  
  const differentiationMatch = text.match(LESSON_PATTERNS.differentiation);
  if (differentiationMatch) {
    extracted.differentiation = differentiationMatch[1].trim().replace(/\s+/g, ' ');
  }
  
  return extracted;
}

// Enhanced regex patterns for backward compatibility
function extractWithRegex(text: string): Partial<ExtractedLessonData> {
  const extracted: Partial<ExtractedLessonData> = {};

  // Enhanced patterns for all fields
  const patterns = {
    title: [
      /Activity\s+(\d+\.\d+\.\d+)\s+(.+?)(?:\n|$)/i,
      /Lesson\s+Title\s*:?\s*(.+?)(?:\n|$)/i,
      /Title\s*:?\s*(.+?)(?:\n|$)/i,
    ],
    subject: [
      /Subject\s*:?\s*(.+?)(?:\n|$)/i,
      /Course\s*:?\s*(.+?)(?:\n|$)/i,
      /(?:Computer Science|Mathematics|Science|English)/i,
    ],
    gradeLevel: [
      /Grade\s+Level\s*:?\s*(.+?)(?:\n|$)/i,
      /(?:9-12|High School|Middle School|Elementary)/i,
    ],
    materials: [
      /(?:Computer Science Notebook|Interactive.*?Editor|Java IDE)/i,
      /Materials\s*:?\s*(.+?)(?:\n|$)/i,
    ],
    objectives: [
      /Students will (.+?)(?:\.|$)/gi,
      /Objectives?\s*:?\s*(.+?)(?:\n\n|$)/i,
    ],
    duration: [
      /(\d+)\s*minutes?/i,
      /Duration\s*:?\s*(.+?)(?:\n|$)/i,
    ],
    studentCount: [
      /(\d+)\s*students?/i,
      /Student\s+Count\s*:?\s*(.+?)(?:\n|$)/i,
    ]
  };

  // Apply patterns
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (field === 'objectives' && pattern.global) {
          const objectives = text.match(pattern);
          if (objectives && objectives.length > 0) {
            extracted.objectives = objectives.join(' ');
          }
        } else if (match[1]) {
          if (field === 'duration' || field === 'studentCount') {
            extracted[field as keyof ExtractedLessonData] = parseInt(match[1]) as any;
          } else {
            extracted[field as keyof ExtractedLessonData] = match[1].trim() as any;
          }
        }
        break;
      }
    }
  }

  return extracted;
}

export async function extractLessonPlanData(file: Express.Multer.File): Promise<ExtractedLessonData> {
  let textContent = "";

  try {
    // Extract text based on file type
    if (file.mimetype === "application/pdf") {
      try {
        // Use pdfjs-dist for more reliable PDF text extraction
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
        
        const typedArray = new Uint8Array(file.buffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        
        console.log(`PDF loaded with ${pdf.numPages} pages`);
        
        let fullText = "";
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 20); pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
        }
        
        textContent = fullText.trim();
        console.log("PDF text extracted successfully, length:", textContent.length);
        
        // Limit text length to avoid OpenAI token limits
        if (textContent.length > 300000) {
          console.log("Text too long, truncating to first 300k characters");
          textContent = textContent.substring(0, 300000) + "\n[Content truncated due to length]";
        }
        
        if (!textContent || textContent.trim().length === 0) {
          throw new Error("PDF appears to be empty or unreadable");
        }
      } catch (pdfError) {
        console.error("Error parsing PDF with pdfjs:", pdfError);
        
        // Fallback: try simple text extraction
        try {
          textContent = file.buffer.toString('utf-8');
          textContent = textContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (textContent.length < 50) {
            throw new Error("PDF text extraction failed - insufficient content");
          }
          
          console.log("Used fallback text extraction, length:", textContent.length);
        } catch (fallbackError) {
          throw new Error("Failed to extract text from PDF file. The PDF may be image-based or encrypted. Please try converting to Word format or use a text-based PDF.");
        }
      }
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
        console.log("Word document text extracted, length:", textContent.length);
        
        if (!textContent || textContent.trim().length === 0) {
          throw new Error("Word document appears to be empty or unreadable");
        }
      } catch (wordError) {
        console.error("Error parsing Word document:", wordError);
        throw new Error("Failed to extract text from Word document");
      }
    } else if (file.mimetype === "text/plain") {
      textContent = file.buffer.toString('utf-8');
    } else {
      throw new Error("Unsupported file type");
    }

    console.log("Processing file:", file.originalname, "Type:", file.mimetype);

    // Extract data using multiple methods
    const regexExtractedData = extractWithRegex(textContent);
    const patternExtractedData = extractWithPatterns(textContent);
    
    // Try to extract data with AI
    try {
      console.log("Attempting AI extraction...");
      const aiExtractedData = await aiService.extractLessonPlanData(textContent);
      
      // Merge all extraction methods, with AI taking precedence
      const finalData = {
        ...regexExtractedData,
        ...patternExtractedData,
        ...aiExtractedData,
      };

      console.log("Extracted data:", JSON.stringify(finalData, null, 2));
      return finalData;
    } catch (aiError) {
      console.error("Error with AI extraction:", aiError);
      console.log("Falling back to pattern and regex extraction");
      
      const fallbackData = {
        ...regexExtractedData,
        ...patternExtractedData,
      };
      
      console.log("Extracted data:", JSON.stringify(fallbackData, null, 2));
      return fallbackData;
    }

  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

async function extractDataWithAI(text: string): Promise<Partial<ExtractedLessonData>> {
  try {
    return await aiService.extractLessonPlanData(text);
  } catch (error) {
    console.error("AI extraction failed:", error);
    throw error;
  }
}