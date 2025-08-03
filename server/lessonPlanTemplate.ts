export interface LessonPlanTemplate {
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number; // in minutes
  objectives: string;
  activities: string;
  materials: string;
  lessonTopics: string;
  standardsCovered: string[];
  studentCount: number;
}

export const LESSON_PLAN_TEMPLATE_PROMPT = `
You are an expert educational specialist helping teachers create comprehensive lesson plans. 

Extract and format lesson plan information from the provided text into a structured format. Focus on identifying:

**TITLE**: The main lesson or activity title
**SUBJECT**: The academic subject area (e.g., Computer Science, Mathematics, English, Science, Social Studies)
**GRADE LEVEL**: Target grade level or age group (e.g., "9-12", "High School", "Middle School", "Elementary")
**DURATION**: Estimated time in minutes for the lesson
**LEARNING OBJECTIVES**: Clear, measurable learning goals and outcomes
**ACTIVITIES**: Step-by-step activities, exercises, or lesson components
**MATERIALS**: Required resources, tools, technology, or supplies
**LESSON TOPICS**: Key concepts, skills, or topics covered
**STANDARDS**: Relevant educational standards (Common Core, AP, NGSS, CSTA, etc.)
**STUDENT COUNT**: Estimated class size

Respond with a JSON object containing these fields:
{
  "title": "Clear, descriptive lesson title",
  "subject": "Subject area",
  "gradeLevel": "Target grade level",
  "duration": 45,
  "objectives": "Specific learning objectives and goals",
  "activities": "Detailed description of lesson activities and procedures",
  "materials": "List of required materials and resources",
  "lessonTopics": "Key topics and concepts covered",
  "standardsCovered": ["Standard 1", "Standard 2"],
  "studentCount": 25
}

Guidelines:
- Extract information directly from the text when available
- Make reasonable inferences for missing information based on context
- For programming/computer science lessons, include relevant technology tools
- Keep descriptions clear and actionable for teachers
- If specific information isn't available, provide reasonable defaults based on the lesson type
`;

export const LESSON_PLAN_EXAMPLES = {
  computerScience: {
    title: "Getting Started with Java Programming",
    subject: "Computer Science",
    gradeLevel: "9-12",
    duration: 50,
    objectives: "Students will understand basic Java syntax, learn to identify and fix compilation errors, and write simple Java programs using variables and print statements.",
    activities: "1. Review Java development environment setup 2. Examine sample Java code for syntax patterns 3. Practice identifying compilation vs runtime errors 4. Complete hands-on coding exercises 5. Debug common programming mistakes",
    materials: "Computer Science Notebook, Interactive Code Editor, Java IDE or online compiler, sample code files",
    lessonTopics: "Java syntax, compilation errors, runtime errors, variables, print statements, debugging",
    standardsCovered: ["AP Computer Science A", "CSTA K-12 CS Standards 3A-AP-13", "CSTA K-12 CS Standards 3A-AP-14"],
    studentCount: 25
  },
  mathematics: {
    title: "Introduction to Linear Equations",
    subject: "Mathematics",
    gradeLevel: "8-9",
    duration: 45,
    objectives: "Students will understand the concept of linear equations, graph linear functions, and solve real-world problems using linear relationships.",
    activities: "1. Review coordinate plane basics 2. Explore slope and y-intercept concepts 3. Practice graphing linear equations 4. Solve word problems involving linear relationships 5. Complete practice exercises",
    materials: "Graphing paper, rulers, calculators, coordinate plane worksheets, graphing software",
    lessonTopics: "Linear equations, slope, y-intercept, graphing, coordinate plane",
    standardsCovered: ["CCSS.MATH.CONTENT.8.F.A.3", "CCSS.MATH.CONTENT.8.F.B.4"],
    studentCount: 24
  },
  science: {
    title: "Photosynthesis and Cellular Respiration",
    subject: "Biology",
    gradeLevel: "9-10",
    duration: 55,
    objectives: "Students will understand the processes of photosynthesis and cellular respiration, identify the reactants and products of each process, and explain how these processes are interconnected.",
    activities: "1. Review plant and animal cell structures 2. Examine photosynthesis chemical equation 3. Investigate cellular respiration process 4. Compare and contrast the two processes 5. Laboratory investigation with plants",
    materials: "Microscopes, plant specimens, lab worksheets, diagram handouts, pH indicators",
    lessonTopics: "Photosynthesis, cellular respiration, ATP, glucose, oxygen, carbon dioxide",
    standardsCovered: ["NGSS HS-LS1-5", "NGSS HS-LS1-7"],
    studentCount: 28
  }
};