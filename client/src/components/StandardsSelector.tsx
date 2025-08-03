import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Sparkles, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Standards data organized by subject
const standardsBySubject = {
  "Computer Science": [
    "CSP.AAP-1: Represent a value with a variable",
    "CSP.AAP-2: Determine the value of a variable as a result of an assignment",
    "CSP.AAP-3: Represent a list or string using a variable",
    "CSP.ALG-1: Express an algorithm that uses sequencing without using a programming language",
    "CSP.ALG-2: Express an algorithm that uses selection without using a programming language",
    "CSP.CRD-1: Incorporate existing code, media, and libraries into original programs",
    "CSP.DAT-1: Represent information using bits",
    "CSP.DAT-2: Use appropriate and efficient data representation",
    "CSP.IOC-1: Explain how an everyday life connects to the internet",
    "CSP.IOC-2: Describe the risks to privacy from collecting and storing personal data",
    "CSTA.1A-AP-08: Model daily processes by creating and following algorithms",
    "CSTA.1A-AP-09: Model the way programs store data",
    "CSTA.1A-AP-10: Develop programs with sequences and simple loops",
    "CSTA.2-AP-10: Use flowcharts and/or pseudocode to address complex problems",
    "CSTA.2-AP-11: Create clearly named variables that represent different data types",
    "CSTA.3A-AP-13: Create prototypes that use algorithms",
  ],
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
  ],
  "Science": [
    "NGSS.K-PS2-1: Pushes and pulls",
    "NGSS.1-LS1-1: Plant and animal structures",
    "NGSS.2-PS1-1: Matter properties",
    "NGSS.3-LS2-1: Environmental interactions",
    "NGSS.4-PS3-1: Energy transfer",
    "NGSS.5-ESS1-1: Sun and Earth systems",
    "NGSS.MS-PS1-1: Atomic structure",
    "NGSS.HS-PS1-1: Periodic table",
  ],
  "English Language Arts": [
    "CCSS.ELA.K.RL.1: Key details",
    "CCSS.ELA.1.RI.1: Information texts",
    "CCSS.ELA.2.W.1: Opinion writing",
    "CCSS.ELA.3.SL.1: Collaborative discussions",
    "CCSS.ELA.4.L.1: Grammar conventions",
    "CCSS.ELA.5.RF.1: Phonics and recognition",
    "CCSS.ELA.6.RST.1: Technical texts",
  ],
  "Social Studies": [
    "NCSS.1: Culture and diversity",
    "NCSS.2: Time, continuity, and change",
    "NCSS.3: People, places, and environments",
    "NCSS.4: Individual development and identity",
    "NCSS.5: Individuals, groups, and institutions",
    "NCSS.6: Power, authority, and governance",
  ],
};

interface StandardsSelectorProps {
  selectedStandards: string[];
  onStandardsChange: (standards: string[]) => void;
  subject: string;
  lessonObjective?: string;
}

export default function StandardsSelector({ 
  selectedStandards, 
  onStandardsChange, 
  subject,
  lessonObjective 
}: StandardsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [customStandard, setCustomStandard] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const { toast } = useToast();

  // Get relevant standards for the subject
  const availableStandards = standardsBySubject[subject as keyof typeof standardsBySubject] || 
                            standardsBySubject["Computer Science"]; // Default to CS standards

  // Filter standards based on search
  const filteredStandards = availableStandards.filter(standard =>
    standard.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // AI Standards suggestion mutation
  const suggestStandardsMutation = useMutation({
    mutationFn: async ({ lessonObjective, subject }: { lessonObjective: string; subject: string }) => {
      const res = await apiRequest("POST", "/api/ai/suggest-standards", { lessonObjective, subject });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.suggestedStandards?.length > 0) {
        const combinedStandards = [...selectedStandards, ...data.suggestedStandards];
        const newStandards = Array.from(new Set(combinedStandards));
        onStandardsChange(newStandards);
        toast({
          title: "AI Standards Suggested",
          description: `Added ${data.suggestedStandards.length} relevant standards based on lesson objective`,
        });
      } else {
        toast({
          title: "No Standards Suggested",
          description: "AI could not identify specific standards for this lesson objective",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "AI Suggestion Failed",
        description: "Unable to suggest standards at this time",
        variant: "destructive",
      });
    },
  });

  const toggleStandard = (standard: string) => {
    if (selectedStandards.includes(standard)) {
      onStandardsChange(selectedStandards.filter(s => s !== standard));
    } else {
      onStandardsChange([...selectedStandards, standard]);
    }
  };

  const addCustomStandard = () => {
    if (customStandard.trim() && !selectedStandards.includes(customStandard.trim())) {
      onStandardsChange([...selectedStandards, customStandard.trim()]);
      setCustomStandard("");
      toast({
        title: "Custom Standard Added",
        description: "Successfully added custom standard",
      });
    }
  };

  const handleAISuggest = () => {
    if (lessonObjective?.trim()) {
      suggestStandardsMutation.mutate({ lessonObjective: lessonObjective.trim(), subject });
    } else {
      toast({
        title: "Lesson Objective Required",
        description: "Please enter a lesson objective first to get AI suggestions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Standards Addressed</Label>
        <div className="flex items-center gap-2">
          {lessonObjective && (
            <Button 
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAISuggest}
              disabled={suggestStandardsMutation.isPending}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {suggestStandardsMutation.isPending ? "Suggesting..." : "AI Suggest"}
            </Button>
          )}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Add Standards
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Select Standards for {subject}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="browse">Browse Standards</TabsTrigger>
                  <TabsTrigger value="custom">Add Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search standards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredStandards.map((standard) => (
                      <Card 
                        key={standard}
                        className={`cursor-pointer transition-colors ${
                          selectedStandards.includes(standard) 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleStandard(standard)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">{standard}</p>
                            {selectedStandards.includes(standard) && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Custom Standard</Label>
                    <Input
                      placeholder="Enter a custom standard or learning objective..."
                      value={customStandard}
                      onChange={(e) => setCustomStandard(e.target.value)}
                    />
                    <Button onClick={addCustomStandard} disabled={!customStandard.trim()}>
                      Add Custom Standard
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button onClick={() => setShowDialog(false)}>
                  Done ({selectedStandards.length} selected)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selected Standards Display */}
      <div className="min-h-[60px] p-3 border rounded-md bg-gray-50">
        {selectedStandards.length === 0 ? (
          <p className="text-gray-500 text-sm">No standards selected. Click "Add Standards" to choose relevant curriculum standards.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedStandards.map((standard) => (
              <Badge key={standard} variant="default" className="text-xs">
                {standard.length > 60 ? `${standard.substring(0, 60)}...` : standard}
                <button
                  type="button"
                  onClick={() => toggleStandard(standard)}
                  className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}