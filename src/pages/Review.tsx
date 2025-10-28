import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface Activity {
  id: string;
  userId: string;
  title: string;
  type: string;
  provider: string;
  hours: number;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
  score: number;
  evidenceUrls: string[];
  createdAt: string;
}

const Review = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [comment, setComment] = useState('');
  const { createNotification } = useRealtimeNotifications();

  useEffect(() => {
    if (!loading && (!user || (userRole !== 'hod' && userRole !== 'iqac'))) {
      navigate('/dashboard');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === 'hod' || userRole === 'iqac')) {
      const activitiesRef = collection(db, 'activities');
      const unsubscribe = onSnapshot(activitiesRef, (snapshot) => {
        const allActivities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        
        // Sort by creation date (newest first)
        allActivities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setActivities(allActivities);
      });

      return () => unsubscribe();
    }
  }, [user, userRole]);

  const handleApprove = async (activity: Activity) => {
    try {
      const activityRef = doc(db, 'activities', activity.id);
      await updateDoc(activityRef, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid,
        reviewComment: comment || 'Approved'
      });

      // Send notification to faculty
      await createNotification(
        activity.userId,
        '✅ Activity Approved',
        `Your activity "${activity.title}" has been approved! Certificate will be generated automatically.`,
        'success'
      );

      toast({
        title: "Activity Approved",
        description: "Certificate will be generated automatically.",
      });

      setSelectedActivity(null);
      setComment('');
    } catch (error) {
      console.error('Error approving activity:', error);
      toast({
        title: "Error",
        description: "Failed to approve activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (activity: Activity) => {
    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const activityRef = doc(db, 'activities', activity.id);
      await updateDoc(activityRef, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid,
        reviewComment: comment
      });

      // Send notification to faculty
      await createNotification(
        activity.userId,
        '❌ Activity Rejected',
        `Your activity "${activity.title}" was rejected. Reason: ${comment}`,
        'error'
      );

      toast({
        title: "Activity Rejected",
        description: "Faculty has been notified.",
      });

      setSelectedActivity(null);
      setComment('');
    } catch (error) {
      console.error('Error rejecting activity:', error);
      toast({
        title: "Error",
        description: "Failed to reject activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const pendingActivities = activities.filter(a => a.status === 'pending');
  const reviewedActivities = activities.filter(a => a.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Review Activities</h1>
          <p className="text-muted-foreground">Approve or reject faculty development activities</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activities List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Activities */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Pending Review ({pendingActivities.length})</CardTitle>
                <CardDescription>Activities awaiting your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingActivities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No pending activities to review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingActivities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedActivity?.id === activity.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.hours} hours • {activity.role}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            {activity.score} pts
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviewed Activities */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Recently Reviewed</CardTitle>
                <CardDescription>Activities you've already processed</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewedActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviewed activities yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewedActivities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'approved'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 sticky top-6">
              <CardHeader>
                <CardTitle>Activity Details</CardTitle>
                <CardDescription>
                  {selectedActivity ? 'Review and take action' : 'Select an activity to review'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedActivity ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{selectedActivity.title}</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{selectedActivity.type}</span></p>
                        <p><span className="text-muted-foreground">Provider:</span> {selectedActivity.provider}</p>
                        <p><span className="text-muted-foreground">Duration:</span> {selectedActivity.hours} hours</p>
                        <p><span className="text-muted-foreground">Role:</span> {selectedActivity.role}</p>
                        <p><span className="text-muted-foreground">Date:</span> {new Date(selectedActivity.startDate).toLocaleDateString()} - {new Date(selectedActivity.endDate).toLocaleDateString()}</p>
                        <p><span className="text-muted-foreground">Score:</span> <span className="font-bold text-primary">{selectedActivity.score} points</span></p>
                      </div>
                    </div>

                    {selectedActivity.description && (
                      <div>
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
                      </div>
                    )}

                    {selectedActivity.evidenceUrls && selectedActivity.evidenceUrls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Evidence Files</p>
                        <div className="space-y-2">
                          {selectedActivity.evidenceUrls.map((url, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start gap-2"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <FileText className="w-4 h-4" />
                              View Evidence {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-2 block">Review Comment</label>
                      <Textarea
                        placeholder="Add your comments here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(selectedActivity)}
                        className="flex-1 bg-success hover:bg-success/90 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedActivity)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select an activity from the list to review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
