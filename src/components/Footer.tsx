import { Link } from 'react-router-dom';

interface FooterProps {
  currentPage: string;
}

const Footer = ({ currentPage }: FooterProps) => {
  return (
    <div className="relative z-10 bg-slate-900 text-white py-8 border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <img src="/lovable-uploads/cb9c1fda-8a6f-4aaa-b435-514069a9eaad.png" alt="The Training Department Logo" className="h-8 w-8" />
            <div>
              <p className="font-semibold">The Training Department</p>
              <p className="text-xs text-slate-400">{currentPage}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/agent-hq" className="text-slate-400 hover:text-white transition-colors">
              Agent HQ
            </Link>
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs text-slate-400">System Online</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            © 2024 The Training Department. All rights reserved. | 
            <Link to="/privacy-policy" className="hover:text-white ml-1">Privacy Policy</Link> | 
            <Link to="/terms-of-service" className="hover:text-white ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;