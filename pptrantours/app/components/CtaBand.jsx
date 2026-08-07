import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp, FaArrowRight } from "react-icons/fa";
import { site } from "../data/site";

export default function CtaBand() {
  return (
    <section className="shell py-16 lg:py-24">
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center lg:px-16 lg:py-24">
        <Image
          src="/local/hero-8.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-ink/85 via-ink/70 to-crimson-900/70"
        />

        <div className="relative mx-auto max-w-2xl">
          <p className="eyebrow-light">Ready when you are</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-white sm:text-[2.75rem]">
            Tell us your flight number.
            <br />
            We&apos;ll handle the rest.
          </h2>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-white/70">
            Our days sell out in high season. Send us your dates and group size and
            we&apos;ll come back with a plan and a price — usually within the hour.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
            >
              <FaWhatsapp className="text-lg" />
              WhatsApp {site.contact.phone}
            </a>
            <Link href="/contact-us" className="btn-ghost-light group">
              Send a message
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/45">{site.hours}</p>
        </div>
      </div>
    </section>
  );
}
