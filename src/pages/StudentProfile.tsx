import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Hash, ShieldCheck, Save } from 'lucide-react';
import { Layout } from '../components/Layout';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export const StudentProfile: React.FC = () => {
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [semester, setSemester] = useState(userData?.semester || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateSemester = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        semester: semester
      });
      toast.success("Semester updated successfully!");
      setIsEditing(false);
      // Note: AuthContext will pick up the change on next reload or we can rely on local state
    } catch (error: any) {
      toast.error("Failed to update semester: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-background shadow-lg">
              <span className="text-5xl font-bold text-primary">
                {userData?.name?.charAt(0) || 'S'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{userData?.name || 'Student Name'}</h2>
            <p className="text-muted-foreground mb-4">{userData?.email}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Verified Account
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              {!isEditing ? (
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setSemester(userData?.semester || '');
                  }}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Edit Semester
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(false)} className="text-muted-foreground text-sm font-bold">Cancel</button>
                  <button 
                    onClick={handleUpdateSemester} 
                    disabled={loading}
                    className="text-primary text-sm font-bold flex items-center gap-1"
                  >
                    {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground font-medium mb-2 block">Full Name</label>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border opacity-70">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{userData?.name}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-medium mb-2 block">Student ID</label>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border opacity-70">
                    <Hash className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{userData?.studentId}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-medium mb-2 block">Current Semester</label>
                  {isEditing ? (
                    <select 
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full p-3 bg-background border border-primary rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                        const suffix = sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th';
                        const val = `${sem}${suffix} Sem`;
                        return (
                          <option key={sem} value={val}>
                            {sem}{suffix} Semester
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{userData?.semester || 'Not Specified'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-medium mb-2 block">Email Address</label>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border opacity-70">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{userData?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
