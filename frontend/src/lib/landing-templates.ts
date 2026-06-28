/**
 * Pre-built premium landing page templates
 * Optimized for Algerian COD e-commerce, mobile traffic from TikTok/Instagram ads
 */

export interface TemplateSection {
  section_type: string;
  position: number;
  is_enabled: boolean;
  config: Record<string, any>;
}

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge: string;
  gradient: string;
  sections: TemplateSection[];
}

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: "flash_sale",
    name: "🔥 عرض فلاش",
    description: "صفحة مبيعات سريعة مع عداد تنازلي للإلحاح — مثالية لمنتجات TikTok الفيروسية",
    icon: "🔥",
    badge: "الأكثر استخداماً",
    gradient: "from-orange-500 to-red-600",
    sections: [
      {
        section_type: "hero",
        position: 0,
        is_enabled: true,
        config: {
          title: "🔥 عرض محدود — احصل عليه قبل النفاذ!",
          subtitle: "المنتج الأكثر طلباً في الجزائر. الدفع عند الاستلام — بدون مخاطرة!",
          badge_text: "عرض حصري",
          show_price: true,
          show_discount: true,
          bg_style: "gradient",
          cta_text: "أطلب الآن!"
        }
      },
      {
        section_type: "countdown",
        position: 1,
        is_enabled: true,
        config: {
          title: "⏰ العرض ينتهي خلال:",
          hours: 2,
          minutes: 30,
          seconds: 0,
          bg_color: "#dc2626",
          text_color: "#ffffff",
          urgency_text: "لا تفوت الفرصة — الكمية محدودة جداً!"
        }
      },
      {
        section_type: "product_gallery",
        position: 2,
        is_enabled: true,
        config: {
          title: "صور المنتج الحقيقية",
          show_zoom: true,
          layout: "swipe"
        }
      },
      {
        section_type: "benefits",
        position: 3,
        is_enabled: true,
        config: {
          title: "لماذا هذا المنتج مميز؟",
          items: [
            { icon: "✅", title: "جودة عالية", desc: "مصنوع من أفضل المواد ومضمون بالكامل" },
            { icon: "🚚", title: "توصيل سريع", desc: "التوصيل لكل الـ 58 ولاية خلال 2-5 أيام" },
            { icon: "💰", title: "الدفع عند الاستلام", desc: "لا تدفع أي شيء حتى تستلم المنتج بين يديك" },
            { icon: "🔄", title: "إرجاع مجاني", desc: "إذا لم يعجبك المنتج، يمكنك إرجاعه بدون تكاليف" }
          ]
        }
      },
      {
        section_type: "quantity_offers",
        position: 4,
        is_enabled: true,
        config: {
          title: "🎯 اشتري أكثر ووفر أكثر!",
          subtitle: "عروض الكمية الحصرية",
          highlight_index: 1,
          highlight_badge: "الأكثر طلباً"
        }
      },
      {
        section_type: "reviews",
        position: 5,
        is_enabled: true,
        config: {
          title: "⭐ آراء زبائننا الكرام",
          reviews: [
            { name: "أحمد بن عيسى — وهران", text: "منتج رائع وجودة ممتازة، والتوصيل كان سريعاً جداً!", rating: 5, date: "منذ يومين" },
            { name: "مريم العاصمية — الجزائر", text: "سهل الطلب وخدمة العملاء ممتازة. أنصح بالتعامل معهم 100%!", rating: 5, date: "منذ 3 أيام" },
            { name: "يوسف — قسنطينة", text: "المنتج مطابق تماماً للصور. شكراً لكم على الجودة والأمانة!", rating: 5, date: "منذ أسبوع" },
            { name: "فاطمة — سطيف", text: "طلبت 2 واحد لي و واحد لأختي. جودة رائعة والسعر ممتاز!", rating: 4, date: "منذ 5 أيام" }
          ]
        }
      },
      {
        section_type: "delivery_info",
        position: 6,
        is_enabled: true,
        config: {
          title: "🚚 معلومات التوصيل",
          items: [
            { icon: "📦", text: "التوصيل لكل 58 ولاية بالجزائر" },
            { icon: "⏱️", text: "مدة التوصيل: 2 إلى 5 أيام عمل" },
            { icon: "💵", text: "الدفع عند الاستلام (COD)" },
            { icon: "🔒", text: "معلوماتك الشخصية آمنة 100%" }
          ]
        }
      },
      {
        section_type: "sticky_cta",
        position: 7,
        is_enabled: true,
        config: {
          text: "أطلب الآن — الدفع عند الاستلام!",
          bg_color: "#dc2626",
          show_price: true,
          scroll_to: "#checkout"
        }
      },
      {
        section_type: "floating_order_button",
        position: 8,
        is_enabled: true,
        config: {
          text: "🛒 أطلب الآن!",
          scroll_to: "#checkout"
        }
      }
    ]
  },
  {
    id: "tiktok_viral",
    name: "📱 تيك توك فايرال",
    description: "صفحة موبايل أولاً بالفيديو — مثالية لحركة المرور من TikTok وInstagram",
    icon: "📱",
    badge: "موبايل أولاً",
    gradient: "from-pink-500 to-violet-600",
    sections: [
      {
        section_type: "video",
        position: 0,
        is_enabled: true,
        config: {
          title: "شاهد الفيديو قبل الشراء!",
          video_url: "",
          autoplay: true,
          muted: true,
          aspect_ratio: "9/16",
          placeholder_text: "أضف رابط فيديو TikTok أو YouTube هنا"
        }
      },
      {
        section_type: "hero",
        position: 1,
        is_enabled: true,
        config: {
          title: "المنتج الذي أشعل TikTok! 🔥",
          subtitle: "أكثر من 10,000 قطعة مباعة — احصل على قطعتك قبل النفاذ!",
          badge_text: "ترند TikTok",
          show_price: true,
          show_discount: true,
          bg_style: "dark",
          cta_text: "اطلب الآن بالدفع عند الاستلام"
        }
      },
      {
        section_type: "benefits",
        position: 2,
        is_enabled: true,
        config: {
          title: "لماذا الكل يتحدث عنه؟",
          items: [
            { icon: "🌟", title: "ترند رقم 1", desc: "المنتج الأكثر انتشاراً على وسائل التواصل الاجتماعي" },
            { icon: "✨", title: "جودة فائقة", desc: "مصنوع من مواد عالية الجودة ومتينة" },
            { icon: "🎁", title: "هدية مجانية", desc: "مع كل طلب تحصل على هدية مفاجئة" },
            { icon: "📦", title: "توصيل سريع", desc: "يصلك للباب خلال 2-4 أيام" }
          ]
        }
      },
      {
        section_type: "before_after",
        position: 3,
        is_enabled: true,
        config: {
          title: "النتيجة قبل و بعد",
          before_label: "قبل",
          after_label: "بعد",
          before_image: "",
          after_image: "",
          placeholder_text: "أضف صور المقارنة هنا"
        }
      },
      {
        section_type: "reviews",
        position: 4,
        is_enabled: true,
        config: {
          title: "💬 ماذا يقول زبائننا؟",
          reviews: [
            { name: "سارة — الجزائر العاصمة", text: "شفت الفيديو على TikTok وطلبت مباشرة! المنتج أحسن من الفيديو 😍", rating: 5, date: "منذ يوم" },
            { name: "كريم — وهران", text: "كنت متردد بصح لما جاني، تفاجأت بالجودة! شكراً 🔥", rating: 5, date: "منذ 3 أيام" },
            { name: "نور — باتنة", text: "التوصيل كان سريع والمنتج مطابق 100% لما في الفيديو", rating: 5, date: "منذ أسبوع" },
            { name: "أمينة — تيزي وزو", text: "طلبت 3 — واحد لي وواحد لصحباتي. الكل عجبهم!", rating: 5, date: "منذ 4 أيام" }
          ]
        }
      },
      {
        section_type: "delivery_info",
        position: 5,
        is_enabled: true,
        config: {
          title: "📦 كيفية الطلب والتوصيل",
          items: [
            { icon: "1️⃣", text: "املأ الاستمارة بمعلوماتك الصحيحة" },
            { icon: "2️⃣", text: "سيتصل بك فريقنا لتأكيد الطلب" },
            { icon: "3️⃣", text: "استلم منتجك والدفع عند الباب" },
            { icon: "✅", text: "ضمان الاسترجاع إذا لم يعجبك!" }
          ]
        }
      },
      {
        section_type: "floating_order_button",
        position: 6,
        is_enabled: true,
        config: {
          text: "🔥 أطلب الآن!",
          scroll_to: "#checkout"
        }
      }
    ]
  },
  {
    id: "trust_builder",
    name: "⭐ بناء الثقة",
    description: "صفحة مركزة على الدليل الاجتماعي والثقة — مثالية للمنتجات الغالية",
    icon: "⭐",
    badge: "للمنتجات الغالية",
    gradient: "from-amber-500 to-yellow-600",
    sections: [
      {
        section_type: "hero",
        position: 0,
        is_enabled: true,
        config: {
          title: "المنتج الأصلي — مضمون 100% 🏆",
          subtitle: "نحن الموزع المعتمد الوحيد في الجزائر. جودة لا مثيل لها مع ضمان كامل.",
          badge_text: "منتج أصلي معتمد",
          show_price: true,
          show_discount: true,
          bg_style: "premium",
          cta_text: "أطلب النسخة الأصلية الآن"
        }
      },
      {
        section_type: "reviews",
        position: 1,
        is_enabled: true,
        config: {
          title: "🏆 +500 زبون راضي في الجزائر",
          reviews: [
            { name: "محمد — الجزائر العاصمة", text: "منتج أصلي وممتاز. يستاهل كل دينار. التغليف كان فاخر جداً!", rating: 5, date: "منذ يوم" },
            { name: "ليلى — وهران", text: "كنت خايفة من الشراء أونلاين بصح تفاجأت. المنتج أصلي 100% ومع الضمان!", rating: 5, date: "منذ 3 أيام" },
            { name: "عمر — قسنطينة", text: "الفرق واضح بين الأصلي والتقليد. شكراً لكم على الأمانة!", rating: 5, date: "منذ أسبوع" },
            { name: "حنان — عنابة", text: "الطلب الثاني لي. خدمة ممتازة ومنتج عالي الجودة.", rating: 5, date: "منذ 5 أيام" },
            { name: "رامي — بجاية", text: "أحسن استثمار درتو. الجودة تتكلم على نفسها!", rating: 5, date: "منذ أسبوعين" },
            { name: "نادية — سطيف", text: "صديقتي نصحتني وما ندمتش! شكراً 💛", rating: 4, date: "منذ 4 أيام" }
          ]
        }
      },
      {
        section_type: "benefits",
        position: 2,
        is_enabled: true,
        config: {
          title: "لماذا تختارنا؟",
          items: [
            { icon: "🏅", title: "منتج أصلي 100%", desc: "نحن الموزع المعتمد والحصري في الجزائر" },
            { icon: "🛡️", title: "ضمان لمدة سنة", desc: "إذا واجهت أي مشكل، نستبدله لك مجاناً" },
            { icon: "📞", title: "دعم عملاء 24/7", desc: "فريقنا متواجد دائماً للرد على استفساراتك" },
            { icon: "💳", title: "الدفع عند الاستلام", desc: "لا تدفع حتى تتأكد وتستلم المنتج" }
          ]
        }
      },
      {
        section_type: "faq",
        position: 3,
        is_enabled: true,
        config: {
          title: "❓ أسئلة شائعة",
          items: [
            { q: "هل المنتج أصلي فعلاً؟", a: "نعم 100%. نحن الموزع المعتمد في الجزائر ونقدم شهادة أصالة مع كل طلب." },
            { q: "كم مدة التوصيل؟", a: "من 2 إلى 5 أيام عمل حسب ولايتك. التوصيل متاح لكل 58 ولاية." },
            { q: "هل يمكنني الإرجاع؟", a: "نعم! إذا لم يعجبك المنتج أو واجهت أي مشكل، يمكنك إرجاعه خلال 7 أيام." },
            { q: "كيف أتأكد من الأصالة؟", a: "كل منتج يأتي مع رقم تسلسلي يمكنك التحقق منه على الموقع الرسمي للشركة المصنعة." },
            { q: "هل الدفع آمن؟", a: "الدفع يكون عند الاستلام (COD) — لا تدفع أي شيء مسبقاً!" }
          ]
        }
      },
      {
        section_type: "comparison",
        position: 4,
        is_enabled: true,
        config: {
          title: "⚖️ الفرق بين الأصلي والتقليد",
          columns: ["المميزات", "المنتج الأصلي (عندنا)", "التقليد (السوق)"],
          rows: [
            ["الجودة", "ممتازة ومضمونة ✅", "رديئة وغير مضمونة ❌"],
            ["الضمان", "سنة كاملة ✅", "لا يوجد ❌"],
            ["خدمة ما بعد البيع", "متوفرة 24/7 ✅", "غير موجودة ❌"],
            ["السعر", "سعر معقول ومناسب ✅", "سعر رخيص مشبوه ⚠️"],
            ["التغليف", "فاخر وأصلي ✅", "عادي بدون علامة ❌"]
          ]
        }
      },
      {
        section_type: "delivery_info",
        position: 5,
        is_enabled: true,
        config: {
          title: "🚚 خدمة التوصيل المميزة",
          items: [
            { icon: "🇩🇿", text: "التوصيل لجميع 58 ولاية بالجزائر" },
            { icon: "⚡", text: "توصيل سريع خلال 2-5 أيام" },
            { icon: "💰", text: "الدفع نقداً عند الاستلام" },
            { icon: "📋", text: "تتبع طلبك عبر رقم التتبع" }
          ]
        }
      },
      {
        section_type: "sticky_cta",
        position: 6,
        is_enabled: true,
        config: {
          text: "🏆 أطلب المنتج الأصلي الآن!",
          bg_color: "#d97706",
          show_price: true,
          scroll_to: "#checkout"
        }
      }
    ]
  },
  {
    id: "bundle_deal",
    name: "🎁 عرض باقة",
    description: "صفحة عروض الباقات والكميات — مثالية لزيادة قيمة الطلبية",
    icon: "🎁",
    badge: "أعلى متوسط طلبية",
    gradient: "from-emerald-500 to-teal-600",
    sections: [
      {
        section_type: "hero",
        position: 0,
        is_enabled: true,
        config: {
          title: "🎁 عروض باقات حصرية — وفر أكثر!",
          subtitle: "اشتري أكثر ووفر أكثر! عروض مميزة لا تتكرر. الدفع عند الاستلام بـ 58 ولاية.",
          badge_text: "عرض باقة",
          show_price: true,
          show_discount: true,
          bg_style: "gradient",
          cta_text: "اختر باقتك المفضلة"
        }
      },
      {
        section_type: "bundle_offers",
        position: 1,
        is_enabled: true,
        config: {
          title: "🎯 اختر الباقة المناسبة لك",
          subtitle: "كل الباقات تشمل التوصيل المجاني والدفع عند الاستلام",
          highlight_text: "الأكثر طلباً"
        }
      },
      {
        section_type: "quantity_offers",
        position: 2,
        is_enabled: true,
        config: {
          title: "💎 عروض الكمية",
          subtitle: "اشتري أكثر ووفر أكثر على كل قطعة!",
          highlight_index: 1,
          highlight_badge: "أفضل قيمة"
        }
      },
      {
        section_type: "benefits",
        position: 3,
        is_enabled: true,
        config: {
          title: "مزايا الشراء بالباقة",
          items: [
            { icon: "💸", title: "توفير حقيقي", desc: "وفر حتى 40% عند الشراء بالباقة مقارنة بالشراء بالقطعة" },
            { icon: "🎁", title: "هدايا مجانية", desc: "كل باقة تأتي مع هدية مفاجئة حصرية" },
            { icon: "🚚", title: "شحن مجاني", desc: "التوصيل مجاني لكل الباقات بكل 58 ولاية" },
            { icon: "💯", title: "ضمان الجودة", desc: "كل المنتجات أصلية ومضمونة مع إمكانية الاسترجاع" }
          ]
        }
      },
      {
        section_type: "reviews",
        position: 4,
        is_enabled: true,
        config: {
          title: "🌟 زبائن سعداء بالباقات",
          reviews: [
            { name: "خالد — الجزائر", text: "اشتريت باقة 3 قطع ووفرت كثير! المنتجات كلها ممتازة 👍", rating: 5, date: "منذ يومين" },
            { name: "سمية — وهران", text: "الباقة العائلية ممتازة. وزعت على العائلة والكل فرحان!", rating: 5, date: "منذ أسبوع" },
            { name: "جمال — عنابة", text: "سعر الباقة أرخص بكثير من السوق. عرض ممتاز!", rating: 5, date: "منذ 3 أيام" }
          ]
        }
      },
      {
        section_type: "faq",
        position: 5,
        is_enabled: true,
        config: {
          title: "❓ أسئلة حول الباقات",
          items: [
            { q: "هل يمكنني اختيار ألوان مختلفة في الباقة؟", a: "نعم! يمكنك تحديد الألوان والمقاسات المختلفة عند تعبئة الاستمارة أو عند اتصال فريقنا بك." },
            { q: "هل التوصيل مجاني فعلاً؟", a: "نعم، التوصيل مجاني لكل الباقات لجميع 58 ولاية بالجزائر." },
            { q: "كم مدة التوصيل؟", a: "من 2 إلى 5 أيام عمل حسب ولايتك." },
            { q: "هل يمكنني إرجاع باقة كاملة؟", a: "نعم، يمكنك إرجاع أي منتج لم يعجبك خلال 7 أيام من الاستلام." }
          ]
        }
      },
      {
        section_type: "delivery_info",
        position: 6,
        is_enabled: true,
        config: {
          title: "📦 كيف تطلب باقتك؟",
          items: [
            { icon: "1️⃣", text: "اختر الباقة التي تناسبك" },
            { icon: "2️⃣", text: "املأ الاستمارة بمعلوماتك الصحيحة" },
            { icon: "3️⃣", text: "سيتصل بك فريقنا لتأكيد الطلب" },
            { icon: "4️⃣", text: "استلم باقتك والدفع عند الباب!" }
          ]
        }
      },
      {
        section_type: "floating_order_button",
        position: 7,
        is_enabled: true,
        config: {
          text: "🎁 أطلب باقتك الآن!",
          scroll_to: "#checkout"
        }
      }
    ]
  }
];

/**
 * Section type display labels and icons for the builder sidebar
 */
export const SECTION_TYPE_META: Record<string, { label: string; icon: string; desc: string }> = {
  hero: { label: "بطل الصفحة", icon: "🎯", desc: "العنوان الرئيسي وصورة المنتج" },
  video: { label: "فيديو", icon: "🎬", desc: "فيديو تعريفي أو إعلاني" },
  reviews: { label: "تقييمات العملاء", icon: "⭐", desc: "آراء وتقييمات الزبائن" },
  faq: { label: "أسئلة شائعة", icon: "❓", desc: "أسئلة وأجوبة متكررة" },
  benefits: { label: "المميزات", icon: "✨", desc: "نقاط قوة المنتج" },
  before_after: { label: "قبل وبعد", icon: "🔄", desc: "مقارنة قبل وبعد بالصور" },
  countdown: { label: "عداد تنازلي", icon: "⏰", desc: "مؤقت للإلحاح والاستعجال" },
  quantity_offers: { label: "عروض الكمية", icon: "📦", desc: "خصومات حسب الكمية المطلوبة" },
  bundle_offers: { label: "عروض الباقات", icon: "🎁", desc: "باقات منتجات بسعر خاص" },
  delivery_info: { label: "معلومات التوصيل", icon: "🚚", desc: "تفاصيل الشحن والدفع" },
  comparison: { label: "جدول مقارنة", icon: "⚖️", desc: "مقارنة بين المنتج والمنافسين" },
  text: { label: "نص حر", icon: "📝", desc: "فقرة نصية قابلة للتخصيص" },
  image: { label: "صورة", icon: "🖼️", desc: "صورة بعرض كامل أو مقيد" },
  product_gallery: { label: "معرض صور المنتج", icon: "📸", desc: "صور المنتج بتنسيق سحب" },
  sticky_cta: { label: "زر ثابت (CTA)", icon: "📌", desc: "زر شراء ثابت أسفل الشاشة" },
  floating_order_button: { label: "زر طلب عائم", icon: "🛒", desc: "زر طلب يظهر عند التمرير" }
};

/**
 * Get default config for a new section of a given type
 */
export function getDefaultConfig(sectionType: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    hero: {
      title: "عنوان المنتج الرئيسي",
      subtitle: "وصف مختصر وجذاب للمنتج",
      badge_text: "",
      show_price: true,
      show_discount: true,
      bg_style: "gradient",
      cta_text: "أطلب الآن!"
    },
    video: {
      title: "",
      video_url: "",
      autoplay: false,
      muted: true,
      aspect_ratio: "16/9"
    },
    reviews: {
      title: "آراء زبائننا",
      reviews: [
        { name: "زبون — ولاية", text: "تجربة الزبون هنا...", rating: 5, date: "منذ يوم" }
      ]
    },
    faq: {
      title: "أسئلة شائعة",
      items: [
        { q: "السؤال هنا؟", a: "الجواب هنا." }
      ]
    },
    benefits: {
      title: "لماذا تختارنا؟",
      items: [
        { icon: "✅", title: "ميزة", desc: "وصف الميزة" }
      ]
    },
    before_after: {
      title: "قبل وبعد",
      before_label: "قبل",
      after_label: "بعد",
      before_image: "",
      after_image: ""
    },
    countdown: {
      title: "العرض ينتهي خلال:",
      hours: 2,
      minutes: 0,
      seconds: 0,
      bg_color: "#dc2626",
      text_color: "#ffffff",
      urgency_text: "الكمية محدودة!"
    },
    quantity_offers: {
      title: "عروض الكمية",
      subtitle: "",
      highlight_index: 0,
      highlight_badge: "الأفضل"
    },
    bundle_offers: {
      title: "عروض الباقات",
      subtitle: "",
      highlight_text: "الأكثر طلباً"
    },
    delivery_info: {
      title: "معلومات التوصيل",
      items: [
        { icon: "🚚", text: "التوصيل لكل 58 ولاية" }
      ]
    },
    comparison: {
      title: "جدول المقارنة",
      columns: ["المميزات", "منتجنا", "المنافس"],
      rows: [
        ["الجودة", "ممتازة ✅", "عادية ❌"]
      ]
    },
    text: {
      title: "",
      content: "اكتب النص هنا...",
      align: "right",
      size: "base"
    },
    image: {
      image_url: "",
      alt_text: "",
      caption: "",
      full_width: true
    },
    product_gallery: {
      title: "صور المنتج",
      show_zoom: true,
      layout: "swipe"
    },
    sticky_cta: {
      text: "أطلب الآن!",
      bg_color: "#6366f1",
      show_price: true,
      scroll_to: "#checkout"
    },
    floating_order_button: {
      text: "🛒 أطلب الآن!",
      scroll_to: "#checkout"
    }
  };
  return defaults[sectionType] || {};
}
