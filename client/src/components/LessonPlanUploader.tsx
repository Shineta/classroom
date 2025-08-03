import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonPlanUploaderProps {
  onDataExtracted: (data: {
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
  }) => void;
}

export default function LessonPlanUploader({ onDataExtracted }: LessonPlanUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, Word document, or text file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/lesson-plans/extract-from-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process file' }));
        throw new Error(errorData.message || 'Failed to process file');
      }

      const extractedData = await response.json();
      
      toast({
        title: "File processed successfully",
        description: "Lesson plan data has been extracted and populated in the form.",
      });

      onDataExtracted(extractedData);
    } catch (error) {
      console.error('Error processing file:', error);
      
      let errorMessage = "There was an error extracting data from your file. Please try again or fill in the form manually.";
      
      if (error instanceof Error) {
        if (error.message.includes("PDF")) {
          errorMessage = "Unable to extract text from this PDF. The file may be image-based or encrypted. Try converting to Word format or use a text-based PDF.";
        } else if (error.message.includes("Word") || error.message.includes("document")) {
          errorMessage = "Unable to process this Word document. Please ensure the file is not corrupted and try again.";
        } else if (error.message.includes("Unauthorized")) {
          errorMessage = "Please log in again and try uploading your file.";
        } else if (error.message !== "Failed to process file") {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error processing file",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Lesson Plan
        </CardTitle>
        <CardDescription>
          Upload an existing lesson plan document to auto-populate the form fields
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="lesson-plan-upload"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="lesson-plan-upload"
            className={`cursor-pointer flex flex-col items-center gap-2 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="text-sm text-gray-600">Processing file...</span>
              </>
            ) : uploadedFile ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {uploadedFile.name} uploaded successfully
                </span>
                <span className="text-xs text-gray-500">
                  Click to upload a different file
                </span>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Click to upload a lesson plan
                </span>
                <span className="text-xs text-gray-500">
                  Supports PDF, Word documents, and text files
                </span>
              </>
            )}
          </label>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The AI will attempt to extract information like subject, grade level, objectives, 
            activities, and materials from your document. You can review and edit the extracted 
            data before saving.
          </AlertDescription>
        </Alert>

        {uploadedFile && !uploading && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {uploadedFile.name}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadedFile(null);
                const input = document.getElementById('lesson-plan-upload') as HTMLInputElement;
                if (input) input.value = '';
              }}
            >
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}