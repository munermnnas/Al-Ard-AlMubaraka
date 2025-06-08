// Language switching
const langEnBtn = document.getElementById('lang-en');
const langArBtn = document.getElementById('lang-ar');
const html = document.documentElement;

function setLanguage(lang) {
  if (lang === 'ar') {
    html.setAttribute('lang', 'ar');
    document.body.setAttribute('dir', 'rtl');
    langArBtn.classList.add('active');
    langEnBtn.classList.remove('active');
  } else {
    html.setAttribute('lang', 'en');
    document.body.setAttribute('dir', 'ltr');
    langEnBtn.classList.add('active');
    langArBtn.classList.remove('active');
  }
}

langEnBtn.addEventListener('click', () => setLanguage('en'));
langArBtn.addEventListener('click', () => setLanguage('ar'));

// Navigation
const navLinks = document.querySelectorAll('.nav-links li');
const sections = document.querySelectorAll('.page-section');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const sectionId = link.getAttribute('data-section');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// CTA button scroll to offers
const ctaBtns = document.querySelectorAll('.cta-btn');
ctaBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks[2].classList.add('active'); // Offers
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('offers').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Dynamic Offers (sample data)
const offersData = {
  hajjUmrah: [
    { en: 'Hajj 2024 Premium Package', ar: 'باقة الحج المميزة 2024', descEn: 'Luxury accommodation, guided rituals, VIP transport.', descAr: 'إقامة فاخرة، مناسك بإشراف مرشدين، نقل VIP.' },
    { en: 'Umrah Family Special', ar: 'عرض العمرة للعائلات', descEn: 'Family-friendly, group discounts, spiritual guidance.', descAr: 'مناسب للعائلات، خصومات جماعية، إرشاد روحي.' }
  ],
  tourism: [
    { en: 'Magical Jordan Tour', ar: 'جولة الأردن الساحرة', descEn: 'Petra, Dead Sea, Wadi Rum adventures.', descAr: 'البتراء، البحر الميت، مغامرات وادي رم.' },
    { en: 'Discover Turkey', ar: 'اكتشف تركيا', descEn: 'Istanbul, Cappadocia, Bosphorus cruise.', descAr: 'إسطنبول، كابادوكيا، رحلة البوسفور.' }
  ]
};

function renderOffers() {
  const lang = html.getAttribute('lang') || 'en';
  // Hajj & Umrah
  const hajjList = document.getElementById('hajj-umrah-offers');
  hajjList.innerHTML = '';
  offersData.hajjUmrah.forEach(offer => {
    const div = document.createElement('div');
    div.className = 'offer-card';
    div.innerHTML = `<h4>${offer[lang]}</h4><p>${lang === 'ar' ? offer.descAr : offer.descEn}</p>`;
    hajjList.appendChild(div);
  });
  // Tourism
  const tourismList = document.getElementById('tourism-offers');
  tourismList.innerHTML = '';
  offersData.tourism.forEach(offer => {
    const div = document.createElement('div');
    div.className = 'offer-card';
    div.innerHTML = `<h4>${offer[lang]}</h4><p>${lang === 'ar' ? offer.descAr : offer.descEn}</p>`;
    tourismList.appendChild(div);
  });
}

// Testimonials (sample data)
const testimonialsData = [
  { en: 'A truly magical experience! Highly recommended.', ar: 'تجربة ساحرة حقًا! أنصح بها بشدة.', nameEn: 'Sarah A.', nameAr: 'سارة أ.' },
  { en: 'Professional, caring, and inspiring team.', ar: 'فريق محترف وملهم ويهتم بالتفاصيل.', nameEn: 'Mohammed K.', nameAr: 'محمد ك.' }
];

function renderTestimonials() {
  const lang = html.getAttribute('lang') || 'en';
  const list = document.querySelector('.testimonials-list');
  list.innerHTML = '';
  testimonialsData.forEach(t => {
    const div = document.createElement('div');
    div.className = 'testimonial';
    div.innerHTML = `<p>${t[lang]}</p><span>- ${lang === 'ar' ? t.nameAr : t.nameEn}</span>`;
    list.appendChild(div);
  });
}

// D3.js Visualizations
function renderD3Offers() {
  // Hajj & Umrah D3
  const hajjD3 = d3.select('#hajj-umrah-d3');
  hajjD3.selectAll('*').remove();
  const w = 220, h = 100;
  const svg = hajjD3.append('svg').attr('width', w).attr('height', h);
  svg.selectAll('circle')
    .data([40, 60, 80])
    .enter()
    .append('circle')
    .attr('cx', (d, i) => 60 + i * 60)
    .attr('cy', h / 2)
    .attr('r', d => d / 4)
    .attr('fill', (d, i) => ['#e0b973', '#fff', '#1e3a5c'][i])
    .attr('opacity', 0.7)
    .transition().duration(1200).attr('r', d => d / 2);

  // Tourism D3
  const tourismD3 = d3.select('#tourism-d3');
  tourismD3.selectAll('*').remove();
  const svg2 = tourismD3.append('svg').attr('width', w).attr('height', h);
  svg2.selectAll('rect')
    .data([30, 50, 70])
    .enter()
    .append('rect')
    .attr('x', (d, i) => 30 + i * 60)
    .attr('y', d => h - d)
    .attr('width', 30)
    .attr('height', 0)
    .attr('fill', (d, i) => ['#1e3a5c', '#e0b973', '#fff'][i])
    .attr('opacity', 0.7)
    .transition().duration(1200)
    .attr('height', d => d);
}

// Map placeholder
function renderMap() {
  const map = document.getElementById('map');
  map.innerHTML = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3623.123456789!2d46.675295!3d24.713552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f038c1234567%3A0x123456789abcdef!2sRiyadh!5e0!3m2!1sen!2ssa!4v1710000000000!5m2!1sen!2ssa" width="100%" height="100%" style="border:0; border-radius:1rem;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
}

// Contact form
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert(html.getAttribute('lang') === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent!');
    contactForm.reset();
  });
}

// Initial render
function renderAll() {
  renderOffers();
  renderTestimonials();
  renderD3Offers();
  renderMap();
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  setLanguage('en');
  animateHeadline();
  initCarousel();
  initOffersTabs();
  renderOffersD3();
});

// Re-render on language change
langEnBtn.addEventListener('click', renderAll);
langArBtn.addEventListener('click', renderAll);

// Animated headline typing effect
function animateHeadline() {
  const headline = document.querySelector('.animated-headline .en');
  if (!headline) return;
  const text = 'Al Ard AlMubaraka';
  let i = 0;
  headline.textContent = '';
  function type() {
    if (i < text.length) {
      headline.textContent += text[i];
      i++;
      setTimeout(type, 80);
    }
  }
  type();
}

// Carousel gallery logic
function initCarousel() {
  const track = document.querySelector('.carousel-track');
  const imgs = track ? Array.from(track.children) : [];
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  let idx = 0;
  function show(idxNew) {
    if (!track) return;
    idx = (idxNew + imgs.length) % imgs.length;
    track.style.transform = `translateX(-${idx * (imgs[0].offsetWidth + 24)}px)`;
  }
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => show(idx - 1);
    nextBtn.onclick = () => show(idx + 1);
  }
  window.addEventListener('resize', () => show(idx));
  show(0);
}

// Offers tabbed interface
function initOffersTabs() {
  const tabs = document.querySelectorAll('.offers-tab');
  const hajjGrid = document.querySelector('.hajj-umrah-grid');
  const tourismGrid = document.querySelector('.tourism-grid');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'hajj-umrah') {
        hajjGrid.style.display = '';
        tourismGrid.style.display = 'none';
      } else {
        hajjGrid.style.display = 'none';
        tourismGrid.style.display = '';
      }
    };
  });
}

// D3.js sidebar chart for offers
function renderOffersD3() {
  const d3Container = document.getElementById('offers-d3');
  if (!d3Container) return;
  d3Container.innerHTML = '';
  const data = [
    { month: 'Jan', value: 20 },
    { month: 'Feb', value: 30 },
    { month: 'Mar', value: 45 },
    { month: 'Apr', value: 60 },
    { month: 'May', value: 80 },
    { month: 'Jun', value: 120 },
    { month: 'Jul', value: 160 },
    { month: 'Aug', value: 140 },
    { month: 'Sep', value: 100 },
    { month: 'Oct', value: 60 },
    { month: 'Nov', value: 40 },
    { month: 'Dec', value: 30 }
  ];
  const w = 220, h = 120, pad = 24;
  const svg = d3.select(d3Container).append('svg').attr('width', w).attr('height', h);
  const x = d3.scaleBand().domain(data.map(d => d.month)).range([pad, w-pad]).padding(0.15);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([h-pad, pad]);
  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => x(d.month))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => h-pad - y(d.value))
    .attr('fill', '#e0b973')
    .attr('rx', 5)
    .attr('opacity', 0.85);
  svg.selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .attr('x', d => x(d.month) + x.bandwidth()/2)
    .attr('y', d => y(d.value) - 6)
    .attr('text-anchor', 'middle')
    .attr('font-size', '0.8rem')
    .attr('fill', '#1e3a5c')
    .text(d => d.value);
}

// Animation on scroll for fade/slide-in
function animateOnScroll() {
  const fadeEls = document.querySelectorAll('.animate-fadein, .animate-slidein');
  fadeEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add('animated-in');
    }
  });
}
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('DOMContentLoaded', animateOnScroll);

// Auto-scroll for customer stories slider
function autoScrollStories() {
  const slider = document.querySelector('.stories-slider');
  if (!slider) return;
  let scrollAmount = 0;
  let direction = 1;
  setInterval(() => {
    if (slider.scrollWidth - slider.clientWidth <= 0) return;
    if (direction === 1 && scrollAmount >= slider.scrollWidth - slider.clientWidth - 10) direction = -1;
    if (direction === -1 && scrollAmount <= 0) direction = 1;
    scrollAmount += direction * 340;
    slider.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  }, 3500);
}
window.addEventListener('DOMContentLoaded', autoScrollStories); 