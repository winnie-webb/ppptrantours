import { FaWhatsapp } from "react-icons/fa";
import { site } from "../data/site";

/** Floating WhatsApp button — visible from first paint, on every page. */
export default function WhatsAppFab({ dict }) {
  return (
    <a
      href={site.contact.whatsappHref}
      target="_blank"
      rel="noreferrer"
      aria-label={dict?.common?.whatsappAria ?? "Chat on WhatsApp"}
      className="whatsapp-fab fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-[#0f7a3f] py-3.5 pl-4 pr-5 font-semibold text-white shadow-lift transition-all duration-300 hover:brightness-110"
    >
      <FaWhatsapp className="text-xl" />
      <span className="hidden text-sm sm:inline">
        {dict?.common?.chatWithUs ?? "Chat with us"}
      </span>
    </a>
  );
}
