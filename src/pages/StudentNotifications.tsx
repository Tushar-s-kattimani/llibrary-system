import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Layout } from '../components/Layout';
import { Bell, BookOpen, Clock } from 'lucide-react';

export const StudentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, 'notifications'), 
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const notifs: any[] = [];
        querySnapshot.forEach((doc) => {
          notifs.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(notifs);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Library Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated with new book arrivals and library news.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.id} className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:scale-110 transition-transform">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground text-lg">{notif.title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-bold">
                      <Clock className="w-3 h-3" />
                      {notif.createdAt?.toDate().toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {notif.message}
                  </p>
                  
                  {notif.type === 'new_book' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border text-xs font-medium text-foreground">
                      <BookOpen className="w-4 h-4 text-primary" />
                      View Details
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-muted-foreground bg-card rounded-3xl border border-dashed border-border flex flex-col items-center">
            <Bell className="w-16 h-16 opacity-10 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No notifications yet</h3>
            <p>We'll notify you when new books are added!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
