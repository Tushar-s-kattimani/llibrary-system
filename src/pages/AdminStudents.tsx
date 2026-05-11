import React, { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Layout } from '../components/Layout';
import { Users, Search, Mail, Phone, Hash, Calendar } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSem, setSelectedSem] = useState('All');

  const semesters = ['All', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'students'));
        const querySnapshot = await getDocs(q);
        
        const studentData: any[] = [];
        querySnapshot.forEach((doc) => {
          studentData.push({ id: doc.id, ...doc.data() });
        });

        studentData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });
        
        setStudents(studentData);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSem = selectedSem === 'All' || 
                       student.semester === selectedSem || 
                       (selectedSem !== 'All' && student.semester?.startsWith(selectedSem.charAt(0)));
    
    return matchesSearch && matchesSem;
  });

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registered Students</h1>
          <p className="text-muted-foreground mt-1">Manage and view all students registered in the system.</p>
        </div>
        
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
          <Users className="w-5 h-5" />
          <span>Total Students: {students.length}</span>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/30 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Semester:</span>
            <select 
              value={selectedSem} 
              onChange={(e) => setSelectedSem(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Student Profile</th>
                  <th className="px-6 py-4 font-medium">Contact Details</th>
                  <th className="px-6 py-4 font-medium">Additional Info</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Hash className="w-3 h-3" />
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{student.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{student.semester || 'Sem N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                          <span>{student.age ? `${student.age} yrs` : 'Age N/A'} • {student.address || 'No Address'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.createdAt ? new Date(student.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No Students Found</h3>
            <p>We couldn't find any students matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
