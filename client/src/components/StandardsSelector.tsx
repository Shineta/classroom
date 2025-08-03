import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, X, Sparkles } from "lucide-react";

interface StandardsSelectorProps {
  value: string[];
  onChange: (standards: string[]) => void;
  subject?: string;
  gradeLevel?: string;
  lessonObjective?: string;
}

const COMMON_STANDARDS = {
  "Mathematics": [
    "CCSS.MATH.CONTENT.K.CC.A.1",
    "CCSS.MATH.CONTENT.1.OA.A.1",
    "CCSS.MATH.CONTENT.2.NBT.A.1",
    "CCSS.MATH.CONTENT.3.NF.A.1",
    "CCSS.MATH.CONTENT.4.OA.A.1",
    "CCSS.MATH.CONTENT.5.NBT.A.1",
  ],
  "English Language Arts": [
    "CCSS.ELA-LITERACY.RL.K.1",
    "CCSS.ELA-LITERACY.RL.1.1",
    "CCSS.ELA-LITERACY.W.2.1",
    "CCSS.ELA-LITERACY.SL.3.1",
    "CCSS.ELA-LITERACY.L.4.1",
    "CCSS.ELA-LITERACY.RST.5.1",
  ],
  "Science": [
    "NGSS.K-PS2-1",
    "NGSS.1-LS1-1",
    "NGSS.2-PS1-1",
    "NGSS.3-LS4-1",
    "NGSS.4-PS3-1",
    "NGSS.5-ESS1-1",
  ],
  "Computer Science": [
    "CSTA.K-2.1A-AP-08",
    "CSTA.3-5.1A-AP-09",
    "CSTA.6-8.1A-AP-10",
    "CSTA.9-12.1A-AP-11",
    "CSTA.K-2.1B-DA-06",
    "CSTA.3-5.1B-DA-07",
  ]
};

export default function StandardsSelector({ 
  value, 
  onChange, 
  subject, 
  gradeLevel, 
  lessonObjective 
}: StandardsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [customStandard, setCustomStandard] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Ensure value is always an array
  const standardsArray = Array.isArray(value) ? value : [];

  const subjectStandards = subject ? COMMON_STANDARDS[subject as keyof typeof COMMON_STANDARDS] || [] : [];
  
  const filteredStandards = subjectStandards.filter(standard =>
    standard.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addStandard = (standard: string) => {
    if (!standardsArray.includes(standard)) {
      onChange([...standardsArray, standard]);
    }
  };

  const removeStandard = (standardToRemove: string) => {
    onChange(standardsArray.filter(standard => standard !== standardToRemove));
  };

  const addCustomStandard = () => {
    if (customStandard.trim() && !standardsArray.includes(customStandard.trim())) {
      onChange([...standardsArray, customStandard.trim()]);
      setCustomStandard("");
    }
  };

  const getAiSuggestions = async () => {
    if (!lessonObjective || !subject) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/ai/suggest-standards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonObjective,
          subject,
          gradeLevel,
        }),
      });

      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (lessonObjective && subject) {
      getAiSuggestions();
    }
  }, [lessonObjective, subject, gradeLevel]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Standards Alignment</CardTitle>
        <CardDescription>
          Select educational standards that align with your lesson
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Standards */}
        {standardsArray.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Standards:</h4>
            <div className="flex flex-wrap gap-2">
              {standardsArray.map((standard) => (
                <Badge key={standard} variant="secondary" className="flex items-center gap-1">
                  {standard}
                  <button
                    onClick={() => removeStandard(standard)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search standards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {subject && filteredStandards.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredStandards.map((standard) => (
                  <div
                    key={standard}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addStandard(standard)}
                  >
                    <span className="text-sm">{standard}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={standardsArray.includes(standard)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                {subject ? (
                  searchTerm ? "No standards found matching your search" : "No standards available for this subject"
                ) : (
                  "Select a subject to browse available standards"
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">AI-Suggested Standards</span>
              {lessonObjective && subject && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getAiSuggestions}
                  disabled={loadingSuggestions}
                >
                  {loadingSuggestions ? "Loading..." : "Refresh"}
                </Button>
              )}
            </div>

            {!lessonObjective || !subject ? (
              <div className="text-center py-6 text-gray-500">
                Enter a lesson objective and select a subject to get AI suggestions
              </div>
            ) : loadingSuggestions ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Getting AI suggestions...</p>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-2">
                {aiSuggestions.map((standard) => (
                  <div
                    key={standard}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addStandard(standard)}
                  >
                    <span className="text-sm">{standard}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={standardsArray.includes(standard)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No AI suggestions available. Try refining your lesson objective.
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Add Custom Standard</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom standard (e.g., CCSS.MATH.CONTENT.4.OA.A.2)"
                  value={customStandard}
                  onChange={(e) => setCustomStandard(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCustomStandard();
                    }
                  }}
                />
                <Button
                  onClick={addCustomStandard}
                  disabled={!customStandard.trim() || standardsArray.includes(customStandard.trim())}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}