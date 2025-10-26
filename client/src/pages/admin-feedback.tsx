import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, Star, Mail, Calendar, User, Bug, 
  Lightbulb, ThumbsUp, Heart, CheckCircle, Clock, AlertTriangle
} from "lucide-react";

interface Feedback {
  id: number;
  userId: string;
  type: string;
  rating: number;
  title: string;
  description: string;
  email?: string;
  status: string;
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeedback() {
  const { toast } = useToast();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['/api/admin/feedback'],
    queryFn: () => apiRequest("GET", "/api/admin/feedback").then(res => res.json())
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: number; status: string; response?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/feedback/${id}`, { status, response });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      setSelectedFeedback(null);
      setResponse("");
      setNewStatus("");
      toast({
        title: "Feedback Updated",
        description: "Feedback status updated successfully. User will be notified by email if provided.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive"
      });
    }
  });

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
      case "bug": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "feature": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "improvement": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "compliment": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "reviewed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "reviewed": return AlertTriangle;
      case "resolved": return CheckCircle;
      default: return Clock;
    }
  };

  const getPriorityLevel = (feedback: Feedback): { level: string; color: string } => {
    if (feedback.type === 'bug') return { level: 'HIGH', color: 'text-red-600 font-bold' };
    if (feedback.rating <= 2) return { level: 'MEDIUM', color: 'text-orange-600 font-medium' };
    return { level: 'LOW', color: 'text-green-600' };
  };

  const handleUpdateFeedback = () => {
    if (!selectedFeedback || !newStatus) return;
    
    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      status: newStatus,
      response: response.trim() || undefined
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Feedback Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and respond to user feedback. Email notifications are sent automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feedback List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              All Feedback ({feedbacks.length})
            </h2>
            
            {feedbacks.map((feedback: Feedback) => {
              const IconComponent = getFeedbackIcon(feedback.type);
              const StatusIcon = getStatusIcon(feedback.status);
              const priority = getPriorityLevel(feedback);
              
              return (
                <Card 
                  key={feedback.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedFeedback?.id === feedback.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedFeedback(feedback);
                    setNewStatus(feedback.status);
                    setResponse(feedback.response || "");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-5 w-5 text-slate-600" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {feedback.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getFeedbackColor(feedback.type)} variant="secondary">
                          {feedback.type.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(feedback.status)} variant="secondary">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {feedback.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {feedback.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{feedback.userId}</span>
                        </div>
                        {feedback.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{feedback.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={priority.color}>
                          {priority.level}
                        </span>
                        {renderStars(feedback.rating)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {feedbacks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No feedback received yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feedback Details & Response */}
          <div className="space-y-4">
            {selectedFeedback ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Feedback Details</span>
                      <Badge className={getFeedbackColor(selectedFeedback.type)}>
                        {selectedFeedback.type.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                        {selectedFeedback.title}
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedFeedback.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Rating:</span>
                        <div className="mt-1">
                          {renderStars(selectedFeedback.rating)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Priority:</span>
                        <div className={`mt-1 ${getPriorityLevel(selectedFeedback).color}`}>
                          {getPriorityLevel(selectedFeedback).level}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">User Email:</span>
                        <div className="mt-1 text-slate-700 dark:text-slate-300">
                          {selectedFeedback.email || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Submitted:</span>
                        <div className="mt-1 text-slate-700 dark:text-slate-300">
                          {new Date(selectedFeedback.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {selectedFeedback.response && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Previous Response:</span>
                        <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-slate-700 dark:text-slate-300">
                          {selectedFeedback.response}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Update Status & Respond</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Status
                      </label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Response (optional)
                      </label>
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Add a response to be sent to the user..."
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleUpdateFeedback}
                      disabled={!newStatus || updateFeedbackMutation.isPending}
                      className="w-full"
                    >
                      {updateFeedbackMutation.isPending ? 'Updating...' : 'Update Feedback'}
                    </Button>

                    {selectedFeedback.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        User will be notified by email at {selectedFeedback.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Select feedback from the left to view details and respond
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}