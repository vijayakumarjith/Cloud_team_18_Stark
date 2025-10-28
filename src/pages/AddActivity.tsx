import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Calculator } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const AddActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createNotification } = useRealtimeNotifications();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'workshop',
    provider: '',
    startDate: '',
    endDate: '',
    hours: '',
    role: 'participant',
    mode: 'online',
    description: ''
  });

  const calculateScore = () => {
    const baseScores: { [key: string]: number } = {
      workshop: 5,
      fdp: 10,
      mooc: 8,
      conference: 15,
      publication: 20,
      patent: 25
    };

    const roleMultipliers: { [key: string]: number } = {
      participant: 1,
      speaker: 1.5,
      organizer: 2,
      author: 1.8
    };

    let score = baseScores[formData.type] || 5;
    score *= roleMultipliers[formData.role] || 1;
    
    const hours = parseInt(formData.hours) || 0;
    score += Math.floor(hours / 8);

    return Math.round(score);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create activity first to get the ID
      const activityDocRef = await addDoc(collection(db, 'activities'), {
        ...formData,
        score: calculateScore(),
        status: 'pending',
        evidenceUrls: [],
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      
      const activityId = activityDocRef.id;

      let evidenceUrls: string[] = [];
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileRef = storageRef(storage, `evidence/${user.uid}/${activityId}/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          evidenceUrls.push(url);
        }
        
        // Update activity with evidence URLs
        await updateDoc(doc(db, 'activities', activityId), {
          evidenceUrls
        });
      }

      // Create realtime notification
      await createNotification(
        user.uid,
        "Activity Submitted",
        `Your ${formData.type} "${formData.title}" has been submitted for review.`,
        "success"
      );

      toast({
        title: 'Activity submitted!',
        description: 'Your activity is pending review by HOD'
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit activity',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const predictedScore = calculateScore();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Add New Activity</h1>
          <p className="text-muted-foreground">Submit your faculty development activity for review</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Activity Details</CardTitle>
                <CardDescription>Fill in the information about your activity</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Activity Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., AI and Machine Learning Workshop"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Activity Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="fdp">FDP</SelectItem>
                          <SelectItem value="mooc">MOOC</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="publication">Publication</SelectItem>
                          <SelectItem value="patent">Patent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider/Organizer *</Label>
                      <Input
                        id="provider"
                        placeholder="e.g., NPTEL, IEEE"
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hours">Total Hours *</Label>
                      <Input
                        id="hours"
                        type="number"
                        placeholder="8"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="participant">Participant</SelectItem>
                          <SelectItem value="speaker">Speaker/Presenter</SelectItem>
                          <SelectItem value="organizer">Organizer</SelectItem>
                          <SelectItem value="author">Author</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mode">Mode *</Label>
                      <Select value={formData.mode} onValueChange={(value) => setFormData({ ...formData, mode: value })}>
                        <SelectTrigger id="mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the activity and key learnings..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evidence">Evidence/Certificates *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload supporting documents: certificates, participation proof, event posters, etc. (Multiple files allowed)
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        id="evidence"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFiles(e.target.files)}
                        className="hidden"
                      />
                      <label htmlFor="evidence" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {files && files.length > 0
                            ? `${files.length} file(s) selected`
                            : 'Click to upload multiple files (certificates, posters, proof documents)'}
                        </p>
                        {files && files.length > 0 && (
                          <div className="mt-2 text-xs">
                            {Array.from(files).map((file, i) => (
                              <div key={i} className="text-left">{file.name}</div>
                            ))}
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Activity'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-accent/10 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Score Preview
                </CardTitle>
                <CardDescription>Estimated points for this activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                    {predictedScore}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">Points</p>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base score:</span>
                      <span className="font-medium">
                        {formData.type === 'workshop' ? 5 :
                         formData.type === 'fdp' ? 10 :
                         formData.type === 'mooc' ? 8 :
                         formData.type === 'conference' ? 15 :
                         formData.type === 'publication' ? 20 :
                         formData.type === 'patent' ? 25 : 5} pts
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role multiplier:</span>
                      <span className="font-medium">×
                        {formData.role === 'participant' ? 1 :
                         formData.role === 'speaker' ? 1.5 :
                         formData.role === 'organizer' ? 2 :
                         formData.role === 'author' ? 1.8 : 1}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration bonus:</span>
                      <span className="font-medium">
                        +{Math.floor((parseInt(formData.hours) || 0) / 8)} pts
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Final score will be confirmed upon HOD approval
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddActivity;
