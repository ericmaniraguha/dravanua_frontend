import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/250795520554?text=Hello%20DRA%20VANUA%20HUB!%20I%20would%20like%20to%20book%20a%20service."
      target="_blank"
      rel="noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
      id="whatsapp-float-btn"
    >
      <MessageCircle size={22} />
      <span>WhatsApp</span>
    </a>
  );
};

export default WhatsAppFloat;
