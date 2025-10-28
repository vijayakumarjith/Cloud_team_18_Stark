import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  maxParticipants: number;
  registeredCount: number;
  organizer: string;
  status: string;
}

const Events = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch events
      const eventsQuery = query(
        collection(db, 'events'),
        where('status', '==', 'active')
      );
      
      const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
        const eventsArray = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        
        eventsArray.sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        
        setEvents(eventsArray);
      });

      // Fetch user's registrations
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', user.uid)
      );
      
      getDocs(registrationsQuery).then((snapshot) => {
        const regIds = snapshot.docs.map(doc => doc.data().eventId);
        setRegistrations(regIds);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        userId: user.uid,
        registeredAt: new Date().toISOString(),
        status: 'registered'
      });

      setRegistrations([...registrations, eventId]);

      toast({
        title: "Registration Successful",
        description: "You have been registered for the event.",
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Failed to register. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Browse and register for upcoming faculty development events</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No active events at the moment.</p>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col border-border/50 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {event.type}
                      </Badge>
                      {registrations.includes(event.id) && (
                        <Badge className="bg-success/10 text-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Registered
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 mb-4 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        {event.endDate && (
                          <>
                            <span>-</span>
                            <span>{new Date(event.endDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.registeredCount || 0} / {event.maxParticipants} participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>By {event.organizer}</span>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full gradient-primary"
                      onClick={() => handleRegister(event.id)}
                      disabled={registrations.includes(event.id) || (event.registeredCount >= event.maxParticipants)}
                    >
                      {registrations.includes(event.id) ? 'Already Registered' : 
                       event.registeredCount >= event.maxParticipants ? 'Event Full' : 'Register Now'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
