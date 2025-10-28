import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Plus, Award, Clock, CheckCircle, TrendingUp, Download, FileCheck, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAutoCertificate } from '@/hooks/useAutoCertificate';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
  score: number;
  createdAt: string;
  certificateUrl?: string;
  certificateGeneratedAt?: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, score: 0 });
  const [registeredEventsCount, setRegisteredEventsCount] = useState(0);
  
  // Auto-generate certificates for approved activities
  useAutoCertificate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        
        // Sort by creation date (newest first)
        activitiesArray.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setActivities(activitiesArray);
        
        const pending = activitiesArray.filter(a => a.status === 'pending').length;
        const approved = activitiesArray.filter(a => a.status === 'approved').length;
        const totalScore = activitiesArray
          .filter(a => a.status === 'approved')
          .reduce((sum, a) => sum + (a.score || 0), 0);
        
        setStats({
          total: activitiesArray.length,
          pending,
          approved,
          score: totalScore
        });
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', user.uid)
      );
      
      getDocs(registrationsQuery).then((snapshot) => {
        setRegisteredEventsCount(snapshot.size);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const targetScore = 100;
  const progressPercentage = Math.min((stats.score / targetScore) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Track your faculty development progress</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                <Award className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.score}</div>
                <p className="text-xs text-muted-foreground mt-1">Target: {targetScore} points</p>
                <Progress value={progressPercentage} className="mt-3" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50 bg-gradient-to-br from-success/10 to-success/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.approved}</div>
                <p className="text-xs text-muted-foreground mt-1">Activities approved</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50 bg-gradient-to-br from-warning/10 to-warning/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="w-4 h-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border/50 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <TrendingUp className="w-4 h-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Add a new activity or view your progress</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => navigate('/add-activity')} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
              <Button variant="outline" onClick={() => navigate('/reports')}>View Reports</Button>
              <Button variant="outline" onClick={() => navigate('/events')}>
                <Calendar className="w-4 h-4 mr-2" />
                Events ({registeredEventsCount} registered)
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No activities yet. Start by adding your first activity!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-all hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.certificateUrl && (
                            <FileCheck className="w-4 h-4 text-success animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                        {activity.certificateGeneratedAt && (
                          <p className="text-xs text-success mt-1">
                            Certificate generated {new Date(activity.certificateGeneratedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'approved' ? 'bg-success/10 text-success' :
                          activity.status === 'pending' ? 'bg-warning/10 text-warning' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {activity.status}
                        </span>
                        {activity.status === 'approved' && (
                          <span className="font-bold text-primary">{activity.score} pts</span>
                        )}
                        {activity.certificateUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(activity.certificateUrl, '_blank');
                              toast({
                                title: "Opening Certificate",
                                description: "Your certificate is opening in a new tab.",
                              });
                            }}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
