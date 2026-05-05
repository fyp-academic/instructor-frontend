import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { JitsiRoom } from '../components/conference';
import { sessionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/use-toast';

export default function Conference() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{
    id: string;
    title: string;
    room_name: string;
    course_name: string;
    jwt: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const [sessionRes, tokenRes] = await Promise.all([
          sessionsApi.get(sessionId),
          sessionsApi.getToken(sessionId),
        ]);

        const s = sessionRes.data.data || sessionRes.data;
        setSession({
          id: s.id,
          title: s.title,
          room_name: s.room_id || s.room_name || s.roomName,
          course_name: s.course?.title || s.course?.name || s.course_name || s.courseName,
          jwt: tokenRes.data.token,
        });
      } catch (err) {
        toast({
          title: 'Failed to load session',
          variant: 'destructive',
        });
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, navigate, toast]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="h-screen w-screen">
      <JitsiRoom
        sessionId={session.id}
        roomName={session.room_name}
        jwt={session.jwt}
        role={user.role === 'instructor' || user.role === 'admin' ? 'instructor' : 'student'}
        userInfo={{
          displayName: user.name,
          email: user.email,
          avatar: user.profile_image_url || user.instructor_profile?.profile_photo,
        }}
        onClose={() => navigate('/sessions')}
        courseName={session.course_name}
        sessionTitle={session.title}
      />
    </div>
  );
}
