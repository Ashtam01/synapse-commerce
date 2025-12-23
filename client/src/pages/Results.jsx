import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, SlidersHorizontal, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';

// Shadcn Imports
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const Results = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("Search Results");
  
  // Hybrid Search State
  const [maxPrice, setMaxPrice] = useState(200);
  const [debouncedPrice, setDebouncedPrice] = useState(200);

  // Debounce: Wait for user to stop sliding before requesting
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrice(maxPrice), 500);
    return () => clearTimeout(timer);
  }, [maxPrice]);

  useEffect(() => {
    const fetchResults = async () => {
      const state = location.state;
      if (!state) return;

      setLoading(true);
      try {
        let res;
        
        // --- API ROUTES ---
        if (state.type === 'text') {
          setHeaderTitle(`Results for "${state.query}"`);
          res = await axios.post('http://localhost:5000/api/search/text', { 
            query: state.query,
            maxPrice: debouncedPrice 
          });
        } 
        else if (state.type === 'image') {
          setHeaderTitle("Visual Matches");
          const formData = new FormData();
          formData.append('image', state.file);
          formData.append('maxPrice', debouncedPrice);
          
          res = await axios.post('http://localhost:5000/api/search/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        else if (state.type === 'similar') {
          setHeaderTitle(`More like "${state.title}"`);
          res = await axios.get(`http://localhost:5000/api/products/similar/${state.id}`);
        }

        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.state, debouncedPrice]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-6 md:h-screen md:sticky md:top-0 z-20 flex flex-col gap-6">
        
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
          </Link>
          <span className="font-bold text-gray-500 text-xs tracking-widest uppercase">Refine Search</span>
        </div>

        <div className="space-y-6">
          {/* Price Filter */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <SlidersHorizontal size={16} /> Max Price
              </label>
              <Badge variant="secondary" className="px-3">
                ${maxPrice}
              </Badge>
            </div>
            
            <Slider
              defaultValue={[200]}
              max={500}
              step={10}
              onValueChange={(vals) => setMaxPrice(vals[0])}
              className="py-4"
            />
            
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wide">
              <span>$0</span>
              <span>$500+</span>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-100" />

        {/* Tech Badge */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <Zap size={14} fill="currentColor" /> Neural Engine
          </div>
          <p className="text-[11px] text-blue-600/80 leading-relaxed">
            Hybrid Filtering Active: Vectors + Metadata constraints.
          </p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 md:p-10">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{headerTitle}</h2>
          <span className="text-gray-400 font-medium text-sm">{results.length} items found</span>
        </div>

        {loading ? (
          /* PREMIUM SKELETON LOADING GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {[1,2,3,4,5,6,7,8].map(i => (
               <div key={i} className="flex flex-col space-y-3">
                 <Skeleton className="h-[280px] w-full rounded-2xl bg-gray-200" />
                 <div className="space-y-2 px-2">
                   <Skeleton className="h-4 w-3/4 bg-gray-200" />
                   <Skeleton className="h-4 w-1/2 bg-gray-200" />
                 </div>
               </div>
             ))}
          </div>
        ) : (
          /* RESULTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {results.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Results;