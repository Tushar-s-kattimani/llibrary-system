import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Layout } from '../components/Layout';
import { BookMarked, Check, X, Clock, BookOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState('All');

  const semesters = ['All', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];

  const fetchRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'borrowRecords'));
      const requestsData: any[] = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() });
      });
      
      requestsData.sort((a, b) => {
        if (!a.requestDate || !b.requestDate) return 0;
        return b.requestDate.seconds - a.requestDate.seconds;
      });
      
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, bookId: string, status: 'approved' | 'rejected' | 'issued') => {
    try {
      const updateData: any = {
        status,
        processedAt: serverTimestamp(),
      };

      if (status === 'approved') {
        updateData.approvedAt = serverTimestamp();
        updateData.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }

      if (status === 'issued') {
        updateData.issuedAt = serverTimestamp();
      }

      // Decrement stock only on FIRST approval
      const currentReq = requests.find(r => r.id === requestId);
      if (status === 'approved' && currentReq?.status === 'pending') {
        await updateDoc(doc(db, 'books', bookId), {
          available: increment(-1)
        });
      }

      await updateDoc(doc(db, 'borrowRecords', requestId), updateData);
      toast.success(`Request ${status} successfully!`);
      fetchRequests();
    } catch (error: any) {
      toast.error("Action failed: " + error.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    const isVerified = req.isVerified !== false;
    const hasSemester = req.studentSemester && 
                        req.studentSemester !== 'N/A' && 
                        req.studentSemester !== 'Not Specified' &&
                        req.studentSemester !== 'Manual Entry (No Sem)';

    const matchesSemFilter = selectedSem === 'All' || 
                            req.studentSemester === selectedSem ||
                            (selectedSem !== 'All' && req.studentSemester?.startsWith(selectedSem.charAt(0)));

    return isVerified && hasSemester && matchesSemFilter;
  });

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Borrow Requests</h1>
          <p className="text-muted-foreground mt-1">Review and manage book borrowing requests from students.</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filter by Semester</label>
          <select 
            value={selectedSem} 
            onChange={(e) => setSelectedSem(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
          >
            {semesters.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium text-center">Semester</th>
                  <th className="px-6 py-4 font-medium">Book Details</th>
                  <th className="px-6 py-4 font-medium">Request Date</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {request.studentName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{request.studentName}</p>
                          <p className="text-[10px] text-muted-foreground opacity-60">{request.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10 text-xs font-bold whitespace-nowrap">
                        {request.studentSemester || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{request.bookTitle}</p>
                          <p className="text-[10px] text-muted-foreground opacity-60">ID: {request.bookId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {request.requestDate?.toDate().toLocaleDateString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        request.status === 'issued' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        request.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {request.status === 'issued' ? 'GIVEN' : request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {request.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAction(request.id, request.bookId, 'approved')}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all active:scale-90"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleAction(request.id, request.bookId, 'rejected')}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <select 
                            onChange={(e) => {
                              if (e.target.value === 'issued') {
                                handleAction(request.id, request.bookId, 'issued');
                              }
                            }}
                            className="text-[10px] font-bold bg-secondary border border-border rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="approved">Not Given</option>
                            <option value="issued">Given</option>
                          </select>
                        )}
                        {request.status === 'issued' && (
                          <div className="flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">GIVEN</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No Requests Found</h3>
            <p>No borrowing requests for the selected semester.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
