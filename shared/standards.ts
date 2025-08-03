// Computer Science Principles and Common Standards for tracking
export const csStandards = [
  // AP Computer Science Principles (CSP) Standards
  "CSP.AAP-1: Represent a value with a variable",
  "CSP.AAP-2: Determine the value of a variable as a result of an assignment",
  "CSP.AAP-3: Represent a list or string using a variable",
  "CSP.AAP-4: For determining the efficiency of an algorithm",
  "CSP.ALG-1: Express an algorithm that uses sequencing without using a programming language",
  "CSP.ALG-2: Express an algorithm that uses selection without using a programming language",
  "CSP.CRD-1: Incorporate existing code, media, and libraries into original programs",
  "CSP.CRD-2: Distribute a program as a software product",
  "CSP.DAT-1: Represent information using bits",
  "CSP.DAT-2: Use appropriate and efficient data representation",
  "CSP.IOC-1: Explain how an everyday life connects to the internet",
  "CSP.IOC-2: Describe the risks to privacy from collecting and storing personal data",

  // Common Core Mathematics Standards (often integrated with CS)
  "CCSS.MATH.8.F.A.1: Functions",
  "CCSS.MATH.HSA.SSE.A.1: Interpret expressions",
  "CCSS.MATH.HSA.CED.A.3: Linear programming",
  "CCSS.MATH.HSF.IF.A.2: Function notation",

  // NGSS Science Standards (relevant to computational thinking)
  "NGSS.K-2-ETS1-1: Engineering Design",
  "NGSS.3-5-ETS1-2: Generate solutions to design problems",
  "NGSS.MS-ETS1-1: Define criteria and constraints",
  "NGSS.HS-ETS1-2: Design solutions to complex problems",

  // CSTA K-12 Computer Science Standards
  "CSTA.1A-AP-08: Model daily processes by creating and following algorithms",
  "CSTA.1A-AP-09: Model the way programs store data",
  "CSTA.1A-AP-10: Develop programs with sequences and simple loops",
  "CSTA.1A-AP-13: Give attribution when using others' work",
  "CSTA.1B-AP-08: Compare and refine multiple algorithms",
  "CSTA.1B-AP-09: Create programs using variables",
  "CSTA.1B-AP-10: Create programs using sequencing, events, loops, conditionals",
  "CSTA.2-AP-10: Use flowcharts and/or pseudocode to address complex problems",
  "CSTA.2-AP-11: Create clearly named variables that represent different data types",
  "CSTA.2-AP-12: Design programs using control structures",
  "CSTA.3A-AP-13: Create prototypes that use algorithms",
  "CSTA.3A-AP-14: Use lists to simplify solutions",
  "CSTA.3A-AP-15: Justify the selection of specific control structures",

  // Common pedagogical standards
  "Problem-solving and critical thinking",
  "Collaboration and teamwork",
  "Communication and presentation",
  "Digital citizenship and ethics",
  "Computational thinking concepts",
  "Algorithmic reasoning",
  "Data analysis and interpretation",
  "Creative expression through technology",
];

export const subjectStandards: Record<string, string[]> = {
  "Computer Science": csStandards,
  "Mathematics": [
    "CCSS.MATH.K.CC.A.1: Count to 100",
    "CCSS.MATH.1.OA.A.1: Addition and subtraction",
    "CCSS.MATH.2.NBT.A.1: Place value",
    "CCSS.MATH.3.NF.A.1: Fractions",
    "CCSS.MATH.4.MD.A.1: Measurement",
    "CCSS.MATH.5.G.A.1: Coordinate plane",
    "CCSS.MATH.6.RP.A.1: Ratios and proportions",
    "CCSS.MATH.7.EE.A.1: Expressions and equations",
    "CCSS.MATH.8.F.A.1: Functions",
    "CCSS.MATH.HSA.SSE.A.1: Seeing structure in expressions",
    "CCSS.MATH.HSA.APR.A.1: Polynomial arithmetic",
    "CCSS.MATH.HSF.IF.A.1: Function interpretation",
    "CCSS.MATH.HSG.CO.A.1: Geometric construction",
    "CCSS.MATH.HSS.ID.A.1: Statistical interpretation",
  ],
  "Science": [
    "NGSS.K-PS2-1: Pushes and pulls",
    "NGSS.1-LS1-1: Plant and animal structures",
    "NGSS.2-PS1-1: Matter properties",
    "NGSS.3-LS2-1: Environmental interactions",
    "NGSS.4-PS3-1: Energy transfer",
    "NGSS.5-ESS1-1: Sun and Earth systems",
    "NGSS.MS-PS1-1: Atomic structure",
    "NGSS.MS-LS1-1: Cell structure and function",
    "NGSS.MS-ESS1-1: Earth's place in universe",
    "NGSS.HS-PS1-1: Periodic table",
    "NGSS.HS-LS1-1: Biomolecules",
    "NGSS.HS-ESS1-1: Universe formation",
  ],
  "English Language Arts": [
    "CCSS.ELA.K.RL.1: Key details",
    "CCSS.ELA.1.RI.1: Information texts",
    "CCSS.ELA.2.W.1: Opinion writing",
    "CCSS.ELA.3.SL.1: Collaborative discussions",
    "CCSS.ELA.4.L.1: Grammar conventions",
    "CCSS.ELA.5.RF.1: Phonics and recognition",
    "CCSS.ELA.6.RST.1: Technical texts",
    "CCSS.ELA.7.WHST.1: Arguments in science",
    "CCSS.ELA.8.RH.1: Historical texts",
    "CCSS.ELA.9-10.RL.1: Literature analysis",
    "CCSS.ELA.11-12.W.1: Argument writing",
  ],
  "Social Studies": [
    "NCSS.1: Culture and diversity",
    "NCSS.2: Time, continuity, and change",
    "NCSS.3: People, places, and environments",
    "NCSS.4: Individual development and identity",
    "NCSS.5: Individuals, groups, and institutions",
    "NCSS.6: Power, authority, and governance",
    "NCSS.7: Production, distribution, and consumption",
    "NCSS.8: Science, technology, and society",
    "NCSS.9: Global connections",
    "NCSS.10: Civic ideals and practices",
  ],
};

export const getStandardsForSubject = (subject: string): string[] => {
  return subjectStandards[subject] || csStandards; // Default to CS standards
};

export const getAllStandards = (): string[] => {
  const allStandards = new Set<string>();
  Object.values(subjectStandards).forEach(standards => {
    standards.forEach(standard => allStandards.add(standard));
  });
  return Array.from(allStandards).sort();
};