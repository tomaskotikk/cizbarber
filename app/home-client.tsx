"use client";

import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight, ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import logo from "@/app/img/logo.jpg";

type Service = {
  id: string;
  name: string;
  description: string;
  price_czk: number;
  duration_minutes: number;
};

const gallery = [
  {
    index: "01",
    label: "Preciznost",
    title: "Střih, který funguje i zítra.",
    image: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1800&q=90",
  },
  {
    index: "02",
    label: "Atmosféra",
    title: "Klid. Křeslo. Čas jen pro tebe.",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1800&q=90",
  },
  {
    index: "03",
    label: "Detail",
    title: "Čisté linie bez kompromisu.",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1800&q=90",
  },
];

const reviews = [
  {
    text: "Čistá práce, příjemná atmosféra a střih, který drží tvar i několik týdnů.",
    name: "David K.",
    service: "Pánský střih",
  },
  {
    text: "Rezervace bez čekání a každý detail přesně podle domluvy. Určitě přijdu znovu.",
    name: "Tomáš M.",
    service: "Střih a vousy",
  },
  {
    text: "Konečně barber, který nejdřív poslouchá a až potom bere strojek do ruky.",
    name: "Marek S.",
    service: "Střih na míru",
  },
];

export default function HomeClient({ initialServices }: { initialServices: Service[] }) {
  const root = useRef<HTMLElement>(null);
  const horizontal = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    const context = gsap.context(() => {
      gsap.set(".hero-word", { yPercent: 115 });
      gsap.set(".hero-meta", { opacity: 0, y: 24 });
      gsap.set(".hero-support", { opacity: 0, y: 30 });

      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .to(".hero-word", { yPercent: 0, duration: 1.25, stagger: 0.1 })
        .to(".hero-support", { opacity: 1, y: 0, duration: 0.85, stagger: 0.08 }, "-=0.72")
        .to(".hero-meta", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, "-=0.62");

      gsap.to(".hero-media-inner", {
        yPercent: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: ".cinema-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(".hero-title", {
        yPercent: 28,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: ".cinema-hero",
          start: "25% top",
          end: "bottom top",
          scrub: 1,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 80,
          opacity: 0,
          duration: 1.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        gsap.fromTo(
          element,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: element.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.1,
            },
          },
        );
      });

      media.add("(min-width: 821px)", () => {
        if (!horizontal.current || !track.current) return;
        const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);

        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: horizontal.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });

    }, root);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <main className="cinema-site" ref={root}>
      <header className="cinema-nav">
        <a className="cinema-nav-logo" href="#top" aria-label="Číž Barber — úvod">
          <Image src={logo} alt="Číž Barber" priority />
        </a>

        <nav className={menuOpen ? "cinema-nav-links open" : "cinema-nav-links"}>
          <a href="#studio" onClick={() => setMenuOpen(false)}>Naše studio</a>
          <a href="#sluzby" onClick={() => setMenuOpen(false)}>Naše služby</a>
          <a href="#kontakt" onClick={() => setMenuOpen(false)}>Kontakt</a>
        </nav>

        <div className="cinema-nav-actions">
          <a className="cinema-nav-cta" href="/rezervace">
            Rezervovat <ArrowUpRight size={16} />
          </a>
          <a className="cinema-nav-user" href="/login" aria-label="Přihlásit se do administrace" title="Administrace">
            <UserRound size={18} />
          </a>
        </div>

        <button
          className="cinema-menu"
          type="button"
          aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="cinema-hero" id="top">
        <div className="hero-media">
          <div className="hero-media-inner" />
          <div className="hero-shade" />
        </div>

        <div className="hero-content">
          <p className="hero-lead hero-support">Pánské holičství ve Zlíně</p>
          <div className="hero-title" aria-label="Číž Barber">
            <div className="hero-line"><span className="hero-word">ČÍŽ <span className="accent">BARBER</span></span></div>
          </div>
          <p className="hero-tagline hero-support">Střih, který má charakter. Precizní práce bez zbytečných řečí.</p>
        </div>

        <div className="hero-bottom">
          <p className="hero-meta">Číž Barber · Zlín</p>
          <a className="hero-meta hero-scroll" href="#studio">
            Poznej naše studio <ArrowDownRight size={18} />
          </a>
          <p className="hero-meta hero-note">Precizní řemeslo.<br />Čistý výsledek.</p>
        </div>
      </section>

      <section className="cinema-manifesto" id="studio">
        <p className="cinema-kicker" data-reveal>01 / Kdo jsme</p>
        <h1 data-reveal>
          Dobrý střih nekončí v křesle.
          <span> Musí fungovat i každý další den.</span>
        </h1>
        <div className="manifesto-foot" data-reveal>
          <p>Nejdřív posloucháme, potom stříháme. Výsledkem je čistý střih, který sedí tobě i tvému běžnému dni.</p>
          <a className="circle-link" href="/rezervace" aria-label="Rezervovat termín">
            <ArrowUpRight />
          </a>
        </div>
      </section>

      <section className="cinema-horizontal" ref={horizontal}>
        <div className="horizontal-track" ref={track}>
          <article className="horizontal-intro">
            <span>02 / Naše studio</span>
            <h2>Prostor pro<br /><em>dobrý detail.</em></h2>
            <p>Posuň se dál</p>
          </article>

          {gallery.map((item) => (
            <article className="horizontal-card" key={item.index}>
              <div className="horizontal-photo">
                <div data-parallax style={{ backgroundImage: `url(${item.image})` }} />
              </div>
              <div className="horizontal-copy">
                <span>{item.index} / {item.label}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cinema-services" id="sluzby">
        <div className="services-heading">
          <p className="cinema-kicker" data-reveal>03 / Služby</p>
          <h2 data-reveal>Jednoduše.<br /><span>Poctivě.</span></h2>
        </div>

        <div className="cinema-service-list">
          {initialServices.slice(0, 4).map((service, index) => (
            <a className="cinema-service" href="/rezervace" key={service.id} data-reveal>
              <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{service.name}</h3>
                <p>{service.duration_minutes} minut</p>
              </div>
              <strong>{service.price_czk} Kč</strong>
              <span className="service-arrow"><ArrowUpRight /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="cinema-reviews">
        <div className="reviews-top">
          <div data-reveal>
            <p className="cinema-kicker">04 / Hodnocení klientů</p>
            <h2>Dobrá práce<br /><span>se pozná.</span></h2>
          </div>
          <div className="reviews-score" data-reveal>
            <strong>5,0</strong>
            <span aria-label="Pět hvězdiček">★★★★★</span>
            <small>Spokojení klienti</small>
          </div>
        </div>

        <div className="cinema-review-grid">
          {reviews.map((review, index) => (
            <article className="cinema-review" data-reveal key={review.name}>
              <div className="review-index">0{index + 1}</div>
              <div className="review-stars">★★★★★</div>
              <blockquote>„{review.text}“</blockquote>
              <footer>
                <strong>{review.name}</strong>
                <span>{review.service}</span>
              </footer>
            </article>
          ))}
        </div>

        <div className="reviews-action" data-reveal>
          <p>Chceš si udělat vlastní názor?</p>
          <a href="/rezervace">Rezervovat termín <ArrowUpRight /></a>
        </div>
      </section>

      <footer className="cinema-footer" id="kontakt">
        <div className="footer-brand" data-reveal>
          <div>
            <h2>Číž Barber</h2>
            <p>Pánské holičství ve Zlíně</p>
          </div>
          <div className="footer-logo">
            <Image src={logo} alt="Logo Číž Barber" />
          </div>
        </div>
        <div className="footer-grid">
          <div>
            <span>Kontakt</span>
            <a href="tel:+420702155123">+420 702 155 123</a>
            <a href="mailto:cizkuba07@gmail.com">cizkuba07@gmail.com</a>
          </div>
          <div>
            <span>Sleduj nás</span>
            <a href="https://instagram.com/J.ciz" target="_blank" rel="noreferrer">Instagram ↗</a>
          </div>
          <div>
            <span>Otevírací doba</span>
            <p>Po–Pá / 8:00–17:00</p>
            <p>Zlín, Česká republika</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Číž Barber</span>
          <a href="/admin">Admin</a>
          <a href="#top">Nahoru ↑</a>
        </div>
      </footer>
    </main>
  );
}
