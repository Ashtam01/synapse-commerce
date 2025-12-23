import { BrainCircuit, ShoppingBag, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto flex justify-between items-center h-16 px-6">
        
        {/* Logo - Minimal & Bold */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-black text-white p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <BrainCircuit size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">SYNAPSE</span>
        </Link>
        
        {/* Nav Links - Subtle */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <Link to="/" className="hover:text-black transition-colors">Discover</Link>
          <a href="#" className="hover:text-black transition-colors">Curated</a>
          <a href="#" className="hover:text-black transition-colors">Visual Search</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-black">
            <ShoppingBag size={20} />
          </Button>
          <Button variant="default" size="sm" className="rounded-full px-5 bg-black hover:bg-gray-800 text-white font-semibold">
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;