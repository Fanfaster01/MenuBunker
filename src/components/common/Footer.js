import { MessageCircle } from 'lucide-react';
import Instagram from '@/components/icons/InstagramIcon';

export default function Footer() {
  return (
    <footer className="mt-8 pt-4 border-t border-[#C8A882]">
      <div className="flex justify-center space-x-6 mb-4">
        <a
          href="https://api.whatsapp.com/send?phone=584141435394"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-[#8B7355] hover:text-[#C8A882] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Delivery</span>
        </a>
        <a
          href="https://instagram.com/BunkeRestaurant"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-[#8B7355] hover:text-[#C8A882] transition-colors"
        >
          <Instagram className="w-5 h-5" />
          <span>@BunkeRestaurant</span>
        </a>
      </div>
    </footer>
  );
}