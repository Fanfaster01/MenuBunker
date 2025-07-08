import { MessageCircle, Instagram } from 'lucide-react';

export default function VictorianaFooter() {
  return (
    <footer className="mt-8 pt-4 border-t border-[#C8A882]">
      <div className="flex justify-center space-x-6 mb-4">
        <a 
          href="https://walink.co/b90a17" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-[#C8A882] hover:text-[#C8302E] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Delivery</span>
        </a>
        <a 
          href="https://instagram.com/lavictorianac.a" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-[#C8A882] hover:text-[#C8302E] transition-colors"
        >
          <Instagram className="w-5 h-5" />
          <span>@lavictorianac.a</span>
        </a>
      </div>
    </footer>
  );
}