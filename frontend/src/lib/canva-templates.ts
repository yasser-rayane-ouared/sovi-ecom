/**
 * Canva Landing Page Design Templates
 * Curated high-converting designs optimized for e-commerce, editable on Canva.
 */

export interface CanvaTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  gradient: string;
  canvaUrl: string;
  landingTemplateId: string; // Map to local Next.js LandingTemplate id
  features: string[];
  previewImageUrl: string; // Local preview mockup image
}

export const CANVA_TEMPLATES: CanvaTemplate[] = [
  {
    id: "cosmetics_canva",
    name: "قالب مستحضرات التجميل والعناية",
    category: "تجميل وعناية",
    description: "تصميم أنيق بألوان هادئة وجذابة مخصص لمنتجات العناية بالبشرة والمكياج، مُصمم لزيادة ثقة المشترين.",
    icon: "💄",
    gradient: "from-pink-500/20 to-rose-500/20",
    canvaUrl: "https://www.canva.com/templates/EAFwKv5Me74-e-commerce-website-in-blue-pastel-red-teal-chic-photocentric-style/",
    landingTemplateId: "flash_sale",
    features: ["ألوان الباستيل الناعمة", "أماكن مخصصة لآراء العملاء بالصور", "خطوط متناسقة وأنيقة"],
    previewImageUrl: "/templates/cosmetics.png"
  },
  {
    id: "electronics_canva",
    name: "قالب الأجهزة الإلكترونية والذكية",
    category: "إلكترونيات وتكنولوجيا",
    description: "تصميم عصري داكن مع مؤثرات نيون ممتازة لعرض الساعات الذكية، السماعات، والأجهزة التقنية المبتكرة.",
    icon: "🔌",
    gradient: "from-blue-600/20 to-cyan-500/20",
    canvaUrl: "https://www.canva.com/templates/EAGH1RXgDtU-pastel-colorful-blocks-fashion-e-commerce-website/",
    landingTemplateId: "tiktok_viral",
    features: ["ستايل تقني داكن (Dark Mode)", "إبراز سريع للمواصفات التقنية", "مخطط مخصص لعرض مميزات الفيديو"],
    previewImageUrl: "/templates/electronics.png"
  },
  {
    id: "fashion_canva",
    name: "قالب الأزياء والملابس العصرية",
    category: "ملابس وأحذية",
    description: "تصميم عصري وبسيط يركز على الصور الكبيرة والخطوط الفاخرة لعرض الأزياء، الأحذية، والحقائب المتميزة.",
    icon: "👗",
    gradient: "from-amber-500/20 to-orange-500/20",
    canvaUrl: "https://www.canva.com/templates/EAEkUYzuowA-olive-green-photocentric-fashion-e-commerce-website/",
    landingTemplateId: "bundle_deal",
    features: ["تخطيط مجلة الموضة الفاخرة", "أزرار شراء بارزة", "تصميم مثالي لعروض الباقات المتعددة"],
    previewImageUrl: "/templates/fashion.png"
  },
  {
    id: "home_kitchen_canva",
    name: "قالب مستلزمات المنزل والمطبخ",
    category: "المنزل والمطبخ",
    description: "تصميم عملي ومريح للعين يعرض المنتجات المنزلية، المنظمات وأدوات المطبخ مع التركيز على حلول المشاكل اليومية.",
    icon: "🏠",
    gradient: "from-emerald-500/20 to-teal-500/20",
    canvaUrl: "https://www.canva.com/templates/EAEvHiexF9A-fashion-retail-website-in-white-purple-and-grey-simple-light-style/",
    landingTemplateId: "trust_builder",
    features: ["ألوان ترابية دافئة ومريحة", "جداول مقارنة للمنتجات ومميزاتها", "أقسام واضحة للأسئلة الشائعة"],
    previewImageUrl: "/templates/home.png"
  },
  {
    id: "algerian_15_landing_pages",
    name: "15 صفحة هبوط جزائرية احترافية",
    category: "متنوع وجاهز",
    description: "حزمة ضخمة تحتوي على 15 تصميم صفحة هبوط للمنتجات الأكثر طلباً في السوق الجزائري، مصممة بالكامل باللغة العربية وجاهزة للتخصيص الكامل.",
    icon: "🔥",
    gradient: "from-purple-500/20 to-indigo-500/20",
    canvaUrl: "https://www.canva.com/design/DAFz379buro/_Wx7HqT2phlboabuyP4IIQ/view",
    landingTemplateId: "flash_sale",
    features: ["15 تصميم مختلف ومتكامل", "مهيأ تماماً للهواتف والسوق الجزائري", "تعديل بنقرة زر واحدة"],
    previewImageUrl: "/templates/algerian_15.png"
  }
];
