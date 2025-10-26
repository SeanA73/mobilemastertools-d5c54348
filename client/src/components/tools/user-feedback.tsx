import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  MessageSquare, Star, ThumbsUp, ThumbsDown, Send, 
  Bug, Lightbulb, Heart, AlertTriangle 
} from "lucide-react";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "compliment", "other"]),
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Please provide at least 10 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface Feedback {
  id: number;
  type: string;
  rating: number;
  title: string;
  description: string;
  email?: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
}

export default function UserFeedbackTool() {
  const [activeTab, setActiveTab] = useState<"submit" | "view">("submit");
  const { toast } = useToast();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "improvement",
      rating: 5,
      title: "",
      description: "",
      email: "",
    },
  });

  const { data: feedbacks = [], isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FeedbackFormData) => apiRequest("POST", "/api/feedback", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      form.reset();
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    createMutation.mutate(data);
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "bug": return Bug;
      case "feature": return Lightbulb;
      case "improvement": return ThumbsUp;
      case "compliment": return Heart;
      default: return MessageSquare;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case "bug": return "bg-red-100 text-red-800";
      case "feature": return "bg-blue-100 text-blue-800";
      case "improvement": return "bg-yellow-100 text-yellow-800";
      case "compliment": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-800";
      case "reviewed": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-slate-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Feedback</h2>
          <p className="text-slate-600">Help us improve the app with your feedback</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <Button
          variant={activeTab === "submit" ? "default" : "ghost"}
          onClick={() => setActiveTab("submit")}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Feedback
        </Button>
        <Button
          variant={activeTab === "view" ? "default" : "ghost"}
          onClick={() => setActiveTab("view")}
          className="flex-1"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          View Feedback ({feedbacks.length})
        </Button>
      </div>

      {activeTab === "submit" && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Feedback Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select feedback type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bug">🐛 Bug Report</SelectItem>
                            <SelectItem value="feature">💡 Feature Request</SelectItem>
                            <SelectItem value="improvement">👍 Improvement</SelectItem>
                            <SelectItem value="compliment">💚 Compliment</SelectItem>
                            <SelectItem value="other">📝 Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Rating */}
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Rating</FormLabel>
                        <FormControl>
                          <div className="pt-2">
                            {renderStars(field.value, true, field.onChange)}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your feedback..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide detailed feedback..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {activeTab === "view" && (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-500">No feedback submitted yet</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => {
              const IconComponent = getFeedbackIcon(feedback.type);
              
              return (
                <Card key={feedback.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <IconComponent className="w-5 h-5 mt-1 text-slate-500" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 mb-1">
                            {feedback.title}
                          </h3>
                          <p className="text-slate-600 mb-3">
                            {feedback.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <span>
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                            {feedback.email && (
                              <span>By: {feedback.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={getFeedbackColor(feedback.type)}>
                          {feedback.type}
                        </Badge>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status}
                        </Badge>
                        {renderStars(feedback.rating)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Feedback Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">What to Include:</h4>
              <ul className="space-y-1">
                <li>• Specific details about the issue or suggestion</li>
                <li>• Steps to reproduce (for bugs)</li>
                <li>• Your device and browser information</li>
                <li>• Screenshots if applicable</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Response Time:</h4>
              <ul className="space-y-1">
                <li>• Bug reports: 1-2 business days</li>
                <li>• Feature requests: 1-2 weeks</li>
                <li>• General feedback: 3-5 business days</li>
                <li>• We'll email you updates if provided</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}