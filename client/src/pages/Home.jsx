import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Image as ImageIcon, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

const Home = () => {
  const [query, setQuery] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    navigate('/search', { state: { type: 'text', query } });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) navigate('/search', { state: { type: 'image', file } });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-20 flex flex-col justify-center relative overflow-hidden">
      
      {/* Background Gradient Mesh (Subtle Premium Feel) */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 z-10 max-w-5xl">
        
        {/* Animated Hero Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
            <Sparkles size={12} className="text-purple-500" /> Neural Commerce Engine v1.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-gray-900">
            Search by <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">
              Meaning, Not Keywords.
            </span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the future of discovery. Upload an image or describe a "vibe," and our multimodal AI will find the perfect match from thousands of products.
          </p>
        </motion.div>

        {/* The Premium Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-2xl mx-auto relative group"
        >
          {/* Glowing Border Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-500" />
          
          <form 
            onSubmit={handleSearch} 
            className={`relative bg-white rounded-full flex items-center p-2 shadow-xl shadow-gray-100/50 border border-gray-100 transition-all duration-300 ${isHovered ? 'scale-[1.01]' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="pl-4 pr-2 text-gray-400">
              <Search size={22} />
            </div>
            
            <input 
              type="text"
              placeholder="Describe a look (e.g. 'vintage leather biker jacket')..." 
              className="w-full p-3 bg-transparent text-lg outline-none text-gray-800 placeholder-gray-300 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />

            <div className="flex items-center gap-2 pr-2">
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                onClick={() => fileInputRef.current.click()}
                title="Search by Image"
              >
                <ImageIcon size={20} />
              </Button>
              
              <Button 
                type="submit" 
                className="rounded-full bg-black hover:bg-gray-900 text-white px-6 h-12 font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Search
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Suggested Chips */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {["Winter Aesthetics", "Minimalist Beige", "Streetwear", "90s Retro"].map((tag) => (
            <button 
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm font-medium text-gray-500 hover:border-gray-300 hover:bg-white transition-all cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

export default Home;