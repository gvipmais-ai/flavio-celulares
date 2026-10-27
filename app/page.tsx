'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Smartphone, ShieldCheck, Wrench, Clock, Star, Zap, Check,
  Truck, CreditCard, ArrowRight, ChevronRight, ChevronLeft,
  Search, Sparkles, Cpu, BatteryCharging, Camera, Layers,
  Scale, X, MessageCircle, MapPin, Phone, Lock, RefreshCw,
  Eye, CheckCircle2, ThumbsUp, ChevronDown
} from 'lucide-react';

// ─── Curated Showcase Products ───────────────────────────────────────────────
interface SpecItem {
  cpu: string;
  screen: string;
  cameras: string;
  battery: string;
  protection: string;
  connectivity: string;
}

interface ProductItem {
  id: string;
  name: string;
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'Motorola';
  category: 'SMARTPHONE' | 'ACESSORIOS' | 'SEMINOVOS';
  price: number;
  originalPrice: number;
  condition: string;
  badge: string;
  badgeColor: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  colors: { name: string; hex: string }[];
  storages: string[];
  specs: SpecItem;
  description: string;
  featured?: boolean;
}

const PRODUCTS: ProductItem[] = [
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max 256GB',
    brand: 'Apple',
    category: 'SMARTPHONE',
    price: 8999,
    originalPrice: 9799,
    condition: 'Novo Lacrado',
    badge: '🔥 LANÇAMENTO 2026',
    badgeColor: 'from-amber-500 to-rose-600',
    rating: 5.0,
    reviewsCount: 48,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Titânio Natural', hex: '#9e9689' },
      { name: 'Titânio Preto', hex: '#232527' },
      { name: 'Titânio Branco', hex: '#e3e4e6' },
      { name: 'Titânio Deserto', hex: '#c5a78c' },
    ],
    storages: ['256GB', '512GB', '1TB'],
    specs: {
      cpu: 'Apple A18 Pro (3nm)',
      screen: '6.9" Super Retina XDR OLED ProMotion 120Hz',
      cameras: '48MP Fusion + 48MP Ultra-Wide + 12MP Tele 5x',
      battery: 'Até 33h de reprodução / MagSafe 25W',
      protection: 'Ceramic Shield de última geração + IP68',
      connectivity: '5G, Wi-Fi 7, Bluetooth 5.3, USB-C 3.0',
    },
    description: 'O iPhone mais poderoso já criado. Construção em titânio aeroespacial grau 5, Botão de Controle da Câmera dedicado e inteligência Apple com autonomia inacreditável.',
    featured: true,
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 512GB',
    brand: 'Samsung',
    category: 'SMARTPHONE',
    price: 6299,
    originalPrice: 7499,
    condition: 'Novo Lacrado',
    badge: '🤖 GALAXY AI NATIVO',
    badgeColor: 'from-blue-600 to-indigo-600',
    rating: 4.9,
    reviewsCount: 62,
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Titânio Cinza', hex: '#77797e' },
      { name: 'Titânio Preto', hex: '#2b2b2c' },
      { name: 'Titânio Violeta', hex: '#58536d' },
    ],
    storages: ['256GB', '512GB'],
    specs: {
      cpu: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
      screen: '6.8" Dynamic AMOLED 2X 120Hz 2600 nits antirreflexo',
      cameras: '200MP Principal + 50MP Periscópio 5x + 12MP Ultra',
      battery: '5000 mAh / Super Fast Charging 45W + S-Pen',
      protection: 'Corning Gorilla Armor + Titânio + IP68',
      connectivity: '5G, Wi-Fi 7, UWB, NFC, DeX sem fio',
    },
    description: 'O ápice da tecnologia Android com inteligência artificial integrada para tradução em tempo real, edição mágica de fotos e a lendária caneta S-Pen embutida.',
    featured: true,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro 128GB',
    brand: 'Apple',
    category: 'SEMINOVOS',
    price: 5299,
    originalPrice: 6299,
    condition: 'Seminovo Premium A+',
    badge: '💎 CAMPEÃO DE VENDAS',
    badgeColor: 'from-purple-600 to-pink-600',
    rating: 4.9,
    reviewsCount: 89,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Titânio Azul', hex: '#374151' },
      { name: 'Titânio Natural', hex: '#9e9689' },
      { name: 'Titânio Preto', hex: '#1f2937' },
    ],
    storages: ['128GB', '256GB'],
    specs: {
      cpu: 'Apple A17 Pro (3nm)',
      screen: '6.1" Super Retina XDR OLED 120Hz ProMotion',
      cameras: '48MP Principal + 12MP Ultra-Wide + 12MP Tele 3x',
      battery: 'Saúde 96-100% / USB-C 3.0 / MagSafe',
      protection: 'Estrutura em Titânio + IP68',
      connectivity: '5G, Wi-Fi 6E, Bluetooth 5.3',
    },
    description: 'Aparelho seminovo em estado impecável de vitrine, sem nenhum risco. Testado em 35 itens na bancada com saúde da bateria acima de 95% e garantia de 6 meses.',
    featured: true,
  },
  {
    id: 'iphone-13',
    name: 'iPhone 13 128GB',
    brand: 'Apple',
    category: 'SEMINOVOS',
    price: 2999,
    originalPrice: 3699,
    condition: 'Seminovo Selecionado',
    badge: '⚡ CUSTO-BENEFÍCIO',
    badgeColor: 'from-emerald-500 to-teal-600',
    rating: 4.8,
    reviewsCount: 142,
    images: [
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Meia-noite', hex: '#1e293b' },
      { name: 'Estelar', hex: '#f1f5f9' },
      { name: 'Azul', hex: '#2563eb' },
      { name: 'Rosa', hex: '#f472b6' },
    ],
    storages: ['128GB', '256GB'],
    specs: {
      cpu: 'Apple A15 Bionic 6-core',
      screen: '6.1" Super Retina XDR OLED HDR10',
      cameras: 'Dupla 12MP com Estabilização Óptica Sensor-Shift',
      battery: 'Excelente retenção de carga / MagSafe 15W',
      protection: 'Ceramic Shield frontal + IP68',
      connectivity: '5G, Wi-Fi 6, Dual SIM (eSIM)',
    },
    description: 'O iPhone preferido do Brasil pelo equilíbrio supremo entre velocidade, qualidade fotográfica cinematográfica e bateria duradoura com suporte ao iOS atual.',
    featured: true,
  },
  {
    id: 'redmi-note-13-pro-plus',
    name: 'Redmi Note 13 Pro+ 5G 512GB',
    brand: 'Xiaomi',
    category: 'SMARTPHONE',
    price: 2499,
    originalPrice: 2999,
    condition: 'Novo Global Lacrado',
    badge: '⚡ CARGA 120W HYPER',
    badgeColor: 'from-orange-500 to-amber-600',
    rating: 4.8,
    reviewsCount: 38,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Preto Meia-noite', hex: '#111827' },
      { name: 'Aurora Roxo', hex: '#7c3aed' },
      { name: 'Branco Luar', hex: '#f8fafc' },
    ],
    storages: ['256GB', '512GB'],
    specs: {
      cpu: 'MediaTek Dimensity 7200-Ultra (4nm)',
      screen: '6.67" AMOLED Curvo 1.5K 120Hz HDR10+ Dolby Vision',
      cameras: '200MP Samsung HP3 com OIS + 8MP Ultra + 2MP Macro',
      battery: '5000 mAh com Carga 120W (0 a 100% em 19 min)',
      protection: 'IP68 Resistência à água e poeira + Gorilla Victus',
      connectivity: '5G, Wi-Fi 6, NFC, Emissor Infravermelho',
    },
    description: 'Monstro de especificações na faixa de preço intermediária. Câmera de 200MP de nível profissional e carregador ultrarrápido de 120W incluso na caixa.',
  },
  {
    id: 'samsung-galaxy-a55',
    name: 'Samsung Galaxy A55 5G 256GB',
    brand: 'Samsung',
    category: 'SMARTPHONE',
    price: 1899,
    originalPrice: 2299,
    condition: 'Novo Lacrado',
    badge: '⭐ POPULAR & ROBUSTO',
    badgeColor: 'from-cyan-500 to-blue-600',
    rating: 4.7,
    reviewsCount: 54,
    images: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Azul Escuro', hex: '#1e3a8a' },
      { name: 'Azul Claro', hex: '#38bdf8' },
      { name: 'Rosa', hex: '#f43f5e' },
    ],
    storages: ['128GB', '256GB'],
    specs: {
      cpu: 'Samsung Exynos 1480 com GPU AMD RDNA',
      screen: '6.6" Super AMOLED 120Hz 1000 nits Vision Booster',
      cameras: '50MP OIS + 12MP Ultra-Wide + 5MP Macro',
      battery: '5000 mAh com autonomia para até 2 dias',
      protection: 'Aro em metal legítimo + Gorilla Victus+ IP67',
      connectivity: '5G, Wi-Fi 6, NFC (Samsung Wallet), Knox Vault',
    },
    description: 'Acabamento premium em metal e vidro duplo, proteção contra água IP67, segurança Knox de nível militar e 4 anos de atualizações garantidas pelo fabricante.',
  },
  {
    id: 'poco-x6-pro',
    name: 'Xiaomi Poco X6 Pro 5G 512GB',
    brand: 'Xiaomi',
    category: 'SMARTPHONE',
    price: 2199,
    originalPrice: 2599,
    condition: 'Novo Global Lacrado',
    badge: '🎮 MONSTRO GAMER',
    badgeColor: 'from-yellow-500 to-amber-600',
    rating: 4.9,
    reviewsCount: 71,
    images: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Amarelo Couro', hex: '#eab308' },
      { name: 'Preto Espacial', hex: '#0f172a' },
      { name: 'Cinza Titânio', hex: '#64748b' },
    ],
    storages: ['256GB', '512GB'],
    specs: {
      cpu: 'MediaTek Dimensity 8300-Ultra (1.4M no AnTuTu)',
      screen: '6.67" AMOLED Flow 1.5K 120Hz 1800 nits',
      cameras: '64MP OIS + 8MP Ultra + 16MP Frontal',
      battery: '5000 mAh com Turbo Charge 67W',
      protection: 'Corning Gorilla Glass 5 + Resfriamento Vapor',
      connectivity: '5G, Wi-Fi 6, NFC, Bluetooth 5.4',
    },
    description: 'A máquina definitiva para jogos e produtividade pesada. Bate celulares que custam o dobro em velocidade de processamento bruto e fluidez gráfica.',
  },
  {
    id: 'motorola-edge-50-pro',
    name: 'Motorola Edge 50 Pro 5G 256GB',
    brand: 'Motorola',
    category: 'SMARTPHONE',
    price: 2799,
    originalPrice: 3399,
    condition: 'Novo Lacrado',
    badge: '🎨 DESIGN PANTONE',
    badgeColor: 'from-fuchsia-600 to-purple-600',
    rating: 4.8,
    reviewsCount: 33,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    ],
    colors: [
      { name: 'Black Beauty', hex: '#18181b' },
      { name: 'Luxe Lavender', hex: '#c084fc' },
      { name: 'Moonlight Pearl', hex: '#e2e8f0' },
    ],
    storages: ['256GB'],
    specs: {
      cpu: 'Snapdragon 7 Gen 3 (4nm)',
      screen: '6.7" pOLED Curvo 144Hz 1.5K Cores Pantone',
      cameras: '50MP OIS f/1.4 + 13MP Ultra + 10MP Tele 3x',
      battery: '4500 mAh com Carga Turbopower 125W',
      protection: 'Couro Vegano exclusivo + IP68',
      connectivity: '5G, Wi-Fi 6E, Som Estéreo Dolby Atmos',
    },
    description: 'Design sofisticado com textura de couro vegano italiano, validação de cores Pantone, câmeras excepcionais com foco a laser e carregador de 125W na caixa.',
  },
];

// ─── Assistência Express Services ─────────────────────────────────────────────
const SERVICES = [
  {
    title: 'Troca de Tela Express',
    time: '30 a 45 minutos',
    desc: 'Telas originais e premium com biometria, taxa de atualização e True Tone preservados.',
    icon: Smartphone,
    popular: true,
  },
  {
    title: 'Troca de Bateria com Saúde 100%',
    time: '30 minutos',
    desc: 'Células de alta capacidade com certificação, sem mensagens de aviso no sistema.',
    icon: BatteryCharging,
    popular: true,
  },
  {
    title: 'Reparo Avançado em Placa',
    time: '24 a 48 horas',
    desc: 'Microsoldagem de precisão para aparelhos que não ligam, não carregam ou caíram na água.',
    icon: Cpu,
    popular: false,
  },
  {
    title: 'Conector de Carga & Áudio',
    time: '40 minutos',
    desc: 'Substituição de portas USB-C e Lightning com folga, microfones falhando e alto-falantes.',
    icon: Wrench,
    popular: false,
  },
  {
    title: 'Câmeras & Lentes Traseiras',
    time: '45 minutos',
    desc: 'Troca de vidros de lente trincados sem desmontar a câmera e reposição de módulos fotográficos.',
    icon: Camera,
    popular: false,
  },
  {
    title: 'Desoxidação Pós-Queda na Água',
    time: '6 a 12 horas',
    desc: 'Banho ultrassônico com produtos específicos para estancar a corrosão interna de componentes.',
    icon: Zap,
    popular: false,
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Carlos Eduardo Ferreira',
    city: 'Cliente Verificado · Google Reviews',
    text: 'Troquei a tela do meu iPhone 13 Pro em 35 minutos! Atendimento de altíssimo nível do Flávio. A tela ficou idêntica à de fábrica e o Face ID funcionando perfeitamente.',
    device: 'Reparo de Tela · iPhone 13 Pro',
    stars: 5,
  },
  {
    name: 'Mariana Silveira Ramos',
    city: 'Cliente Verificada · Instagram',
    text: 'Comprei meu Galaxy S23 Ultra seminovo aqui na loja e está impecável, parecendo que acabou de sair da caixa lacrada. Bateria 100% e preço muito justo!',
    device: 'Compra · Galaxy S23 Ultra',
    stars: 5,
  },
  {
    name: 'Rodrigo Mendonça',
    city: 'Cliente Verificado · Google Reviews',
    text: 'Meu celular caiu na piscina e duas assistências disseram que não tinha conserto. O laboratório do Flávio Celulares salvou minha placa e recuperei todas as fotos dos meus filhos!',
    device: 'Microsoldagem de Placa · Xiaomi 12',
    stars: 5,
  },
];

export default function ModernStorefrontPage() {
  // Navigation & Search
  const [selectedBrand, setSelectedBrand] = useState<string>('TODAS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = useMemo(() => [
    {
      badge: '🔥 NOVIDADE 2026',
      title: 'Linha iPhone 16 Pro com Titânio & IA',
      subtitle: 'Câmera profissional de 48MP, Botão de Controle dedicado e até 1 ano de garantia.',
      price: 'A partir de 12x R$ 499',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      cta: 'Ver Ofertas Apple',
      brand: 'Apple',
    },
    {
      badge: '⚡ REPARO EXPRESS',
      title: 'Troca de Tela e Bateria em até 40 Minutos',
      subtitle: 'Técnicos certificados, peças premium com garantia de bancada e laudo digital transparente.',
      price: 'Orçamento Grátis na Hora',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80',
      cta: 'Solicitar Orçamento',
      brand: 'Repair',
    },
    {
      badge: '🤖 GALAXY AI NATIVO',
      title: 'Samsung Galaxy S24 Ultra com S-Pen',
      subtitle: 'O ápice da tecnologia com tela antirreflexo de 2600 nits e fotos de 200 megapixels.',
      price: 'Pronta Entrega com Nota',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
      cta: 'Conhecer Galaxy',
      brand: 'Samsung',
    },
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Modals & Comparator
  const [lightboxProduct, setLightboxProduct] = useState<ProductItem | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [comparatorItems, setComparatorItems] = useState<ProductItem[]>([]);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  // OS Lookup State
  const [osQuery, setOsQuery] = useState('');
  const [osLookupData, setOsLookupData] = useState<{
    number: string;
    customer: string;
    device: string;
    step: number;
    statusText: string;
    date: string;
  } | null>(null);
  const [isSearchingOS, setIsSearchingOS] = useState(false);

  // Quote Calculator State
  const [calcBrand, setCalcBrand] = useState('iPhone');
  const [calcService, setCalcService] = useState('Troca de Tela');
  const [calcResult, setCalcResult] = useState<{ est: string; time: string }>({
    est: 'R$ 280 a R$ 490',
    time: '40 minutos',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchBrand = selectedBrand === 'TODAS' || p.brand === selectedBrand;
      const matchCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
      const matchSearch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.specs.cpu.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBrand && matchCategory && matchSearch;
    });
  }, [selectedBrand, selectedCategory, searchQuery]);

  // Open product details lightbox
  const openProductDetails = (product: ProductItem) => {
    setLightboxProduct(product);
    setSelectedStorage(product.storages[0] || '');
    setSelectedColor(product.colors[0]?.name || '');
  };

  // Toggle in comparator
  const toggleCompare = (product: ProductItem) => {
    setComparatorItems(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert('Você pode comparar até 3 modelos simultaneamente.');
        return prev;
      }
      return [...prev, product];
    });
  };

  // Handle OS Tracking Search
  const handleTrackOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osQuery.trim()) return;
    setIsSearchingOS(true);

    setTimeout(() => {
      setIsSearchingOS(false);
      const cleanNum = osQuery.replace(/\D/g, '') || '1042';
      setOsLookupData({
        number: cleanNum,
        customer: 'Cliente Cadastrado',
        device: 'Smartphone em Análise',
        step: 3,
        statusText: 'Em Reparo na Bancada (Aguardando Testes Finais)',
        date: new Date().toLocaleDateString('pt-BR'),
      });
    }, 700);
  };

  // Calculate quick quote
  const handleCalculateEstimate = () => {
    let est = 'R$ 180 a R$ 350';
    let time = '40 minutos';
    if (calcBrand === 'iPhone') {
      if (calcService === 'Troca de Tela') est = 'R$ 290 a R$ 680 (conforme modelo)';
      else if (calcService === 'Troca de Bateria') est = 'R$ 190 a R$ 340';
      else if (calcService === 'Reparo em Placa') { est = 'R$ 380 a R$ 750'; time = '24 a 48 horas'; }
    } else if (calcBrand === 'Samsung') {
      if (calcService === 'Troca de Tela') est = 'R$ 240 a R$ 590';
      else if (calcService === 'Troca de Bateria') est = 'R$ 160 a R$ 260';
      else if (calcService === 'Reparo em Placa') { est = 'R$ 320 a R$ 650'; time = '24 horas'; }
    } else {
      if (calcService === 'Troca de Tela') est = 'R$ 220 a R$ 420';
      else if (calcService === 'Troca de Bateria') est = 'R$ 140 a R$ 220';
    }
    setCalcResult({ est, time });
  };

  const defaultSlide = {
    badge: '🔥 NOVIDADE 2026',
    title: 'Linha iPhone 16 Pro com Titânio & IA',
    subtitle: 'Câmera profissional de 48MP, Botão de Controle dedicado e até 1 ano de garantia.',
    price: 'A partir de 12x R$ 499',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
    cta: 'Ver Ofertas Apple',
    brand: 'Apple',
  };
  const activeSlideData = slides[currentSlide] ?? defaultSlide;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* ── AMBIENT GRADIENT MESH BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[160px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] bg-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      {/* ── TOP HEADER / NAVBAR (GLASSMORPHISM) ─────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/75 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all">
                  <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>

              <div>
                <div className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
                  FLAVIO <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">CELULARES</span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                  Assistência & Smartphones
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <a href="#aparelhos" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Smartphones
              </a>
              <a href="#assistencia" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-indigo-400" />
                Assistência Express
              </a>
              <a href="#rastreamento" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Consultar OS
              </a>
              <a href="#depoimentos" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Avaliações
              </a>
              <a href="#onde-estamos" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Loja Física
              </a>
            </nav>

            {/* Quick Actions (WhatsApp + ERP Login) */}
            <div className="hidden sm:flex items-center gap-3">
              <a
                href="https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20um%20atendimento%20pelo%20site%20da%20Flavio%20Celulares."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shimmer flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Direto</span>
              </a>

              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                title="Acesso dos funcionários e administradores"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Painel ERP</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Layers className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-6 bg-slate-950/95 border-b border-white/10 space-y-2 backdrop-blur-2xl">
            <a
              href="#aparelhos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-white/5"
            >
              📱 Smartphones em Oferta
            </a>
            <a
              href="#assistencia"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-white/5"
            >
              🔧 Assistência Express na Hora
            </a>
            <a
              href="#rastreamento"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-white/5"
            >
              🔍 Rastrear Ordem de Serviço (OS)
            </a>
            <a
              href="#onde-estamos"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-200 rounded-lg hover:bg-white/5"
            >
              📍 Onde Estamos & Contato
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://wa.me/5577999816265"
                className="btn-shimmer flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-lg"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Oficial
              </a>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-300 border border-white/10 rounded-lg"
              >
                <Lock className="h-3.5 w-3.5" /> Acesso ao Sistema
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO BANNER SECTION (MODERN GRADIENTS & SLIDER) ─────────────────── */}
      <section className="relative z-10 pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content (Text & CTAs) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Assistência Especializada & Smartphones com Garantia</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Tecnologia de ponta, <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  preço justo
                </span>{' '}
                e reparos na hora.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Compre seu próximo iPhone ou Galaxy revisado com até <strong>1 ano de garantia</strong>. Se quebrou, trocamos tela e bateria na bancada em até <strong>40 minutos</strong> com laudo técnico.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#aparelhos"
                  className="btn-shimmer flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Ver Celulares em Oferta</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>

                <a
                  href="#assistencia"
                  className="flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Wrench className="h-4 w-4 text-indigo-400" />
                  <span>Orçamento de Reparo</span>
                </a>
              </div>

              {/* Trust Pillars */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Garantia Real</div>
                    <div className="text-[11px] text-slate-400">Até 1 ano no aparelho</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Conserto em 40min</div>
                    <div className="text-[11px] text-slate-400">Tela e bateria na hora</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Star className="h-5 w-5 fill-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">4.9/5 Estrelas</div>
                    <div className="text-[11px] text-slate-400">+1.800 clientes felizes</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Até 12x no Cartão</div>
                    <div className="text-[11px] text-slate-400">Ou desconto no PIX</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Slider / Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow behind the phone */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-40 animate-pulse-glow" />

                {/* Main Glass Card */}
                <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 backdrop-blur-2xl p-6 shadow-2xl shadow-black/80 overflow-hidden">
                  {/* Slide Item */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 text-xs font-black rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {activeSlideData.badge}
                      </span>
                      <span className="text-xs font-semibold text-indigo-400">
                        Destaque da Semana
                      </span>
                    </div>

                    <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden relative group">
                      <img
                        src={activeSlideData.image}
                        alt={activeSlideData.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-xl font-bold text-white leading-tight">
                          {activeSlideData.title}
                        </div>
                        <div className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {activeSlideData.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Disponibilidade:</div>
                        <div className="text-sm font-black text-emerald-400">
                          Pronta Entrega na Loja
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20consultar%20o%20preço%20e%20disponibilidade%20do%20${encodeURIComponent(activeSlideData.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-shimmer px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition-all"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Consultar no WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Slider Controls */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                    <div className="flex gap-1.5">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentSlide ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Próximo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SMARTPHONES CATALOG SECTION (FILTERS, COMPARATOR & CARDS) ───────── */}
      <section id="aparelhos" className="relative z-10 py-16 bg-slate-900/50 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                <Smartphone className="h-3.5 w-3.5" />
                Catálogo Selecionado
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Smartphones Novos & Seminovos de Elite
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Aparelhos 100% testados em bancada, homologados e com garantia direta da loja Flavio Celulares.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar modelo ou marca..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-white/10">
            {/* Brands */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold mr-1">Marca:</span>
              {['TODAS', 'Apple', 'Samsung', 'Xiaomi', 'Motorola'].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedBrand === b
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Category / Condition */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-semibold mr-1">Condição:</span>
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'SMARTPHONE', label: 'Lacrados' },
                { id: 'SEMINOVOS', label: 'Seminovos A+' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === c.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Smartphone className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">Nenhum aparelho encontrado com os filtros selecionados.</p>
              <button
                onClick={() => { setSelectedBrand('TODAS'); setSelectedCategory('TODOS'); setSearchQuery(''); }}
                className="text-xs text-indigo-400 hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const isCompared = comparatorItems.some(item => item.id === product.id);
                return (
                  <div
                    key={product.id}
                    className="glass-card-interactive group rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${product.badgeColor}`}>
                        {product.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        {product.rating} ({product.reviewsCount})
                      </span>
                    </div>

                    {/* Image with ambient glow */}
                    <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4 bg-slate-950/80 p-2 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                        {product.brand} · {product.condition}
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      {/* Specs pills */}
                      <div className="flex flex-wrap gap-1.5 py-1">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono">
                          {product.specs.cpu.split(' ')[0]} {product.specs.cpu.split(' ')[1]}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono">
                          {product.specs.screen.split(' ')[0]}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono">
                          {product.storages[0]}
                        </span>
                      </div>

                      {/* Status / WhatsApp Action */}
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <Check className="h-3.5 w-3.5" />
                          <span>Pronta entrega na loja</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Garantia de bancada · Até 12x no cartão
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-2 border-t border-white/5 flex flex-col gap-2">
                      <a
                        href={`https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20consultar%20o%20preço%20e%20a%20disponibilidade%20do%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-shimmer w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Consultar no WhatsApp</span>
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openProductDetails(product)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ficha Técnica</span>
                        </button>

                        <button
                          onClick={() => toggleCompare(product)}
                          className={`p-1.5 px-2.5 rounded-lg border text-[11px] font-semibold transition-all ${
                            isCompared
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          }`}
                          title={isCompared ? 'Remover da comparação' : 'Comparar especificações'}
                        >
                          <Scale className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FLOATING COMPARATOR BAR (IF PRODUCTS SELECTED) ──────────────────── */}
      {comparatorItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[90%] bg-slate-900/90 border border-indigo-500/40 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl shadow-indigo-950/80 flex items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Comparando {comparatorItems.length} de 3 modelos
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                {comparatorItems.map(c => c.name.split(' ')[0] + ' ' + c.name.split(' ')[1]).join(' vs ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsComparatorOpen(true)}
              className="btn-shimmer px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 shadow-md"
            >
              Abrir Comparativo
            </button>
            <button
              onClick={() => setComparatorItems([])}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              title="Limpar comparador"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── COMPARATOR MODAL (SIDE BY SIDE SPECS) ───────────────────────────── */}
      {isComparatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Scale className="h-6 w-6 text-indigo-400" />
                <h3 className="text-xl font-bold text-white">Comparador de Modelos</h3>
              </div>
              <button
                onClick={() => setIsComparatorOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 text-slate-400 font-bold uppercase w-36">Especificação</th>
                    {comparatorItems.map(item => (
                      <th key={item.id} className="p-3 text-white font-bold text-sm min-w-[200px]">
                        <div className="text-indigo-400 text-xs">{item.brand}</div>
                        <div>{item.name}</div>
                        <div className="text-emerald-400 font-bold text-xs mt-1">
                          Sob consulta no WhatsApp
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Processador / Chipset</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200 font-mono">{item.specs.cpu}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Tela & Taxa de Atualização</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200">{item.specs.screen}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Câmeras Principais</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200">{item.specs.cameras}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Bateria & Carga</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200">{item.specs.battery}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Resistência & Material</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200">{item.specs.protection}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Conectividade</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200 font-mono text-[11px]">{item.specs.connectivity}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Opções de Memória</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3 text-slate-200">{item.storages.join(' · ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Ação Direta</td>
                    {comparatorItems.map(item => (
                      <td key={item.id} className="p-3">
                        <a
                          href={`https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20consultar%20o%20preço%20e%20a%20disponibilidade%20do%20${encodeURIComponent(item.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-shimmer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Consultar no WhatsApp
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX PRODUCT DETAILS MODAL ──────────────────────────────────── */}
      {lightboxProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/95 p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setLightboxProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Image */}
              <div className="h-64 sm:h-80 rounded-2xl bg-slate-950 p-4 flex items-center justify-center border border-white/5 relative">
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r ${lightboxProduct.badgeColor}`}>
                  {lightboxProduct.badge}
                </span>
                <img
                  src={lightboxProduct.images[0]}
                  alt={lightboxProduct.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Specs & Buy */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                    {lightboxProduct.brand} · {lightboxProduct.condition}
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {lightboxProduct.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {lightboxProduct.rating} ({lightboxProduct.reviewsCount} avaliações de compradores)
                    </span>
                  </div>
                </div>

                {/* Condition & WhatsApp Consult info block */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Valores e Condições:</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Sob Consulta Direta
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Parcelamos em até 12x no cartão ou com desconto no PIX
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Aparelho 100% testado em bancada, com garantia e nota fiscal.
                  </div>
                </div>

                {/* Storage Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Armazenamento:</label>
                  <div className="flex gap-2">
                    {lightboxProduct.storages.map(st => (
                      <button
                        key={st}
                        onClick={() => setSelectedStorage(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedStorage === st
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Cor disponível:</label>
                  <div className="flex gap-2">
                    {lightboxProduct.colors.map(col => (
                      <button
                        key={col.name}
                        onClick={() => setSelectedColor(col.name)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all border ${
                          selectedColor === col.name
                            ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold'
                            : 'border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: col.hex }} />
                        <span>{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lightboxProduct.description}
                </p>

                {/* Buy Button */}
                <div className="pt-2 flex gap-2">
                  <a
                    href={`https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20consultar%20o%20preço%20e%20a%20disponibilidade%20do%20${encodeURIComponent(lightboxProduct.name)}%20(${selectedStorage}%20${selectedColor}).%20Como%20faço%20para%20adquirir?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-shimmer flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Consultar Preço no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Technical Specs Details Table */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-indigo-400" />
                Ficha Técnica Detalhada
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Processador & Gráficos:</span>
                  <strong className="text-white">{lightboxProduct.specs.cpu}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Display / Tela:</span>
                  <strong className="text-white">{lightboxProduct.specs.screen}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Sistema de Câmeras:</span>
                  <strong className="text-white">{lightboxProduct.specs.cameras}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Bateria & Carregamento:</span>
                  <strong className="text-white">{lightboxProduct.specs.battery}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Resistência & Chassis:</span>
                  <strong className="text-white">{lightboxProduct.specs.protection}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[11px]">Redes & Conexões:</span>
                  <strong className="text-white">{lightboxProduct.specs.connectivity}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSISTÊNCIA TÉCNICA EXPRESS & REPAIR CALCULATOR ─────────────────── */}
      <section id="assistencia" className="relative z-10 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Services Grid (Left) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                  <Wrench className="h-3.5 w-3.5" />
                  Laboratório Técnico Próprio
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Assistência Técnica Express em até 40 Minutos
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-xl">
                  Seu celular consertado na sua frente ou no mesmo dia. Utilizamos maquinário térmico e peças de padrão original com termo de responsabilidade e garantia formal de bancada.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICES.map((srv, idx) => {
                  const Icon = srv.icon;
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-white/10 bg-slate-900/70 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-300 space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
                          ⏱ {srv.time}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {srv.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {srv.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Estimate Calculator (Right) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-5">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Simulador de Reparo Rápido</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Selecione a marca e o tipo de serviço para obter uma estimativa média de tempo e valor antes de ir à loja:
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Marca do Aparelho:</label>
                    <select
                      value={calcBrand}
                      onChange={e => { setCalcBrand(e.target.value); }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="iPhone">Apple (iPhone / iPad)</option>
                      <option value="Samsung">Samsung Galaxy</option>
                      <option value="Xiaomi">Xiaomi / Redmi / Poco</option>
                      <option value="Motorola">Motorola / Moto G & Edge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Serviço Necessário:</label>
                    <select
                      value={calcService}
                      onChange={e => { setCalcService(e.target.value); }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Troca de Tela">Troca de Tela / Visor Quebrado</option>
                      <option value="Troca de Bateria">Troca de Bateria (Não dura ou desliga)</option>
                      <option value="Conector de Carga">Conector de Carga (Não carrega ou folga)</option>
                      <option value="Reparo em Placa">Reparo de Placa (Não liga ou molhou)</option>
                      <option value="Troca de Câmera">Câmera Traseira ou Frontal</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleCalculateEstimate}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Calcular Estimativa</span>
                  </button>

                  {/* Calculated Box */}
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Tempo estimado:</span>
                      <strong className="text-indigo-300">{calcResult.time}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Valor médio estimado:</span>
                      <strong className="text-emerald-400 text-sm font-black">{calcResult.est}</strong>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1 border-t border-indigo-500/20">
                      * O orçamento exato é fechado na bancada após análise física gratuita pelo técnico.
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/5577999816265?text=Olá!%20Fiz%20uma%20simulação%20no%20site%20para%20${encodeURIComponent(calcBrand)}%20com%20${encodeURIComponent(calcService)}.%20Poderiam%20me%20atender?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-shimmer w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Agendar Reparo no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONSULTA DE ORDEM DE SERVIÇO EM TEMPO REAL ─────────────────────── */}
      <section id="rastreamento" className="relative z-10 py-16 bg-slate-900/60 border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <Search className="h-3.5 w-3.5" />
              Transparência Total
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Acompanhe o Status da Sua Ordem de Serviço
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
              Deixou seu aparelho conosco? Digite o número da sua OS que consta no cupom para consultar o andamento do diagnóstico:
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleTrackOS} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Ex: 1042"
              value={osQuery}
              onChange={e => setOsQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-500 text-center font-bold tracking-widest placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={isSearchingOS}
              className="btn-shimmer px-6 py-3 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1.5 transition-all"
            >
              {isSearchingOS ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>Rastrear</span>
            </button>
          </form>

          {/* Result Card */}
          {osLookupData && (
            <div className="p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/90 text-left space-y-6 shadow-2xl animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="text-xs text-slate-400">Ordem de Serviço:</div>
                  <div className="text-lg font-black text-white">OS #{osLookupData.number}</div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {osLookupData.statusText}
                </div>
              </div>

              {/* Steps Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-1.5">
                  <div className="h-8 w-8 mx-auto rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <div className="text-xs font-bold text-white">1. Recepção</div>
                  <div className="text-[10px] text-slate-400">Entrada e triagem</div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-8 w-8 mx-auto rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <div className="text-xs font-bold text-white">2. Diagnóstico</div>
                  <div className="text-[10px] text-slate-400">Testes de bancada</div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-8 w-8 mx-auto rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-xs animate-pulse">
                    3
                  </div>
                  <div className="text-xs font-bold text-cyan-300">3. Em Reparo</div>
                  <div className="text-[10px] text-slate-400">Aplicação da peça</div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-8 w-8 mx-auto rounded-full bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-xs">
                    4
                  </div>
                  <div className="text-xs font-semibold text-slate-500">4. Pronto</div>
                  <div className="text-[10px] text-slate-600">Aguardando retirada</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-300 flex items-center justify-between">
                <span>Dúvidas sobre o prazo? Fale com seu atendente:</span>
                <a
                  href={`https://wa.me/5577999816265?text=Olá!%20Gostaria%20de%20saber%20o%20status%20da%20minha%20OS%20${osLookupData.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:underline"
                >
                  Chamar no WhatsApp →
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── DEPOIMENTOS E AVALIAÇÕES DE CLIENTES ───────────────────────────── */}
      <section id="depoimentos" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              Reputação Impecável
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              O que nossos clientes dizem
            </h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Mais de 1.800 avaliações 5 estrelas no Google e redes sociais. Compromisso total com a sua satisfação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-400">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{t.text}"
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-sm text-white block">{t.name}</strong>
                    <span className="text-[11px] text-slate-500">{t.city}</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {t.device}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONDE ESTAMOS & INFORMAÇÕES DE CONTATO ───────────────────────────── */}
      <section id="onde-estamos" className="relative z-10 py-16 bg-slate-900/80 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-base">
                <MapPin className="h-5 w-5 text-indigo-400" />
                <span>Loja Física</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rua Da Maçonaria, 464 — Centro — Carinhanha/BA.<br />
                Ponto de fácil acesso com bancada técnica aberta ao público.
              </p>
              <div className="text-xs text-slate-300 font-semibold">
                Segunda a Sexta: 08h30 às 18h30<br />
                Sábados: 09h00 às 13h00
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-base">
                <Phone className="h-5 w-5 text-emerald-400" />
                <span>Atendimento & Orçamentos</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tire dúvidas com nossa equipe de técnicos por telefone ou envie mensagem direta com fotos do defeito:
              </p>
              <div className="space-y-1 text-xs">
                <div className="text-white font-mono font-bold">WhatsApp: (77) 99981-6265</div>
                <div className="text-slate-400">E-mail: contato@flaviocelulares.com.br</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-base">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <span>Pagamento Facilitado</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aceitamos PIX com desconto especial, cartões de crédito em até 12x, débito e dinheiro.
              </p>
              <div className="flex justify-center md:justify-start gap-2 text-[11px] text-slate-400 font-mono">
                <span className="p-1 px-2 rounded bg-white/5">PIX</span>
                <span className="p-1 px-2 rounded bg-white/5">Visa</span>
                <span className="p-1 px-2 rounded bg-white/5">Mastercard</span>
                <span className="p-1 px-2 rounded bg-white/5">Elo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER TECNOLÓGICO ──────────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 bg-slate-950 border-t border-white/10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-indigo-400" />
            <span className="text-slate-400 font-semibold">Flavio Celulares</span>
            <span>· CNPJ 17.056.311/0001-75 · Todos os direitos reservados © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#aparelhos" className="hover:text-slate-300">Catálogo</a>
            <a href="#assistencia" className="hover:text-slate-300">Assistência</a>
            <a href="#rastreamento" className="hover:text-slate-300">Rastrear OS</a>
            <Link
              href="/login"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <Lock className="h-3 w-3" />
              <span>Painel do Sistema</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* ── FLOATING WHATSAPP BUTTON ────────────────────────────────────────── */}
      <a
        href="https://wa.me/5577999816265?text=Olá!%20Estou%20no%20site%20da%20Flavio%20Celulares%20e%20gostaria%20de%20atendimento."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all group"
        aria-label="Chamar no WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
          Fale Conosco
        </span>
      </a>
    </div>
  );
}
