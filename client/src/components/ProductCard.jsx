import { ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const matchScore = Math.round(product.score * 100);

  // Dynamic Badge Color Logic
  const getBadgeVariant = (score) => {
    if (score > 88) return "default"; // Black (High match)
    if (score > 75) return "secondary"; // Gray (Medium match)
    return "outline"; // White border (Low match)
  };

  const handleFindSimilar = (e) => {
    e.preventDefault();
    navigate('/search', { state: { type: 'similar', id: product._id, title: product.title } });
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      
      {/* IMAGE AREA */}
      <div className="relative h-72 overflow-hidden bg-gray-100">
        <img 
          src={product.image_url} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out"
        />
        
        {/* SCORE BADGE */}
        <div className="absolute top-3 right-3">
          <Badge variant={getBadgeVariant(matchScore)} className="backdrop-blur-md bg-opacity-90 shadow-sm">
            {matchScore}% Match
          </Badge>
        </div>

        {/* HOVER OVERLAY (Find Similar) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-end justify-center pb-6">
           <Button 
             onClick={handleFindSimilar}
             className="bg-white text-black hover:bg-gray-100 font-bold shadow-xl rounded-full"
           >
             <RefreshCw className="mr-2 h-4 w-4" /> Visual Match
           </Button>
        </div>
      </div>

      {/* DETAILS AREA */}
      <CardContent className="p-5">
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{product.title}</h3>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
          <span className="text-xl font-black text-gray-900 tracking-tight">${product.price}</span>
          
          <a 
            href={product.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center gap-1 group/link"
          >
            Buy Now <ExternalLink className="h-3 w-3 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;