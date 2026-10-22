/* ============================================================
   AirPods Pro 2 — landing page interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* ----------------------------------------------------------
     Nav: sticky state, mobile menu, scroll spy, progress bar
     ---------------------------------------------------------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  const progressBar = $("#progressBar");
  const links = $$(".nav__link");
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const closeMenu = () => {
    navLinks.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
  };

  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  links.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (
      navLinks.classList.contains("is-open") &&
      !navLinks.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  /* scroll spy */
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${entry.target.id}`
          )
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => spy.observe(section));

  /* scroll handling (rAF throttled) */
  const lifeImg = $("#lifeImg");
  const stickyBuy = $("#stickyBuy");
  const buySection = $("#buy");
  let buyInView = false;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const doc = document.documentElement;

    nav.classList.toggle("is-stuck", y > 12);

    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = `${max > 0 ? clamp((y / max) * 100, 0, 100) : 0}%`;

    if (!reduceMotion) {
      if (lifeImg) {
        const rect = lifeImg.parentElement.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) / 12;
          lifeImg.style.transform = `translate3d(0, ${clamp(offset, -70, 70)}px, 0)`;
        }
      }
    }

    /* mobile sticky buy bar: after the hero, before the buy section */
    const showSticky = y > 620 && !buyInView;
    stickyBuy.classList.toggle("is-visible", showSticky);
    stickyBuy.setAttribute("aria-hidden", String(!showSticky));
    document.body.classList.toggle("has-sticky-bar", showSticky);

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    },
    { passive: true }
  );

  new IntersectionObserver(
    ([entry]) => {
      buyInView = entry.isIntersecting;
      if (buyInView) {
        stickyBuy.classList.remove("is-visible");
        document.body.classList.remove("has-sticky-bar");
      }
      onScroll();
    },
    { threshold: 0.15 }
  ).observe(buySection);

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ----------------------------------------------------------
     Counters
     ---------------------------------------------------------- */
  const formatNumber = (value, decimals) => {
    if (decimals > 0) return value.toFixed(decimals);
    return Math.round(value).toLocaleString("en-US");
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);

        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const duration = 1500;
        const start = performance.now();

        if (reduceMotion) {
          el.textContent = formatNumber(target, decimals) + suffix;
          return;
        }

        const tick = (now) => {
          const p = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = formatNumber(target * eased, decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  $$(".counter").forEach((el) => counterObserver.observe(el));

  /* battery fill */
  const batteryFill = $("#batteryFill");
  if (batteryFill) {
    const batteryObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        batteryFill.style.width = "88%";
        batteryObserver.disconnect();
      },
      { threshold: 0.4 }
    );
    batteryObserver.observe(batteryFill);
  }

  /* ----------------------------------------------------------
     ANC demo — canvas waveform + slider
     ---------------------------------------------------------- */
  const anc = (() => {
    const canvas = $("#ancCanvas");
    if (!canvas) return null;

    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return null;

    const range = $("#ancRange");
    const modeEl = $("#ancMode");
    const dbEl = $("#ancDb");
    const tip = $("#ancTip");
    const chips = $$(".chip[data-anc]");

    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let visible = true;
    let rafId = null;
    let smooth = 100;

    const particles = Array.from({ length: 54 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.4,
      s: Math.random() * 0.09 + 0.03,
      drift: Math.random() * Math.PI * 2,
    }));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const target = Number(range.value);
      smooth += (target - smooth) * 0.07;
      const cancel = smooth / 100; // 0 = transparency, 1 = full ANC
      const noise = 1 - cancel;
      const amp = 0.22 + 1.5 * noise;

      time += 0.012 + noise * 0.014;

      ctx.clearRect(0, 0, width, height);

      /* faint baseline */
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.restore();

      /* floating noise particles */
      if (noise > 0.02) {
        ctx.save();
        particles.forEach((p) => {
          p.y -= p.s * (0.35 + noise) * 0.012;
          if (p.y < -0.05) p.y = 1.05;
          const px = (p.x + Math.sin(time + p.drift) * 0.02) * width;
          const py = p.y * height;
          ctx.globalAlpha = noise * 0.32;
          ctx.fillStyle = "#9fe9ff";
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      /* layered waves */
      const layers = [
        { freq: 2.2, speed: 0.9, amp: 1, width: 2.2, alpha: 0.95, hue: "#4ad9ff" },
        { freq: 4.4, speed: 1.4, amp: 0.55, width: 1.6, alpha: 0.55, hue: "#8b7bff" },
        { freq: 8.6, speed: 0.7, amp: 0.28, width: 1.2, alpha: 0.35, hue: "#ffffff" },
      ];

      layers.forEach((layer, i) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = layer.hue;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;
        ctx.lineJoin = "round";
        if (cancel > 0.5) {
          ctx.shadowColor = "rgba(74,217,255,0.65)";
          ctx.shadowBlur = 14 * cancel;
        }

        const waveHeight = height * 0.16 * amp;
        for (let x = 0; x <= width; x += 3) {
          const p = x / width;
          const envelope = Math.pow(Math.sin(Math.PI * p), 1.4);
          const y =
            Math.sin(p * Math.PI * layer.freq + time * layer.speed * 2.2) *
              waveHeight * layer.amp +
            Math.sin(p * Math.PI * layer.freq * 2.7 - time * layer.speed * 1.7) *
              waveHeight * 0.32 * layer.amp +
            Math.sin(p * Math.PI * layer.freq * 6.1 + time * layer.speed * 2.6) *
              waveHeight * 0.12 * layer.amp * (0.4 + noise);

          const yy = height / 2 + y * envelope;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.restore();
      });

      /* calm-glow at centre when cancelling is strong */
      if (cancel > 0.35) {
        const g = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.min(width, height) * 0.55
        );
        g.addColorStop(0, `rgba(74,217,255,${0.12 * (cancel - 0.35)})`);
        g.addColorStop(1, "rgba(74,217,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (rafId === null) rafId = requestAnimationFrame(draw);
    }
    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function syncUI(value) {
      const v = Number(value);
      let mode = "Adaptive";
      if (v < 25) mode = "Transparency";
      else if (v > 75) mode = "Noise Cancellation";

      const db = Math.round(v * 0.48);
      modeEl.textContent = mode;
      dbEl.textContent = `−${db}`;
      range.setAttribute(
        "aria-valuetext",
        `${mode}, minus ${db} decibels of ambient noise`
      );
      range.style.setProperty("--p", String(v));

      chips.forEach((chip) =>
        chip.classList.toggle("is-active", Number(chip.dataset.anc) === v)
      );
    }

    range.addEventListener("input", (e) => {
      syncUI(e.target.value);
      tip.classList.add("is-hidden");
    });

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        range.value = chip.dataset.anc;
        syncUI(chip.dataset.anc);
        tip.classList.add("is-hidden");
      });
    });

    /* pause the animation when off screen */
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduceMotion) start();
        else stop();
        if (visible && reduceMotion) {
          // draw one static frame
          resize();
          draw();
          stop();
        }
      },
      { threshold: 0.05 }
    ).observe(canvas);

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduceMotion) {
          draw();
          stop();
        }
      }, 160);
    });

    /* initial frame */
    syncUI(range.value);
    resize();
    if (reduceMotion) {
      draw();
      stop();
    } else {
      start();
    }

    return { syncUI };
  })();

  /* ----------------------------------------------------------
     Accordions
     ---------------------------------------------------------- */
  $$(".acc").forEach((acc) => {
    const btn = $(".acc__btn", acc);
    const panel = $(".acc__panel", acc);
    const exclusive = acc.parentElement.classList.contains("accordion--plain");

    const setOpen = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.style.height = `${panel.scrollHeight}px`;
        const done = () => {
          panel.style.height = "auto";
          panel.removeEventListener("transitionend", done);
        };
        panel.addEventListener("transitionend", done);
      } else {
        panel.style.height = `${panel.scrollHeight}px`;
        // force reflow so the collapse animates from the measured height
        void panel.offsetHeight;
        panel.style.height = "0px";
      }
    };

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      if (exclusive && !isOpen) {
        $$(".acc", acc.parentElement).forEach((sibling) => {
          if (sibling === acc) return;
          const sBtn = $(".acc__btn", sibling);
          const sPanel = $(".acc__panel", sibling);
          if (sBtn.getAttribute("aria-expanded") === "true") {
            sBtn.setAttribute("aria-expanded", "false");
            sPanel.style.height = `${sPanel.scrollHeight}px`;
            void sPanel.offsetHeight;
            sPanel.style.height = "0px";
          }
        });
      }
      setOpen(!isOpen);
    });

    /* initial state */
    if (btn.getAttribute("aria-expanded") === "true") {
      panel.style.height = "auto";
    } else {
      panel.style.height = "0px";
    }
  });

  window.addEventListener("resize", () => {
    $$(".acc__panel").forEach((panel) => {
      if (panel.style.height === "auto") return;
      const open = panel.previousElementSibling.getAttribute("aria-expanded") === "true";
      if (open) panel.style.height = "auto";
    });
  });

  /* ----------------------------------------------------------
     Reviews carousel
     ---------------------------------------------------------- */
  const carousel = (() => {
    const track = $("#carouselTrack");
    if (!track) return;

    const viewport = $("#carouselViewport");
    const slides = $$(".review", track);
    const prev = $("#prevReview");
    const next = $("#nextReview");
    const dotsWrap = $("#carouselDots");
    let index = 0;
    let maxIndex = 0;
    let perView = 1;
    let autoplay = null;
    let paused = false;

    const gap = () =>
      parseFloat(getComputedStyle(track).columnGap || "0") || 0;

    function perViewCount() {
      const slideW = slides[0].getBoundingClientRect().width;
      const trackW = track.parentElement.getBoundingClientRect().width;
      return Math.max(1, Math.round((trackW + gap()) / (slideW + gap())));
    }

    function buildDots() {
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Go to review group ${i + 1}`);
        dot.addEventListener("click", () => go(i));
        dotsWrap.appendChild(dot);
      }
    }

    function update() {
      const slide = slides[index];
      const offset = slide ? slide.offsetLeft : 0;
      track.style.transform = `translate3d(-${offset}px, 0, 0)`;
      $$(".dot", dotsWrap).forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
        dot.tabIndex = active ? 0 : -1;
      });
      prev.disabled = index <= 0;
      next.disabled = index >= maxIndex;
    }

    function go(i) {
      index = clamp(i, 0, maxIndex);
      update();
    }

    function measure() {
      perView = perViewCount();
      maxIndex = Math.max(0, slides.length - perView);
      index = clamp(index, 0, maxIndex);
      buildDots();
      update();
    }

    prev.addEventListener("click", () => {
      go(index - 1);
      restart();
    });
    next.addEventListener("click", () => {
      go(index + 1);
      restart();
    });

    function restart() {
      if (autoplay) clearInterval(autoplay);
      if (reduceMotion) return;
      autoplay = setInterval(() => {
        if (paused) return;
        go(index >= maxIndex ? 0 : index + 1);
      }, 6000);
    }

    const card = $(".carousel");
    card.addEventListener("pointerenter", () => (paused = true));
    card.addEventListener("pointerleave", () => (paused = false));
    card.addEventListener("focusin", () => (paused = true));
    card.addEventListener("focusout", () => (paused = false));

    /* keyboard */
    carousel_keys();
    function carousel_keys() {
      viewport.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        }
      });
      viewport.tabIndex = 0;
    }

    /* subtle swipe support */
    let startX = null;
    viewport.addEventListener("pointerdown", (e) => (startX = e.clientX));
    viewport.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 160);
    });

    measure();
    restart();
  })();

  /* ----------------------------------------------------------
     Buy panel — price, quantity, engraving, cart
     ---------------------------------------------------------- */
  const buy = (() => {
    const BASE = 249;
    const panel = $(".buy__panel");
    if (!panel) return;

    const priceEl = $("#totalPrice");
    const stickyPrice = $("#stickyPrice");
    const qtyEl = $("#qtyValue");
    const minus = $("#qtyMinus");
    const plus = $("#qtyPlus");
    const addBtn = $("#addToBag");
    const engraveWrap = $("#engraveWrap");
    const engraveInput = $("#engraveInput");
    const engraveCount = $("#engraveCount");
    const caseInputs = $$('input[name="case"]', panel);
    const engInputs = $$('input[name="engrave"]', panel);

    let qty = 1;
    let engraving = false;

    const money = (n) =>
      `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    function unitPrice() {
      const addon = Number(
        (caseInputs.find((i) => i.checked) || {}).value || 0
      );
      return BASE + addon;
    }

    function refresh() {
      const total = unitPrice() * qty;
      priceEl.textContent = money(total);
      if (stickyPrice) stickyPrice.textContent = money(total);
      qtyEl.textContent = String(qty);
      minus.disabled = qty <= 1;
      plus.disabled = qty >= 5;
    }

    caseInputs.forEach((input) => input.addEventListener("change", refresh));

    minus.addEventListener("click", () => {
      qty = clamp(qty - 1, 1, 5);
      refresh();
    });
    plus.addEventListener("click", () => {
      qty = clamp(qty + 1, 1, 5);
      refresh();
    });

    engInputs.forEach((input) =>
      input.addEventListener("change", () => {
        engraving = input.value === "on" && input.checked;
        engraveWrap.hidden = !engraving;
        if (engraving) {
          window.setTimeout(() => engraveInput.focus(), 60);
        }
      })
    );

    engraveInput.addEventListener("input", () => {
      engraveCount.textContent = String(engraveInput.value.length);
    });

    addBtn.addEventListener("click", () => {
      if (engraving && engraveInput.value.trim().length === 0) {
        engraveInput.focus();
        toast("Add a name or emoji to engrave — or choose None.", true);
        return;
      }

      const care = unitPrice() > BASE;
      const engravingText = engraving ? engraveInput.value.trim() : "";

      if (window.AirPodsCart) {
        window.AirPodsCart.add({
          id: "airpods-pro-2",
          name: "AirPods Pro 2",
          price: unitPrice(),
          qty,
          care,
          engraving: engravingText,
        });
      }

      const label = engravingText ? ` · engraved “${engravingText}”` : "";
      toast(`Added ${qty} × AirPods Pro 2 to your bag${label}`);
      addBtn.querySelector("span").textContent = "Added to bag ✓";
      window.setTimeout(() => {
        addBtn.querySelector("span").textContent = "Add to Bag";
      }, 2200);
    });

    refresh();
  })();

  /* ----------------------------------------------------------
     Newsletter
     ---------------------------------------------------------- */
  const subscribeForm = $("#subscribeForm");
  const subscribeMsg = $("#subscribeMsg");
  const subscribeEmail = $("#subscribeEmail");

  if (subscribeForm) {
    subscribeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = subscribeEmail.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      subscribeMsg.classList.toggle("is-error", !valid);

      if (!valid) {
        subscribeMsg.textContent = "Please enter a valid email address.";
        subscribeEmail.focus();
        return;
      }

      subscribeMsg.textContent = "You’re on the list. Quiet things incoming.";
      subscribeEmail.value = "";
      subscribeEmail.blur();
    });
  }

  /* ----------------------------------------------------------
     Toast helper
     ---------------------------------------------------------- */
  const toastEl = $("#toast");
  let toastTimer = null;

  function toast(message, isError = false) {
    toastEl.textContent = message;
    toastEl.classList.toggle("is-error", isError);
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(
      () => toastEl.classList.remove("is-visible"),
      3400
    );
  }

  /* ----------------------------------------------------------
     Hero pointer tilt (desktop only)
     ---------------------------------------------------------- */
  const stage = $(".hero__stage");
  const heroSection = $(".hero");
  if (stage && !reduceMotion) {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      heroSection.addEventListener("pointermove", (e) => {
        const rect = heroSection.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        stage.style.transform = `rotateY(${cx * 7}deg) rotateX(${cy * -5}deg) translateZ(0)`;
        stage.style.transition = "transform 0.25s ease-out";
      });
      heroSection.addEventListener("pointerleave", () => {
        stage.style.transition = "transform 0.9s cubic-bezier(0.22,1,0.36,1)";
        stage.style.transform = "none";
      });
    }
  }

  /* ----------------------------------------------------------
     Footer year + misc
     ---------------------------------------------------------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* smooth-scroll fallback for reduced motion / focus management */
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (id === "#" || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      (nav ? nav.offsetHeight : 0) -
      12;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });
})();
