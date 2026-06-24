"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Menu, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
  price_czk: number;
  duration_minutes: number;
};

const heroPhotos = [
  "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1500&q=90",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1500&q=90",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1500&q=90",
];

const categories = ["Vše", "Vlasy", "Vousy", "Komplet", "Děti"];
const reviews = [
  ["Čistá práce, příjemná atmosféra a hlavně střih, který drží tvar i po několika týdnech.", "David K.", "Pánský střih"],
  ["Rezervace bez volání, žádné čekání a každý detail byl přesně podle domluvy.", "Tomáš M.", "Střih + vousy"],
  ["Konečně barber, který nejdřív poslouchá a až potom bere strojek do ruky.", "Marek S.", "Konzultace a střih"],
];

const reveal = {
  hidden: { opacity: 0, y: 54, filter: "blur(12px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function getCategory(service: Service) {
  const name = service.name.toLocaleLowerCase("cs");
  if (name.includes("dětsk")) return "Děti";
  if (name.includes("vous") && (name.includes("+") || name.includes("střih"))) return "Komplet";
  if (name.includes("vous")) return "Vousy";
  return "Vlasy";
}

export default function HomeClient({ initialServices }: { initialServices: Service[] }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Vše");
  const [openService, setOpenService] = useState<string | null>(initialServices[0]?.id ?? null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const atelierRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 75, damping: 26, mass: 0.7 });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const { scrollYProgress: atelierProgress } = useScroll({ target: atelierRef, offset: ["start end", "end start"] });

  const heroCopyY = useTransform(heroProgress, [0, 1], [0, 105]);
  const heroCopyOpacity = useTransform(heroProgress, [0, 0.78], [1, 0.3]);
  const heroImageY = useTransform(heroProgress, [0, 1], [0, -76]);
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.075]);
  const leftGalleryY = useTransform(atelierProgress, [0, 1], [74, -74]);
  const middleGalleryY = useTransform(atelierProgress, [0, 1], [16, -105]);
  const rightGalleryY = useTransform(atelierProgress, [0, 1], [104, -32]);

  const filteredServices = useMemo(
    () => activeCategory === "Vše" ? initialServices : initialServices.filter((service) => getCategory(service) === activeCategory),
    [activeCategory, initialServices],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setActivePhoto((current) => (current + 1) % heroPhotos.length), 7200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="site-shell">
      <motion.div className="scroll-progress" style={{ scaleX: smoothProgress }} />
      <nav className="nav">
        <a className="brand" href="#"><span className="brand-mark">ČŽ</span><span>Číž Barber</span></a>
        <div className={mobileMenuOpen ? "nav-links open" : "nav-links"}>
          <a href="#sluzby" onClick={() => setMobileMenuOpen(false)}>Služby</a>
          <a href="#atelier" onClick={() => setMobileMenuOpen(false)}>Ateliér</a>
          <a href="#recenze" onClick={() => setMobileMenuOpen(false)}>Recenze</a>
          <a href="#kontakt" onClick={() => setMobileMenuOpen(false)}>Kontakt</a>
        </div>
        <div className="nav-actions">
          <a className="button nav-cta" href="/rezervace">Rezervovat</a>
          <a className="nav-user" href="/login" aria-label="Přihlášení barbera"><UserRound size={19} /></a>
          <button className="nav-menu-button" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Otevřít menu" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      <section className="hero" ref={heroRef}>
        <motion.div className="hero-copy" style={{ y: heroCopyY, opacity: heroCopyOpacity }}>
          <motion.span className="eyebrow" initial="hidden" animate="visible" variants={reveal} transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}>
            Barber shop / Zlín / Od 2026
          </motion.span>
          <motion.h1 initial="hidden" animate="visible" variants={reveal} transition={{ duration: 1.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>
            Číž<br />Barber
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={reveal} transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            Precizní střih, čisté kontury a péče, která má vlastní tempo. Přijdeš jako klient, odcházíš upravený do posledního detailu.
          </motion.p>
          <motion.div className="hero-actions" initial="hidden" animate="visible" variants={reveal} transition={{ duration: 1.4, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}>
            <a className="button" href="/rezervace">Vybrat termín</a>
            <a className="text-link" href="#sluzby">Prohlédnout ceník <span>↓</span></a>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" style={{ y: heroImageY, scale: heroImageScale }}>
          <div className="hero-photo-stack">
            {heroPhotos.map((photo, index) => (
              <motion.div
                className="hero-photo"
                key={photo}
                style={{ backgroundImage: `url(${photo})` }}
                animate={{ opacity: activePhoto === index ? 1 : 0, scale: activePhoto === index ? 1.03 : 1.105 }}
                transition={{ duration: 2.1, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <div className="hero-caption"><span>01</span><p>Řemeslo bez zkratek.<br />Výsledek bez kompromisu.</p></div>
          <div className="photo-switcher" aria-label="Výběr fotografie">
            {heroPhotos.map((_, index) => (
              <button type="button" className={activePhoto === index ? "photo-dot active" : "photo-dot"} onClick={() => setActivePhoto(index)} key={index} aria-label={`Fotografie ${index + 1}`} />
            ))}
          </div>
        </motion.div>
      </section>

      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker">
          {Array.from({ length: 3 }).map((_, group) => (
            <div className="ticker-set" key={group}>
              <span>Přesný fade</span><i /><span>Hot towel</span><i /><span>Čisté kontury</span><i /><span>Styling</span><i /><span>Online rezervace</span><i />
            </div>
          ))}
        </div>
      </div>

      <section className="section services-section" id="sluzby">
        <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}>
          <div><span className="section-kicker">Ceník služeb</span><h2>Vyber si péči podle sebe.</h2></div>
          <p>Každá návštěva začíná krátkou konzultací. Cena je jasná předem a čas v kalendáři patří jen tobě.</p>
        </motion.div>

        <div className="service-tabs" role="tablist" aria-label="Kategorie služeb">
          {categories.map((category) => (
            <button className={activeCategory === category ? "active" : ""} type="button" role="tab" aria-selected={activeCategory === category} onClick={() => setActiveCategory(category)} key={category}>
              {category}
            </button>
          ))}
        </div>

        <motion.div className="service-list" layout>
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => {
              const isOpen = openService === service.id;
              return (
                <motion.article className={isOpen ? "service-row open" : "service-row"} key={service.id} layout initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.65, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }} onMouseEnter={() => setOpenService(service.id)}>
                  <button className="service-trigger" type="button" onClick={() => setOpenService(isOpen ? null : service.id)} aria-expanded={isOpen}>
                    <span className="service-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="service-name"><strong>{service.name}</strong><small>{getCategory(service)}</small></span>
                    <span className="service-meta"><strong>{service.price_czk} Kč</strong><small>{service.duration_minutes} min</small></span>
                    <span className="service-toggle">{isOpen ? "−" : "+"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div className="service-detail" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
                        <p>{service.description}</p><a href="/rezervace">Rezervovat tuto službu <span>→</span></a>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="section atelier-section" id="atelier" ref={atelierRef}>
        <motion.div className="atelier-copy" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={reveal} transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}>
          <span className="section-kicker">Ateliér</span><h2>Prostor, kde se na detail nespěchá.</h2>
        </motion.div>
        <div className="gallery-strip">
          <motion.div className="gallery-frame gallery-small" style={{ y: leftGalleryY }}><div style={{ backgroundImage: "url(https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?auto=format&fit=crop&w=1000&q=88)" }} /><span>01 / Detail</span></motion.div>
          <motion.div className="gallery-frame gallery-main" style={{ y: middleGalleryY }}><div style={{ backgroundImage: "url(https://images.unsplash.com/photo-1588771930296-88c2cb03f386?auto=format&fit=crop&w=1100&q=88)" }} /><span>02 / Atmosféra</span></motion.div>
          <motion.div className="gallery-frame gallery-small" style={{ y: rightGalleryY }}><div style={{ backgroundImage: "url(https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1000&q=88)" }} /><span>03 / Řemeslo</span></motion.div>
        </div>
      </section>

      <section className="experience-section">
        <div className="experience-intro"><span className="section-kicker">Více než střih</span><h2>Od rezervace až po poslední tah břitvou.</h2></div>
        <div className="experience-grid">
          {[
            ["01", "SMS připomínka", "Den před návštěvou ti připomeneme termín. Hlava může řešit důležitější věci."],
            ["02", "Konzultace v ceně", "Tvar hlavy, růst vlasů i běžný styling. Nejdřív plán, potom střih."],
            ["03", "Doporučení na doma", "Ukážeme ti, jak výsledek udržet bez deseti produktů a půl hodiny před zrcadlem."],
          ].map(([number, title, copy], index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1, delay: index * 0.13, ease: [0.16, 1, 0.3, 1] }}>
              <span>{number}</span><h3>{title}</h3><p>{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="reviews-section" id="recenze">
        <div className="reviews-heading">
          <div><span className="section-kicker">Ohlasy klientů</span><h2>Dobrá práce se vrací.</h2></div>
          <div className="rating-lockup"><strong>5,0</strong><span>★★★★★</span><small>Hodnocení klientů</small></div>
        </div>
        <div className="review-grid">
          {reviews.map(([text, name, service], index) => (
            <motion.blockquote key={name} initial={{ opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 1, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}>
              <div className="review-stars">★★★★★</div><p>„{text}“</p><footer><strong>{name}</strong><span>{service}</span></footer>
            </motion.blockquote>
          ))}
        </div>
        <p className="review-note">Ukázkový obsah recenzí. Před spuštěním propojíme skutečné Google hodnocení.</p>
      </section>

      <section className="booking-teaser">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={reveal} transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}>
          <span className="section-kicker">Online rezervace</span><h2>Tvůj čas.<br />Tvoje křeslo.</h2>
          <p>Vyber službu, barbera a volný termín. Hotovo za pár kliknutí.</p>
          <a className="button light-button" href="/rezervace">Otevřít rezervaci</a>
        </motion.div>
      </section>

      <section className="section contact-section" id="kontakt">
        <span className="section-kicker">Kontakt</span><h2>Najdeš nás v centru Zlína.</h2>
        <div className="contact">
          <a className="contact-item" href="tel:+420702155123"><span>Telefon</span><strong>702 155 123</strong></a>
          <a className="contact-item" href="mailto:cizkuba07@gmail.com"><span>E-mail</span><strong>cizkuba07@gmail.com</strong></a>
          <a className="contact-item" href="https://instagram.com/J.ciz" target="_blank" rel="noreferrer"><span>Instagram</span><strong>@J.ciz</strong></a>
          <div className="contact-item"><span>Rezervace</span><strong>Po–Pá / 8:00–17:00</strong></div>
        </div>
      </section>

      <footer className="footer"><strong>Číž Barber</strong><span>© 2026 Všechna práva vyhrazena</span><a href="/admin">Admin</a></footer>
    </main>
  );
}
