import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import { BookOpen, Search, Filter, BookMarked, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentBooks: React.FC = () => {
  const { user, userData } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Fiction', 'Non-Fiction', 'Science', 'History', 'Technology', 'Arts'];

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const booksData: any[] = [];
        querySnapshot.forEach((doc) => {
          booksData.push({ id: doc.id, ...doc.data() });
        });
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
        toast.error("Failed to load books");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleBorrowRequest = async (book: any) => {
    if (!user || !userData) return;

    if (book.available <= 0) {
      return toast.error("This book is currently out of stock!");
    }

    if (!userData.semester || userData.semester === 'Not Specified') {
      return toast.error("Please update your Semester in Profile before requesting books.");
    }

    try {
      // Create a borrow request record
      await addDoc(collection(db, 'borrowRecords'), {
        studentUid: user.uid,
        studentName: userData.name,
        studentEmail: userData.email,
        studentId: userData.studentId,
        studentSemester: userData.semester || 'N/A',
        isVerified: userData.emailVerified || false,
        bookId: book.id,
        bookTitle: book.title,
        status: 'pending',
        requestDate: serverTimestamp(),
      });

      toast.success(`Request sent for "${book.title}"! Admin will review it.`);
    } catch (error: any) {
      toast.error("Failed to send request: " + error.message);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Browse Library</h1>
        <p className="text-muted-foreground mt-1">Explore our collection and request books to borrow.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by title or author..." 
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Filter className="w-5 h-5 text-muted-foreground ml-2 hidden md:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBooks.map((book) => (
            <div key={book.id} className="group perspective-1000">
              <div className="relative bg-card border border-border rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:rotate-x-2 flex flex-col h-full transform-style-3d">
                <div className="aspect-[4/5] bg-gradient-to-br from-secondary to-background p-6 flex items-center justify-center relative overflow-hidden">
                  {/* 3D-like Book Placeholder */}
                  <div className="w-full h-full relative group-hover:scale-110 transition-transform duration-700 ease-out preserve-3d">
                    <img 
                      src="/library_3d_book_illustration.png" 
                      alt="3D Book"
                      className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3330/3330314.png'; // Fallback to a 3D book icon
                      }}
                    />
                  </div>
                  
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                      book.available > 0 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {book.available > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Decorative Glow */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-6 flex-1 flex flex-col relative z-10">
                  <div className="mb-4">
                    <h3 className="font-bold text-foreground text-xl line-clamp-1 group-hover:text-primary transition-colors leading-tight">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      {book.author}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] px-3 py-1 bg-secondary/80 backdrop-blur-sm rounded-full text-muted-foreground border border-border uppercase tracking-widest font-semibold">
                      {book.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium ml-auto">
                      {book.available} COPIES
                    </span>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/50 flex items-center gap-3">
                    <button 
                      onClick={() => handleBorrowRequest(book)}
                      disabled={book.available <= 0}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all transform active:scale-95 ${
                        book.available > 0 
                          ? 'bg-primary text-primary-foreground hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-primary/90' 
                          : 'bg-secondary/50 text-muted-foreground cursor-not-allowed grayscale'
                      }`}
                    >
                      <BookMarked className="w-4 h-4" />
                      BORROW
                    </button>
                    <button className="p-3.5 bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-2xl transition-all border border-border/50 backdrop-blur-sm">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">No books found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      )}
    </Layout>
  );
};
