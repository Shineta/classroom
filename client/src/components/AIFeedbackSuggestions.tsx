import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIFeedbackSuggestionsProps {
  observationData: {
    subject: string;
    gradeLevel: string;
    lessonObjective: string;
    engagementLevel: string;
    climate: string;
    evidenceOfLearning: string;
    effectivenessRatings: any;
  };
  onApplyFeedback: (feedback: {
    strengths: string;
    areasForGrowth: string;
    additionalComments: string;
  }) => void;
}

export default function AIFeedbackSuggestions({ 
  observationData, 
  onApplyFeedback 
}: AIFeedbackSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const generateFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ai/generate-feedback", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSuggestions(data);
      toast({
        title: "AI Feedback Generated",
        description: "Review and apply the suggested feedback as needed",
      });
    },
    onError: () => {
      toast({
        title: "AI Generation Failed",
        description: "Unable to generate feedback suggestions at this time",
        variant: "destructive",
      });
    },
  });

  const handleGenerateFeedback = () => {
    if (!observationData.lessonObjective?.trim()) {
      toast({
        title: "Lesson Objective Required",
        description: "Please enter a lesson objective before generating AI feedback",
        variant: "destructive",
      });
      return;
    }

    generateFeedbackMutation.mutate(observationData);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied to Clipboard",
        description: `${field} copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const applyAllSuggestions = () => {
    if (suggestions) {
      onApplyFeedback({
        strengths: suggestions.strengths,
        areasForGrowth: suggestions.areasForGrowth,
        additionalComments: suggestions.additionalComments,
      });
      toast({
        title: "Feedback Applied",
        description: "AI suggestions have been applied to the feedback fields",
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Sparkles className="w-5 h-5" />
          AI Feedback Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Generate AI-powered feedback suggestions based on your observation data
            </p>
            <Button 
              onClick={handleGenerateFeedback}
              disabled={generateFeedbackMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Feedback
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confidence Score */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={suggestions.confidence > 0.7 ? "default" : "secondary"}
                className="mb-2"
              >
                Confidence: {Math.round(suggestions.confidence * 100)}%
              </Badge>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={applyAllSuggestions}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Apply All Suggestions
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleGenerateFeedback}
                  disabled={generateFeedbackMutation.isPending}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Strengths Suggestion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-800">Suggested Strengths</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.strengths, "Strengths")}
                >
                  {copiedField === "Strengths" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <Textarea
                value={suggestions.strengths}
                readOnly
                className="bg-white border-blue-200 text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Areas for Growth Suggestion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-800">Suggested Areas for Growth</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.areasForGrowth, "Areas for Growth")}
                >
                  {copiedField === "Areas for Growth" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <Textarea
                value={suggestions.areasForGrowth}
                readOnly
                className="bg-white border-blue-200 text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Additional Comments Suggestion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-800">Suggested Additional Comments</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestions.additionalComments, "Additional Comments")}
                >
                  {copiedField === "Additional Comments" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <Textarea
                value={suggestions.additionalComments}
                readOnly
                className="bg-white border-blue-200 text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="text-xs text-gray-500 bg-white p-2 rounded border border-blue-200">
              <strong>Note:</strong> These are AI-generated suggestions based on your observation data. 
              Please review and modify as appropriate for your specific context and professional judgment.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}