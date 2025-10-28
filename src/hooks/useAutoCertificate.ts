import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { generateCertificate } from '@/utils/certificateGenerator';
import { toast } from '@/hooks/use-toast';

export const useAutoCertificate = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', user.uid),
      where('status', '==', 'approved')
    );
    
    const unsubscribe = onSnapshot(activitiesQuery, async (snapshot) => {
      // Get user details
      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.data();

      for (const activityDoc of snapshot.docs) {
        const activity = activityDoc.data();
        const activityId = activityDoc.id;
        
        // Generate certificate only for approved activities that don't have one
        if (!activity.certificateUrl) {
          try {
            const certificateData = {
              facultyName: userData?.name || 'Faculty Member',
              activityTitle: activity.title,
              activityType: activity.type,
              duration: `${activity.hours || 0} hours`,
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              score: activity.score || 0,
              certificateId: `CERT-${activityId.substring(0, 8).toUpperCase()}`
            };

            // Generate certificate PDF
            const certificateBlob = await generateCertificate(certificateData);

            // Upload to Firebase Storage
            const fileName = `certificates/${user.uid}/${activityId}.pdf`;
            const certStorageRef = storageRef(storage, fileName);
            await uploadBytes(certStorageRef, certificateBlob);
            const downloadUrl = await getDownloadURL(certStorageRef);

            // Update activity with certificate URL
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
              certificateUrl: downloadUrl,
              certificateGeneratedAt: new Date().toISOString()
            });

            toast({
              title: "🎉 Certificate Generated!",
              description: `Certificate for "${activity.title}" is ready to download.`,
              duration: 5000,
            });
          } catch (error) {
            console.error('Error generating certificate:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);
};
