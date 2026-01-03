import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, SlidersHorizontal, Send, MessageCircle, X, Sparkles, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';

// Shadcn Imports
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// Generate unique session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const Results = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("Search Results");
  
  // Hybrid Search State
  const [maxPrice, setMaxPrice] = useState(200);
  const [debouncedPrice, setDebouncedPrice] = useState(200);

  // Conversational AI State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [lastQuery, setLastQuery] = useState('');
  const [lastVector, setLastVector] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
          setLastQuery(state.query);
          res = await axios.post('http://localhost:5000/api/search/text', { 
            query: state.query,
            maxPrice: debouncedPrice 
          });
          // Add welcome message
          setChatMessages([{
            type: 'assistant',
            content: `I found ${res.data.length} products for "${state.query}". You can refine by chatting! Try "show me cheaper" or "in blue color".`
          }]);
        } 
        else if (state.type === 'image') {
          setHeaderTitle("Visual Matches");
          const formData = new FormData();
          formData.append('image', state.file);
          formData.append('maxPrice', debouncedPrice);
          
          res = await axios.post('http://localhost:5000/api/search/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setChatMessages([{
            type: 'assistant',
            content: `Found ${res.data.length} similar products! Try "more casual", "darker", "under $50"...`
          }]);
        }
        else if (state.type === 'similar') {
          setHeaderTitle(`More like "${state.title}"`);
          setLastQuery(state.title);
          res = await axios.get(`http://localhost:5000/api/products/similar/${state.id}`);
          setChatMessages([{
            type: 'assistant',
            content: `Products similar to "${state.title}". Want something different? Just tell me!`
          }]);
        }

        setResults(res.data);
      } catch (err) {
        console.error(err);
        setChatMessages([{
          type: 'assistant',
          content: "Oops! Something went wrong. What are you looking for?"
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.state, debouncedPrice]);

  // Handle conversational search
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/search/converse', {
        message: userMessage,
        sessionId,
        context: { lastQuery, lastVector, maxPrice: debouncedPrice, resultCount: results.length }
      });

      if (res.data.type === 'clarification') {
        setChatMessages(prev => [...prev, { type: 'assistant', content: res.data.question }]);
      } else {
        setResults(res.data.results);
        setLastQuery(res.data.searchQuery || lastQuery);
        setLastVector(res.data.vector);
        if (res.data.filters?.maxPrice) setMaxPrice(res.data.filters.maxPrice);

        setChatMessages(prev => [...prev, { 
          type: 'assistant', 
          content: `${res.data.summary} Found ${res.data.results.length} products!`
        }]);
        if (res.data.searchQuery) setHeaderTitle(`Results for "${res.data.searchQuery}"`);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "Sorry, couldn't understand. Try rephrasing?" 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestions = ["Something cheaper", "Different colors", "More premium", "More casual"];

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
              value={[maxPrice]}
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

        {/* AI Chat Button */}
        <Button 
          onClick={() => setChatOpen(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl py-6 font-bold shadow-lg"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Chat to Refine
        </Button>

        {/* Tech Badge */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100/50 space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <Sparkles size={14} fill="currentColor" /> Conversational AI
          </div>
          <p className="text-[11px] text-purple-600/80 leading-relaxed">
            Chat naturally: "cheaper", "different style", "show blue ones"
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
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products found. Try different search!</p>
            <Button onClick={() => setChatOpen(true)} className="mt-4" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" /> Tell me what you want
            </Button>
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

      {/* --- CHAT PANEL --- */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-blue-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Synapse AI</h3>
                  <p className="text-xs text-white/70">Shopping Assistant</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'user' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                    }`}>
                      {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.type === 'user' ? 'bg-gray-900 text-white rounded-br-md' : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {chatLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-sm border">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 border-t bg-white">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setChatInput(s)}
                    className="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t bg-white">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full p-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe what you want..." disabled={chatLoading}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder-gray-400" />
                <Button type="submit" size="icon" disabled={!chatInput.trim() || chatLoading}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 h-10 w-10">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button (Mobile) */}
      {!chatOpen && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl flex items-center justify-center md:hidden z-40">
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
};

export default Results;