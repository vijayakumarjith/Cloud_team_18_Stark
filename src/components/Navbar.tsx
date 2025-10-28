import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, LogOut, User, Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications();
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string>('');

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (user) {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          setProfilePhoto(profileDoc.data().photoUrl || '');
        }
      }
    };
    loadProfilePhoto();
  }, [user]);

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow transition-transform group-hover:scale-110">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                FDP Portal
              </h1>
              <p className="text-xs text-muted-foreground">Faculty Development</p>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                {(userRole === 'hod' || userRole === 'iqac') && (
                  <Link to="/review">
                    <Button variant="ghost" size="sm">Review Queue</Button>
                  </Link>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] gradient-primary text-primary-foreground border-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="flex flex-col items-start p-3 cursor-pointer focus:bg-muted"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-center gap-2 w-full mb-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                          <span className="font-medium text-sm">{notif.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-4 line-clamp-2">{notif.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={profilePhoto} alt="Profile" />
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
