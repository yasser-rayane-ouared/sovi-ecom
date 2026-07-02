"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { formatCurrency, getStorefrontLink, getFullImageUrl } from "../../../../lib/utils";
import {
  Search, ChevronDown, Check, MapPin, Truck, ShoppingCart, User, Phone, CheckCircle2, AlertCircle, ShoppingBag, Shield, Tag
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { initializePixels, trackPixelEvent, deduplicatePixels, generateEventId } from "../../../../components/pixels";

interface WilayaOption {
  id: number;
  code: number;
  name_ar: string;
  name_fr: string;
  name_en?: string;
  home_price: number;
  desk_price?: number;
  is_active?: boolean;
}

interface CommuneOption {
  id: number;
  name: string;
  name_ar: string;
}

// Theme catalog — CSS custom properties for each theme
const THEME_STYLES: Record<string, React.CSSProperties> = {
  'luxury-dark': {
    '--theme-bg': '#050505',
    '--theme-text': '#ffffff',
    '--theme-accent': '#d4af37',
    '--theme-font': "Cairo, serif",
    '--theme-btn-bg': '#ffffff',
    '--theme-btn-text': '#050505',
    '--theme-btn-hover-bg': '#d4af37',
    '--theme-btn-hover-text': '#050505',
    '--theme-btn-radius': '8px',
    '--theme-btn-border': '1px solid #d4af37',
    '--theme-img-radius': '12px',
    '--theme-card-bg': '#121212',
    '--theme-card-border': '#262626',
    '--theme-section-radius': '16px',
    '--theme-title-weight': '700',
  } as any,
  'midnight-luxury': {
    '--theme-bg': '#070605',
    '--theme-text': '#ebd0a7',
    '--theme-accent': '#d4af37',
    '--theme-font': "Cairo, serif",
    '--theme-btn-bg': '#d4af37',
    '--theme-btn-text': '#070605',
    '--theme-btn-hover-bg': '#ebd0a7',
    '--theme-btn-radius': '4px',
    '--theme-img-radius': '6px',
    '--theme-card-bg': '#120e0a',
    '--theme-card-border': '#2a2015',
    '--theme-section-radius': '8px',
  } as any,
  'emerald-mint': {
    '--theme-bg': '#fafaf9',
    '--theme-text': '#1c1917',
    '--theme-accent': '#0f766e',
    '--theme-font': "Cairo, sans-serif",
    '--theme-btn-bg': '#0f766e',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-hover-bg': '#10b981',
    '--theme-btn-radius': '16px',
    '--theme-img-radius': '16px',
    '--theme-card-bg': '#ffffff',
    '--theme-card-border': '#e7e5e4',
    '--theme-section-radius': '16px',
  } as any,
  'theme-minimal': {
    '--theme-bg': '#ffffff',
    '--theme-text': '#111111',
    '--theme-accent': '#666666',
    '--theme-font': "'Helvetica Neue', sans-serif",
    '--theme-btn-bg': '#111111',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-hover-bg': '#333333',
    '--theme-btn-radius': '8px',
    '--theme-img-radius': '12px',
    '--theme-card-bg': '#f8f8f8',
    '--theme-card-border': '#e5e5e5',
    '--theme-section-radius': '16px',
  } as any,
  'theme-direct-offer': {
    '--theme-bg': '#ffffff',
    '--theme-text': '#000000',
    '--theme-accent': '#d00000',
    '--theme-font': "'Arial', sans-serif",
    '--theme-btn-bg': '#ffc300',
    '--theme-btn-text': '#000000',
    '--theme-btn-hover-bg': '#ffaa00',
    '--theme-btn-radius': '6px',
    '--theme-btn-border': '2px solid #000',
    '--theme-btn-shadow': '4px 4px 0px #000',
    '--theme-img-radius': '0',
    '--theme-card-bg': '#fff8e8',
    '--theme-card-border': '#ffc300',
    '--theme-section-radius': '4px',
    '--theme-title-transform': 'uppercase',
    '--theme-title-weight': '900',
  } as any,
  'theme-classic-luxury': {
    '--theme-bg': '#0a0a0a',
    '--theme-text': '#f4f4f4',
    '--theme-accent': '#c5a059',
    '--theme-font': "'Playfair Display', serif",
    '--theme-btn-bg': 'transparent',
    '--theme-btn-text': '#c5a059',
    '--theme-btn-hover-bg': '#c5a059',
    '--theme-btn-hover-text': '#0a0a0a',
    '--theme-btn-radius': '0',
    '--theme-btn-border': '1px solid #c5a059',
    '--theme-img-radius': '0',
    '--theme-card-bg': '#141414',
    '--theme-card-border': '#2a2a2a',
    '--theme-section-radius': '0',
    '--theme-title-weight': '400',
  } as any,
  'theme-raw-authentic': {
    '--theme-bg': '#fafafa',
    '--theme-text': '#222222',
    '--theme-accent': '#222222',
    '--theme-font': "'Courier New', monospace",
    '--theme-btn-bg': '#e0e0e0',
    '--theme-btn-text': '#222222',
    '--theme-btn-hover-bg': '#cccccc',
    '--theme-btn-radius': '4px',
    '--theme-btn-border': '1px solid #22',
    '--theme-img-radius': '0',
    '--theme-img-border': '1px solid #e0e0e0',
    '--theme-card-bg': '#f0f0f0',
    '--theme-card-border': '#d0d0d0',
    '--theme-section-radius': '2px',
  } as any,
  'theme-brutalist': {
    '--theme-bg': '#e6e6e6',
    '--theme-text': '#000000',
    '--theme-accent': '#0000ff',
    '--theme-font': "'Impact', sans-serif",
    '--theme-btn-bg': '#000000',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-hover-bg': '#0000ff',
    '--theme-btn-radius': '0',
    '--theme-img-radius': '0',
    '--theme-img-border': '3px solid #000',
    '--theme-card-bg': '#d6d6d6',
    '--theme-card-border': '#000000',
    '--theme-section-radius': '0',
    '--theme-title-transform': 'uppercase',
    '--theme-title-size': '2rem',
  } as any,
  'theme-soft-eco': {
    '--theme-bg': '#f4f7f4',
    '--theme-text': '#3e4a3d',
    '--theme-accent': '#6b8e6b',
    '--theme-font': "'Georgia', serif",
    '--theme-btn-bg': '#6b8e6b',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-hover-bg': '#5a7a5a',
    '--theme-btn-radius': '50px',
    '--theme-btn-shadow': '0 10px 20px rgba(107, 142, 107, 0.2)',
    '--theme-img-radius': '20px',
    '--theme-card-bg': '#eaf0ea',
    '--theme-card-border': '#c8d8c8',
    '--theme-section-radius': '20px',
  } as any,
  'theme-glass': {
    '--theme-bg': '#1e1e2f',
    '--theme-text': '#ffffff',
    '--theme-accent': '#00f0ff',
    '--theme-font': "'Inter', sans-serif",
    '--theme-btn-bg': 'rgba(255, 255, 255, 0.1)',
    '--theme-btn-text': '#00f0ff',
    '--theme-btn-hover-bg': 'rgba(255, 255, 255, 0.2)',
    '--theme-btn-radius': '12px',
    '--theme-btn-border': '1px solid rgba(255, 255, 255, 0.2)',
    '--theme-btn-shadow': '0 4px 30px rgba(0, 0, 0, 0.1)',
    '--theme-img-radius': '12px',
    '--theme-card-bg': 'rgba(255, 255, 255, 0.05)',
    '--theme-card-border': 'rgba(255, 255, 255, 0.1)',
    '--theme-section-radius': '16px',
    '--theme-card-backdrop': 'blur(10px)',
  } as any,
  'theme-playful': {
    '--theme-bg': '#fff0f5',
    '--theme-text': '#505050',
    '--theme-accent': '#ff69b4',
    '--theme-font': "'Comic Sans MS', cursive, sans-serif",
    '--theme-btn-bg': '#ff69b4',
    '--theme-btn-text': '#ffffff',
    '--theme-btn-hover-bg': '#ff1493',
    '--theme-btn-radius': '30px',
    '--theme-img-radius': '30px',
    '--theme-card-bg': '#fff5f9',
    '--theme-card-border': '#ffc0d9',
    '--theme-section-radius': '24px',
  } as any,
};

// Helper for Algerian Wilaya Region classification
const getWilayaRegion = (code: number): string => {
  const central = [9, 16, 15, 10, 26, 35, 42, 44, 2]; // Blida, Alger, Tizi Ouzou, Bouira, Medea, Boumerdes, Tipaza, Ain Defla, Chlef
  const western = [13, 14, 20, 22, 27, 29, 31, 46, 48]; // Tlemcen, Tiaret, Saida, Sidi Bel Abbes, Mostaganem, Mascara, Oran, Ain Temouchent, Relizane
  const southern = [1, 3, 8, 11, 30, 32, 33, 37, 45, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]; // Sahara/South wilayas
  if (central.includes(code)) return "الوسط";
  if (western.includes(code)) return "الغرب";
  if (southern.includes(code)) return "الجنوب";
  return "الشرق"; // Default to East
};

export default function StorefrontProductDetail() {
  const params = useParams();
  const subdomain = params.store as string;
  const slug = params.slug as string;

  const [store, setStore] = useState<any>(null);
  const isArabic = store?.language !== "fr" && store?.language !== "en";
  const t = (ar: string, fr: string, en: string) => {
    if (store?.language === "en") return en;
    if (store?.language === "fr") return fr;
    return ar;
  };
  const [rawProduct, setRawProduct] = useState<any>(null);
  const [abGroup, setAbGroup] = useState<'A' | 'B' | null>(null);

  const rawProductObj = (rawProduct?.enable_ab_test && rawProduct.ab_test_product_b_detail && abGroup === 'B')
    ? rawProduct.ab_test_product_b_detail
    : rawProduct;

  const product = rawProductObj ? {
    ...rawProductObj,
    title: rawProductObj.title
      ? rawProductObj.title.replace(/\s*-\s*النسخة\s*B\s*$/i, '').replace(/\s*-\s*Version\s*B\s*$/i, '')
      : "",
    name: rawProductObj.name
      ? rawProductObj.name.replace(/\s*-\s*النسخة\s*B\s*$/i, '').replace(/\s*-\s*Version\s*B\s*$/i, '')
      : (rawProductObj.title ? rawProductObj.title.replace(/\s*-\s*النسخة\s*B\s*$/i, '').replace(/\s*-\s*Version\s*B\s*$/i, '') : "")
  } : null;
  const [wilayas, setWilayas] = useState<WilayaOption[]>([]);
  const [communes, setCommunes] = useState<CommuneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [selectedCommune, setSelectedCommune] = useState("");
  const [address, setAddress] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderDone, setOrderDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Firebase OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [firebaseToken, setFirebaseToken] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  // Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscountPct, setCouponDiscountPct] = useState(0);
  const [commitmentChecked, setCommitmentChecked] = useState(false);

  // Search & custom dropdown states for Wilaya
  const [wilayaSearch, setWilayaSearch] = useState("");
  const [wilayaDropdownOpen, setWilayaDropdownOpen] = useState(false);
  const wilayaDropdownRef = useRef<HTMLDivElement>(null);

  // Social Urgency bubble state
  const [socialToast, setSocialToast] = useState<{ name: string; city: string; time: string; productTitle: string } | null>(null);

  // Variant selection states
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', reviewer_city: '', rating: 5, body: '', photo_url: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [reviewPhotoUploading, setReviewPhotoUploading] = useState(false);
  const [reviewPhotoName, setReviewPhotoName] = useState('');

  // Sticky CTA: track if the checkout form is visible in the viewport
  const [isFormVisible, setIsFormVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById('checkout-form-card');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFormVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rawProduct]);


  // Load approved reviews from backend
  useEffect(() => {
    if (!subdomain || !slug || !rawProduct) return;
    api.get(`/storefront/${subdomain}/products/${slug}/reviews/`)
      .then((res) => {
        setApprovedReviews(Array.isArray(res.data) ? res.data : []);
        setReviewsLoaded(true);
      })
      .catch(() => {});
  }, [subdomain, slug, rawProduct]);

  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('يرجى اختيار ملف صورة فقط.', 'Veuillez choisir uniquement un fichier image.', 'Please select an image file only.'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت.', 'La taille de l\'image ne doit pas dépasser 5 Mo.', 'The image size must not exceed 5 MB.'));
      return;
    }

    setReviewPhotoUploading(true);
    setReviewPhotoName(file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/storefront/${subdomain}/upload-review-photo/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.image_url) {
        setReviewForm(prev => ({ ...prev, photo_url: res.data.image_url }));
      }
    } catch (err) {
      console.error(err);
      alert(t('فشل رفع الصورة. يرجى المحاولة مرة أخرى.', 'Échec du téléchargement de l\'image. Veuillez réessayer.', 'Failed to upload image. Please try again.'));
      setReviewPhotoName('');
    } finally {
      setReviewPhotoUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name.trim()) {
      setReviewSubmitError(t("يرجى إدخال الاسم", "Veuillez entrer le nom", "Please enter the name"));
      return;
    }
    setReviewSubmitting(true);
    setReviewSubmitError("");
    setReviewSubmitSuccess(false);

    try {
      await api.post(`/storefront/${subdomain}/products/${slug}/reviews/`, {
        reviewer_name: reviewForm.reviewer_name,
        reviewer_city: reviewForm.reviewer_city,
        rating: reviewForm.rating,
        body: reviewForm.body,
        photo_url: reviewForm.photo_url,
      });
      setReviewSubmitSuccess(true);
      setReviewForm({ reviewer_name: '', reviewer_city: '', rating: 5, body: '', photo_url: '' });
      setReviewPhotoName('');
    } catch (err: any) {
      console.error(err);
      setReviewSubmitError(err.response?.data?.message || err.response?.data?.detail || t("حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.", "Une erreur est survenue lors de l'envoi de l'évaluation. Veuillez réessayer.", "An error occurred while submitting your review. Please try again."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!subdomain || !slug) return;
    setLoading(true);
    Promise.all([
      api.get(`/storefront/${subdomain}/`),
      api.get(`/storefront/${subdomain}/products/${slug}/`),
      api.get(`/storefront/${subdomain}/wilayas/`)
    ])
      .then(([storeRes, productRes, wilayasRes]) => {
        setStore(storeRes.data);
        setRawProduct(productRes.data);
        setWilayas(wilayasRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subdomain, slug]);

  useEffect(() => {
    if (product && store) {
      document.title = `${product.name} — ${store.name}`;
    }
  }, [product, store]);

  // A/B Testing Sticky Group Assignment & Page View Tracking
  useEffect(() => {
    if (!rawProduct || !subdomain) return;

    // Check if A/B testing is active and assign group
    let assignedGroup: 'A' | 'B' = 'A';
    if (rawProduct.enable_ab_test && rawProduct.ab_test_product_b_detail) {
      const storageKey = `ab_test_group_${rawProduct.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved === 'A' || saved === 'B') {
        assignedGroup = saved as 'A' | 'B';
      } else {
        assignedGroup = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem(storageKey, assignedGroup);
      }
    }
    setAbGroup(assignedGroup);

    // Generate or get session ID
    let sessionId = localStorage.getItem('ab_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('ab_session_id', sessionId);
    }

    // Fire track page view event (internal view_content log)
    api.post('/analytics/track/', {
      store: subdomain,
      event_type: 'view_content',
      product_id: rawProduct.id, // always link to master product A
      value: 0,
      metadata: {
        product_id: rawProduct.id,
        ab_test_group: rawProduct.enable_ab_test && rawProduct.ab_test_product_b_detail ? assignedGroup : null
      },
      session_id: sessionId
    }).catch(() => {});

  }, [rawProduct, subdomain]);

  // Initialize pixels and track ViewContent on page view
  useEffect(() => {
    if (!product || !store || abGroup === null) return;

    // Collect all relevant pixels (store-level + product-specific)
    const allPixels = deduplicatePixels([
      ...(store?.pixels || []),
      ...(product?.pixels || []),
    ]);

    console.log("[Sovi Pixels] Found active pixels:", allPixels);
    if (allPixels.length > 0) {
      try {
        console.log("[Sovi Pixels] Initializing active pixels...");
        initializePixels(allPixels);
        console.log("[Sovi Pixels] Firing ViewContent event...");
        const eventId = rawProduct?.view_content_event_id || generateEventId();
        trackPixelEvent(allPixels, 'ViewContent', {
          content_name: product.title,
          content_ids: [product.id],
          content_type: 'product',
          value: parseFloat(product.price || 0),
          currency: 'DZD',
          ab_test_group: rawProduct?.enable_ab_test ? abGroup : null,
        }, eventId);
      } catch (e) {
        console.error("[Sovi Pixels] Error running storefront pixels:", e);
      }
    }
  }, [product, store, abGroup]);

  // Section interaction tracking (impressions & clicks)
  useEffect(() => {
    if (!product || !subdomain) return;

    const sessionId = localStorage.getItem('ab_session_id') || '';
    const trackedImpressions = new Set<string>();
    const trackedClicks = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionType = entry.target.getAttribute('data-section-type');
            if (sectionType && !trackedImpressions.has(sectionType)) {
              trackedImpressions.add(sectionType);
              api.post('/analytics/track-section/', {
                store: subdomain,
                product_id: product.id,
                section_type: sectionType,
                event_type: 'impression',
                session_id: sessionId
              }).catch(() => {});
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-section-type]');
    elements.forEach((el) => observer.observe(el));

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionElement = target.closest('[data-section-type]');
      if (sectionElement) {
        const sectionType = sectionElement.getAttribute('data-section-type');
        if (sectionType && !trackedClicks.has(sectionType)) {
          trackedClicks.add(sectionType);
          api.post('/analytics/track-section/', {
            store: subdomain,
            product_id: product.id,
            section_type: sectionType,
            event_type: 'click',
            session_id: sessionId
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
    };
  }, [product, subdomain]);

  // Variant initial selection
  useEffect(() => {
    if (!product || !product.variants || product.variants.length === 0) return;
    
    // Find the first active variant
    const firstActive = product.variants.find((v: any) => v.is_active);
    if (firstActive) {
      const initialOpts: Record<string, string> = {};
      (firstActive.options || []).forEach((opt: any) => {
        initialOpts[opt.label] = opt.value;
      });
      setSelectedOptions(initialOpts);
    }
  }, [product]);

  // Variant matching lookups
  useEffect(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const matching = product.variants.find((v: any) => {
      if (!v.is_active) return false;
      return (v.options || []).every((opt: any) => selectedOptions[opt.label] === opt.value);
    });

    if (matching) {
      setSelectedVariant(matching);
      // Auto-slide carousel to linked image URL if matches
      if (matching.image_url && product.images) {
        const idx = product.images.findIndex((img: any) => img.image_url === matching.image_url);
        if (idx !== -1) {
          setActiveImageIndex(idx);
        }
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedOptions, product]);

  // Click outside to close custom Wilaya dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wilayaDropdownRef.current && !wilayaDropdownRef.current.contains(event.target as Node)) {
        setWilayaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productSections = product?.sections || [];
  const hasCaptchaSection = productSections.some((s: any) => s.section_type === 'security_captcha');
  const hasOtpSection = productSections.some((s: any) => s.section_type === 'security_otp');
  const hasPhoneValSection = productSections.some((s: any) => s.section_type === 'security_phone_validation');
  const hasRateLimitSection = productSections.some((s: any) => s.section_type === 'security_rate_limit');
  const hasAlgerianIpSection = productSections.some((s: any) => s.section_type === 'security_algerian_ip');
  const hasCommitmentSection = productSections.some((s: any) => s.section_type === 'security_commitment');
  const hasCouponSection = productSections.some((s: any) => s.section_type === 'coupon');
  const couponSection = productSections.find((s: any) => s.section_type === 'coupon');
  const couponConfig = couponSection?.config || {};

  // Load Google reCAPTCHA v3 script dynamically if enabled and section is active
  useEffect(() => {
    if (hasCaptchaSection && store?.settings?.security_captcha_site_key) {
      const siteKey = store.settings.security_captcha_site_key;
      if (!document.getElementById("recaptcha-script")) {
        const script = document.createElement("script");
        script.id = "recaptcha-script";
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [store, hasCaptchaSection]);

  // Load Firebase dynamically if enabled and section is active
  useEffect(() => {
    if (hasOtpSection && store?.settings?.security_firebase_config_json) {
      if (!document.getElementById("firebase-app-script")) {
        const appScript = document.createElement("script");
        appScript.id = "firebase-app-script";
        appScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js";
        appScript.async = true;
        appScript.onload = () => {
          if (!document.getElementById("firebase-auth-script")) {
            const authScript = document.createElement("script");
            authScript.id = "firebase-auth-script";
            authScript.src = "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js";
            authScript.async = true;
            authScript.onload = () => {
              try {
                const config = JSON.parse(store.settings.security_firebase_config_json);
                // @ts-ignore
                if (window.firebase && !window.firebase.apps.length) {
                  // @ts-ignore
                  window.firebase.initializeApp(config);
                }
              } catch (e) {
                console.error("Firebase initialization failed:", e);
              }
            };
            document.body.appendChild(authScript);
          }
        };
        document.body.appendChild(appScript);
      }
    }
  }, [store, hasOtpSection]);

  // Handle sending OTP
  const handleSendOtp = async () => {
    setError("");
    setSendingOtp(true);

    if (!phone) {
      setError(t("الرجاء إدخال رقم الهاتف أولاً.", "Veuillez d'abord saisir le numéro de téléphone.", "Please enter the phone number first."));
      setSendingOtp(false);
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const algPhoneRegex = /^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$/;
    if (!algPhoneRegex.test(cleanPhone)) {
      setError(t("الرجاء إدخال رقم هاتف جزائري صالح لإرسال الرمز (مثال: 0661234567)", "Veuillez saisir un numéro de téléphone algérien valide (ex: 0661234567).", "Please enter a valid Algerian phone number (e.g., 0661234567)."));
      setSendingOtp(false);
      return;
    }

    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+213' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('213')) {
      formattedPhone = '+' + formattedPhone;
    } else if (formattedPhone.startsWith('00213')) {
      formattedPhone = '+' + formattedPhone.substring(2);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+213' + formattedPhone;
    }

    try {
      // @ts-ignore
      const firebase = window.firebase;
      if (!firebase) {
        setError(t("جاري تحميل نظام الأمان. يرجى الانتظار ثانية ثم المحاولة مجدداً.", "Chargement du système de sécurité. Veuillez patienter et réessayer.", "Loading security system. Please wait a second and try again."));
        setSendingOtp(false);
        return;
      }

      let verifier = recaptchaVerifier;
      if (!verifier) {
        // @ts-ignore
        verifier = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
          size: "invisible",
          callback: () => {}
        });
        setRecaptchaVerifier(verifier);
      }

      // @ts-ignore
      const confirmation = await firebase.auth().signInWithPhoneNumber(formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      if (document.getElementById("recaptcha-container")) {
        document.getElementById("recaptcha-container")!.innerHTML = "";
      }
      setRecaptchaVerifier(null);
      setError(t("فشل إرسال رمز التحقق. يرجى مراجعة إعدادات الهاتف والمحاولة لاحقاً.", "Échec de l'envoi du code de vérification. Veuillez vérifier les paramètres de votre téléphone.", "Failed to send verification code. Please check phone settings and try again."));
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    setError("");
    setVerifyingOtp(true);

    if (!otpCode || otpCode.length < 6) {
      setError(t("الرجاء إدخال رمز التحقق المكون من 6 أرقام.", "Veuillez saisir le code de vérification à 6 chiffres.", "Please enter the 6-digit verification code."));
      setVerifyingOtp(false);
      return;
    }

    if (!confirmationResult) {
      setError(t("لم يتم إرسال الرمز بعد. الرجاء المحاولة مجدداً.", "Le code n'a pas encore été envoyé. Veuillez réessayer.", "The code has not been sent yet. Please try again."));
      setVerifyingOtp(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      const token = await user.getIdToken();
      setFirebaseToken(token);
      setPhoneVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      console.error("Error confirming OTP:", err);
      setError(t("رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.", "Code de vérification incorrect. Veuillez réessayer.", "Incorrect verification code. Please try again."));
    } finally {
      setVerifyingOtp(false);
    }
  };

  useEffect(() => {
    if (!selectedWilaya) { setCommunes([]); return; }
    api.get(`/storefront/${subdomain}/wilayas/${selectedWilaya}/communes/`)
      .then((res) => setCommunes(res.data || []))
      .catch(() => setCommunes([]));
  }, [selectedWilaya, subdomain]);

  // Update shipping rates dynamically based on Wilaya and Delivery Method (Home vs Desk)
  useEffect(() => {
    if (!selectedWilaya) { setDeliveryPrice(0); return; }
    const w = wilayas.find((x) => x.code.toString() === selectedWilaya || x.id.toString() === selectedWilaya);
    if (w) {
      const price = deliveryMethod === 'home' ? w.home_price : (w.desk_price || w.home_price - 200);
      setDeliveryPrice(price);
    }
  }, [selectedWilaya, deliveryMethod, wilayas]);

  // Social proof popup logic
  useEffect(() => {
    if (!product) return;
    const names = ["أحمد", "محمد", "ياسين", "عبد الرحمن", "سفيان", "خالد", "فاطمة", "مريم", "عائشة", "أمينة", "أيوب", "أسامة", "بلال", "سليم"];
    const cities = ["الجزائر العاصمة", "وهران", "قسنطينة", "سطيف", "باتنة", "البليدة", "عنابة", "تلمسان", "بجاية", "الشلف", "سكيكدة", "جيجل", "بسكرة"];
    const getTimes = () => {
      if (store?.language === "en") {
        return ["just now", "1 minute ago", "2 minutes ago", "3 minutes ago", "5 minutes ago"];
      }
      if (store?.language === "fr") {
        return ["à l'instant", "il y a 1 minute", "il y a 2 minutes", "il y a 3 minutes", "il y a 5 minutes"];
      }
      return ["للتو", "قبل دقيقة", "قبل دقيقتين", "قبل 3 دقائق", "قبل 5 دقائق"];
    };
    const times = getTimes();

    const showRandomToast = () => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomTime = times[Math.floor(Math.random() * times.length)];
      setSocialToast({
        name: randomName,
        city: randomCity,
        time: randomTime,
        productTitle: product.title
      });

      // Auto hide after 5 seconds
      setTimeout(() => {
        setSocialToast(null);
      }, 5000);
    };

    // Trigger initial toast after 4s, repeat every 22s
    const initialTimer = setTimeout(showRandomToast, 4000);
    const intervalTimer = setInterval(showRandomToast, 22000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [product]);

  const productPrice = selectedVariant && selectedVariant.price
    ? parseFloat(selectedVariant.price)
    : (product ? parseFloat(product.price) : 0);
  const offers = (product?.quantity_offers || []).sort((a: any, b: any) => a.quantity - b.quantity);
  const bestOffer = offers.length > 0 ? offers.filter((o: any) => o.quantity <= quantity).pop() : null;
  const unitPrice = bestOffer ? bestOffer.price / bestOffer.quantity : productPrice;
  const totalProductPrice = unitPrice * quantity;
  const totalSavings = (productPrice - unitPrice) * quantity;
  const couponDiscountAmount = (couponApplied && couponDiscountPct > 0) ? totalProductPrice * (couponDiscountPct / 100) : 0;
  const totalPrice = totalProductPrice - couponDiscountAmount + deliveryPrice;

  // Get theme styles
  const themeId = product?.theme || store?.active_theme?.slug || '';
  const themeVars = THEME_STYLES[themeId] || {};
  const hasTheme = !!themeId && !!THEME_STYLES[themeId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!product) return;

    // Phone validation client-side (applied by default)
    const cleanPhone = phone.replace(/\s+/g, '');
    const algPhoneRegex = /^(0|\+213|00213|213)?(5|6|7)[0-9]{8}$/;
    if (!algPhoneRegex.test(cleanPhone)) {
      setError(t("الرجاء إدخال رقم هاتف جزائري صالح (مثال: 0661234567)", "Veuillez saisir un numéro de téléphone algérien valide (ex: 0661234567).", "Please enter a valid Algerian phone number (e.g., 0661234567)."));
      return;
    }

    // Firebase Phone OTP check
    if (hasOtpSection && store?.settings?.security_firebase_config_json) {
      if (!phoneVerified || !firebaseToken) {
        setError(t("يرجى إرسال والتحقق من رقم الهاتف قبل إتمام الطلب.", "Veuillez envoyer et vérifier le numéro de téléphone avant de valider la commande.", "Please send and verify your phone number before confirming the order."));
        return;
      }
    }

    // Commitment Check
    if (hasCommitmentSection && !commitmentChecked) {
      setError(t(
        "الرجاء تحديد مربع الالتزام وجدية الطلب للمتابعة.",
        "Veuillez cocher la case d'engagement pour continuer.",
        "Please check the commitment box to continue."
      ));
      const el = document.getElementById("security-commitment-container");
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);

    // reCAPTCHA verification client-side
    let recaptchaToken = null;
    if (hasCaptchaSection && store?.settings?.security_captcha_site_key) {
      const siteKey = store.settings.security_captcha_site_key;
      try {
        // @ts-ignore
        if (window.grecaptcha) {
          // @ts-ignore
          recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'checkout' });
        } else {
          setError(t("فشل تحميل نظام التحقق من الأمان (reCAPTCHA). يرجى المحاولة مجدداً.", "Échec du chargement du système de sécurité (reCAPTCHA). Veuillez réessayer.", "Failed to load security verification system (reCAPTCHA). Please try again."));
          setSubmitting(false);
          return;
        }
      } catch (err) {
        setError(t("فشل التحقق من الكابتشا. يرجى المحاولة لاحقاً.", "Échec de la vérification de la captcha. Veuillez réessayer plus tard.", "Captcha verification failed. Please try again later."));
        setSubmitting(false);
        return;
      }
    }

    const payload: any = {
      full_name: fullName,
      phone,
      phone2,
      wilaya: parseInt(selectedWilaya),
      commune: selectedCommune ? parseInt(selectedCommune) : null,
      address,
      items: [{ product_id: product.id, quantity, variant_id: selectedVariant ? selectedVariant.id : null }],
      source: "product_page",
      delivery_method: deliveryMethod, // Send delivery method details
      recaptcha_token: recaptchaToken,
      firebase_token: firebaseToken,
      commitment_checked: commitmentChecked,
      ab_test_group: rawProduct?.enable_ab_test ? abGroup : null,
      session_id: typeof window !== 'undefined' ? (localStorage.getItem('ab_session_id') || '') : '',
      metadata: {
        ab_test_group: rawProduct?.enable_ab_test ? abGroup : null
      },
      coupon_code: couponApplied ? couponInput.trim() : '',
    };

    // Collect all relevant pixels (store-level + product-specific)
    const allPixels = deduplicatePixels([
      ...(store?.pixels || []),
      ...(product?.pixels || []),
    ]);

    // Generate shared event_id for browser pixel + CAPI deduplication
    const purchaseEventId = generateEventId();

    // #2 — Fire AddToCart pixel event before submit
    if (allPixels.length > 0) {
      initializePixels(allPixels);
      trackPixelEvent(allPixels, 'AddToCart', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: totalPrice,
        currency: 'DZD',
        num_items: quantity,
        ab_test_group: rawProduct?.enable_ab_test ? abGroup : null,
      });
    }

    try {
      const res = await api.post(`/storefront/${subdomain}/checkout/`, {
        ...payload,
        event_id: purchaseEventId, // #4 — pass event_id for CAPI deduplication
      });

      // #2 — Fire Purchase pixel event on success
      if (allPixels.length > 0) {
        trackPixelEvent(allPixels, 'Purchase', {
          content_name: product.title,
          content_ids: [product.id],
          content_type: 'product',
          value: totalPrice,
          currency: 'DZD',
          num_items: quantity,
          ab_test_group: rawProduct?.enable_ab_test ? abGroup : null,
        }, purchaseEventId);
      }

      setOrderNumber(res.data.order_number);
      setOrderDone(true);
    } catch (err: any) {
      let errMsg = t("حدث خطأ أثناء تقديم الطلب. حاول مجدداً.", "Une erreur est survenue lors de la commande. Veuillez réessayer.", "An error occurred while placing your order. Please try again.");
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const messages = Object.entries(data).map(([field, msgs]: [string, any]) => {
            const fieldLabel = field === "phone" ? t("رقم الهاتف", "Numéro de téléphone", "Phone Number") : field === "phone2" ? t("رقم الهاتف الثاني", "Deuxième numéro", "Second Phone Number") : "";
            const prefix = fieldLabel ? `${fieldLabel}: ` : "";
            if (Array.isArray(msgs)) return `${prefix}${msgs.join(', ')}`;
            if (typeof msgs === "string") return `${prefix}${msgs}`;
            return "";
          }).filter(Boolean);
          if (messages.length > 0) {
            errMsg = messages.join(' | ');
          }
        } else if (typeof data === "string") {
          errMsg = data;
        }
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-cairo" dir={isArabic ? "rtl" : "ltr"}>
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm">{t("جاري تحميل المنتج...", "Chargement du produit...", "Loading product...")}</p>
        </div>
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-cairo p-6" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{t("المتجر أو المنتج غير نشط حالياً", "Boutique ou produit actuellement inactif", "Store or product is currently inactive")}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t("عذراً، قد يكون المتجر أو المنتج الذي تحاول الوصول إليه غير نشط أو تم إيقافه مؤقتاً لانتهاء الصلاحية. يرجى مراجعة صاحب المتجر أو الدعم الفني.", "Désolé, la boutique ou le produit auquel vous essayez d'accéder est inactif ou a été temporairement suspendu. Veuillez contacter le propriétaire de la boutique ou le support technique.", "Sorry, the store or product you are trying to access is inactive or has been temporarily suspended. Please contact the store owner or technical support.")}
          </p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            {t("منصة Sovi للتجارة الإلكترونية بالجزائر", "Plateforme e-commerce Sovi en Algérie", "Sovi E-commerce Platform in Algeria")}
          </div>
        </div>
      </div>
    );
  }

  if (orderDone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center font-cairo p-4" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-green-100 p-8 text-center space-y-6">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t("تم استلام طلبك بنجاح!", "Votre commande a été reçue avec succès !", "Your order has been received successfully!")}</h1>
          <p className="text-slate-500">{t("رقم الطلب:", "Numéro de commande :", "Order Number:")}</p>
          <p className="text-3xl font-black text-primary font-outfit">{orderNumber}</p>
          <p className="text-sm text-slate-400">{t("سيتم التواصل معك هاتفياً قريباً لتأكيد طلبك وشحنه", "Vous serez contacté par téléphone sous peu pour confirmer et expédier votre commande.", "You will be contacted by phone shortly to confirm and ship your order.")}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-xl">
            {t("طلب منتج آخر", "Commander un autre produit", "Order another product")}
          </Button>
        </div>
      </div>
    );
  }

  // Themed styles helpers
  const themed = {
    bg: (themeVars as any)['--theme-bg'] || undefined,
    text: (themeVars as any)['--theme-text'] || undefined,
    accent: (themeVars as any)['--theme-accent'] || undefined,
    font: (themeVars as any)['--theme-font'] || undefined,
    btnBg: (themeVars as any)['--theme-btn-bg'] || undefined,
    btnText: (themeVars as any)['--theme-btn-text'] || undefined,
    btnHoverBg: (themeVars as any)['--theme-btn-hover-bg'] || undefined,
    btnRadius: (themeVars as any)['--theme-btn-radius'] || undefined,
    btnBorder: (themeVars as any)['--theme-btn-border'] || undefined,
    btnShadow: (themeVars as any)['--theme-btn-shadow'] || undefined,
    imgRadius: (themeVars as any)['--theme-img-radius'] || undefined,
    imgBorder: (themeVars as any)['--theme-img-border'] || undefined,
    cardBg: (themeVars as any)['--theme-card-bg'] || undefined,
    cardBorder: (themeVars as any)['--theme-card-border'] || undefined,
    sectionRadius: (themeVars as any)['--theme-section-radius'] || undefined,
    titleTransform: (themeVars as any)['--theme-title-transform'] || undefined,
    titleWeight: (themeVars as any)['--theme-title-weight'] || undefined,
    titleSize: (themeVars as any)['--theme-title-size'] || undefined,
    cardBackdrop: (themeVars as any)['--theme-card-backdrop'] || undefined,
  };

  const getSectionStyle = (section: any): React.CSSProperties => {
    const config = section?.config || {};
    if (hasTheme) {
      return {
        backgroundColor: config.background_color || themed.cardBg,
        color: config.color || themed.text,
        borderColor: isMobile ? 'transparent' : themed.cardBorder,
        borderRadius: isMobile ? '0px' : themed.sectionRadius,
        backdropFilter: themed.cardBackdrop,
        borderWidth: isMobile ? '0px' : '1px',
        borderStyle: 'solid',
      };
    }
    return {
      backgroundColor: config.background_color || '#ffffff',
      color: config.color || '#1e293b',
      borderColor: isMobile ? 'transparent' : '#cbd5e1',
      borderRadius: isMobile ? '0px' : '24px',
      borderWidth: isMobile ? '0px' : '1px',
      borderStyle: 'solid',
    };
  };

  const themedCardClass = hasTheme ? 'shadow-none md:shadow-md overflow-hidden' : 'bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md overflow-hidden';

  // Wilaya Search filtering
  const activeWilayas = wilayas.filter(w => w.is_active !== false);
  const filteredWilayas = activeWilayas.filter(w =>
    w.name_ar.includes(wilayaSearch) ||
    w.name_fr.toLowerCase().includes(wilayaSearch.toLowerCase()) ||
    w.code.toString().includes(wilayaSearch)
  );

  // Grouped Wilayas
  const wilayaGroups: Record<string, WilayaOption[]> = {
    "الوسط (الشمال والوسط)": [],
    "الشرق (الولايات الشرقية)": [],
    "الغرب (الولايات الغربية)": [],
    "الجنوب الكبير": []
  };

  filteredWilayas.forEach(w => {
    const region = getWilayaRegion(w.code);
    if (region === "الوسط") wilayaGroups["الوسط (الشمال والوسط)"].push(w);
    else if (region === "الغرب") wilayaGroups["الغرب (الولايات الغربية)"].push(w);
    else if (region === "الجنوب") wilayaGroups["الجنوب الكبير"].push(w);
    else wilayaGroups["الشرق (الولايات الشرقية)"].push(w);
  });

  const selectedWilayaObj = wilayas.find(w => w.code.toString() === selectedWilaya);

  // Sort sections and prepare list
  let sectionsToRender = [...(product.sections || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  
  const hasInfo = sectionsToRender.some(s => s.section_type === 'product_info');
  const hasOffers = sectionsToRender.some(s => s.section_type === 'quantity_offers');
  const hasCheckout = sectionsToRender.some(s => s.section_type === 'checkout');
  
  if (!hasInfo || !hasCheckout) {
    const defaultSections: any[] = [];
    if (!hasInfo) {
      defaultSections.push({ id: 'default-info', section_type: 'product_info', order: -3 });
    }
    if (!hasOffers && offers.length > 0) {
      defaultSections.push({ id: 'default-offers', section_type: 'quantity_offers', order: -2 });
    }
    sectionsToRender.forEach(s => {
      if (s.section_type !== 'product_info' && s.section_type !== 'quantity_offers' && s.section_type !== 'checkout') {
        defaultSections.push(s);
      }
    });
    if (!hasCheckout) {
      defaultSections.push({ id: 'default-checkout', section_type: 'checkout', order: 999 });
    }
    sectionsToRender = defaultSections.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  const productImages = product?.images && product.images.length > 0
    ? [...product.images].sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    : (product?.primary_image ? [{ image_url: product.primary_image }] : []);

  // Group available variant options by attribute label
  const getVariantOptionsGrouped = () => {
    if (!product?.variants) return {};
    const groups: Record<string, string[]> = {};
    product.variants.forEach((v: any) => {
      if (!v.is_active) return;
      (v.options || []).forEach((opt: any) => {
        if (!groups[opt.label]) {
          groups[opt.label] = [];
        }
        if (!groups[opt.label].includes(opt.value)) {
          groups[opt.label].push(opt.value);
        }
      });
    });
    return groups;
  };

  const optionGroups = getVariantOptionsGrouped();

  return (
    <div
      className="min-h-screen font-cairo pb-24"
      dir={isArabic ? "rtl" : "ltr"}
      style={hasTheme ? {
        background: themed.bg?.includes('gradient') ? themed.bg : undefined,
        backgroundColor: !themed.bg?.includes('gradient') ? themed.bg : undefined,
        color: themed.text,
        fontFamily: themed.font,
      } : {
        background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
      }}
    >
      <div className="w-full max-w-full py-0 md:py-8 space-y-0 md:space-y-6 md:px-4">
        {sectionsToRender.map((section: any) => {
          const config = section.config || {};
          const content = (() => {
            switch (section.section_type) {
            case "product_info":
              return (
                <div
                  key={section.id || "product_info"}
                  className={themedCardClass}
                  style={getSectionStyle(section)}
                >
                  <div className="relative aspect-square w-full" style={hasTheme ? { backgroundColor: themed.cardBg } : { backgroundColor: '#f8fafc' }}>
                    {productImages.length > 0 ? (
                      <img
                        src={productImages[activeImageIndex]?.image_url ? getFullImageUrl(productImages[activeImageIndex].image_url) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
                        alt={`${product.title} - ${activeImageIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-300"
                        style={hasTheme ? {
                          borderRadius: isMobile ? '0px' : themed.imgRadius,
                          border: isMobile ? 'none' : themed.imgBorder,
                        } : {}}
                      />
                    ) : (
                      <img
                        src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
                        alt={product.title}
                        className="w-full h-full object-cover"
                        style={hasTheme ? {
                          borderRadius: isMobile ? '0px' : themed.imgRadius,
                          border: isMobile ? 'none' : themed.imgBorder,
                        } : {}}
                      />
                    )}
                    
                    {productImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold z-10 transition-all font-sans"
                        >
                          &#10094;
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm font-bold z-10 transition-all font-sans"
                        >
                          &#10095;
                        </button>
                      </>
                    )}
                    <span className={`absolute top-4 ${isArabic ? 'right-4' : 'left-4'} bg-red-650 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-md z-10`}>
                      {t("الدفع عند الاستلام (COD)", "Paiement à la livraison (COD)", "Cash on Delivery (COD)")}
                    </span>
                  </div>
                  {productImages.length > 1 && (
                    <div className="flex gap-2 px-4 py-3 overflow-x-auto justify-start border-b border-slate-100 mt-2">
                      {productImages.map((img: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`h-12 w-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                            activeImageIndex === idx ? 'border-primary scale-105 ring-1 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={getFullImageUrl(img.image_url)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={`p-4 md:p-6 space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <h1
                      className={hasTheme ? 'font-extrabold animate-fade-in-up' : 'text-xl font-extrabold text-slate-900 animate-fade-in-up'}
                      style={{
                        ...(hasTheme ? {
                          textTransform: themed.titleTransform as any,
                          fontWeight: themed.titleWeight || '800',
                          fontSize: themed.titleSize || '1.25rem',
                        } : {}),
                        color: config.color || (hasTheme ? themed.text : undefined),
                      }}
                    >
                      {product.title}
                    </h1>
                    {product.badges && product.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-start">
                        {product.badges.map((badge: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                            style={hasTheme ? {
                              backgroundColor: `${themed.accent}18`,
                              color: themed.accent,
                              borderColor: `${themed.accent}30`,
                              borderWidth: '1px',
                              borderStyle: 'solid',
                            } : {
                              backgroundColor: 'rgba(99,102,241,0.1)',
                              color: 'rgb(99,102,241)',
                              borderColor: 'rgba(99,102,241,0.2)',
                              borderWidth: '1px',
                              borderStyle: 'solid',
                            }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    {product.description && (
                      <p
                        className={hasTheme ? 'text-sm leading-relaxed opacity-70' : 'text-sm text-slate-500 leading-relaxed'}
                        style={{
                          color: config.color || (hasTheme ? themed.text : undefined),
                        }}
                      >
                        {product.description}
                      </p>
                    )}
                    {Object.keys(optionGroups).length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-dashed border-slate-100">
                        {Object.entries(optionGroups).map(([label, values]) => (
                          <div key={label} className={`space-y-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <span className="text-xs font-bold text-slate-500" style={{ color: config.color || (hasTheme ? themed.text : undefined), opacity: 0.6 }}>{label}:</span>
                            <div className="flex flex-wrap gap-2 justify-start">
                              {values.map((val) => {
                                const isSelected = selectedOptions[label] === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setSelectedOptions(prev => ({ ...prev, [label]: val }))}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                      isSelected
                                        ? "bg-primary border-primary text-white shadow-md scale-102"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                                    style={isSelected && hasTheme ? {
                                      backgroundColor: themed.accent,
                                      borderColor: themed.accent,
                                      color: themed.btnText || '#ffffff',
                                    } : {}}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div
                        className={hasTheme ? 'text-2xl font-black font-outfit' : 'text-2xl font-black text-primary font-outfit'}
                        style={{
                          color: config.color || (hasTheme ? themed.accent : undefined),
                        }}
                      >
                        {formatCurrency(productPrice)}
                      </div>
                      {selectedVariant && (
                        <span className="text-xs text-muted-foreground bg-slate-100 px-2.5 py-1 rounded-full font-bold">
                          {t("تم اختيار:", "Sélectionné :", "Selected:")} {selectedVariant.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            case "quantity_offers": {
              const offersConfig = section.config || {};
              const offersDisplayMode = offersConfig.offers_display_mode || 'grid';
              const offersSectionTitle = offersConfig.offers_section_title || '';
              const defaultOffersTitle = t("عروض الكمية (اختر الكمية لتخفيض السعر)", "Offres de quantité (Choisissez la quantité pour réduire le prix)", "Quantity Offers (Select quantity to reduce price)");
              return offers.length > 0 ? (
                <div
                  key={section.id || "quantity_offers"}
                  className={hasTheme ? `p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}` : `bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}
                  style={getSectionStyle(section)}
                >
                  <h3
                    className={hasTheme ? 'text-sm font-extrabold' : 'text-sm font-extrabold text-slate-900'}
                    style={hasTheme ? { color: themed.text } : {}}
                  >
                    {offersSectionTitle || defaultOffersTitle}
                  </h3>
                  {offersDisplayMode === 'list' ? (
                    /* ── LIST MODE ── */
                    <div className="space-y-2">
                      {/* Base 1-piece row */}
                      <div
                        onClick={() => setQuantity(1)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${
                          hasTheme ? '' : (quantity === 1 ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')
                        }`}
                        style={hasTheme ? {
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: quantity === 1 ? themed.accent : themed.cardBorder,
                          borderRadius: themed.sectionRadius || '12px',
                          backgroundColor: quantity === 1 ? `${themed.accent}10` : 'transparent',
                        } : {
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderRadius: '12px',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                            style={hasTheme ? { borderColor: quantity === 1 ? themed.accent : themed.cardBorder } : { borderColor: quantity === 1 ? 'var(--primary)' : '#e2e8f0' }}
                          >
                            {quantity === 1 && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hasTheme ? themed.accent : 'var(--primary)' }} />}
                          </div>
                          <span className={hasTheme ? 'text-sm font-bold' : 'text-sm font-bold text-slate-900'} style={hasTheme ? { color: themed.text } : {}}>{t("1 قطعة", "1 pièce", "1 piece")}</span>
                        </div>
                        <div className={hasTheme ? 'text-lg font-black font-outfit' : 'text-lg font-black text-slate-900 font-outfit'} style={hasTheme ? { color: themed.text } : {}}>{formatCurrency(productPrice)}</div>
                      </div>
                      {offers.map((offer: any) => {
                        const savePct = productPrice > 0 ? Math.round((1 - offer.price / offer.quantity / productPrice) * 100) : 0;
                        return (
                          <div
                            key={offer.id || offer.quantity}
                            onClick={() => setQuantity(offer.quantity)}
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${
                              hasTheme ? '' : (quantity === offer.quantity ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')
                            }`}
                            style={hasTheme ? {
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: quantity === offer.quantity ? themed.accent : themed.cardBorder,
                              borderRadius: themed.sectionRadius || '12px',
                              backgroundColor: quantity === offer.quantity ? `${themed.accent}10` : 'transparent',
                            } : {
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderRadius: '12px',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                                style={hasTheme ? { borderColor: quantity === offer.quantity ? themed.accent : themed.cardBorder } : { borderColor: quantity === offer.quantity ? 'var(--primary)' : '#e2e8f0' }}
                              >
                                {quantity === offer.quantity && <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hasTheme ? themed.accent : 'var(--primary)' }} />}
                              </div>
                              <span className={hasTheme ? 'text-sm font-bold' : 'text-sm font-bold text-slate-900'} style={hasTheme ? { color: themed.text } : {}}>{offer.quantity} {t("قطع", "pièces", "pieces")}</span>
                              {savePct > 0 && (
                                <span className="text-[10px] text-green-600 font-bold px-1.5 py-0.5 bg-green-50 rounded-full">-{savePct}%</span>
                              )}
                            </div>
                            <div className={hasTheme ? 'text-lg font-black font-outfit' : 'text-lg font-black text-slate-900 font-outfit'} style={hasTheme ? { color: themed.text } : {}}>{formatCurrency(offer.price)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── GRID MODE (default) ── */
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setQuantity(1)}
                        className={`p-3 text-center cursor-pointer transition-all ${
                          hasTheme ? '' : (quantity === 1 ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')
                        }`}
                        style={hasTheme ? {
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: quantity === 1 ? themed.accent : themed.cardBorder,
                          borderRadius: themed.sectionRadius || '12px',
                          backgroundColor: quantity === 1 ? `${themed.accent}10` : 'transparent',
                        } : {
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderRadius: '12px',
                        }}
                      >
                        <div className={hasTheme ? 'text-lg font-black font-outfit' : 'text-lg font-black text-slate-900 font-outfit'} style={hasTheme ? { color: themed.text } : {}}>{formatCurrency(productPrice)}</div>
                        <div className={hasTheme ? 'text-xs opacity-60' : 'text-xs text-slate-500'} style={hasTheme ? { color: themed.text } : {}}>{t("1 قطعة", "1 pièce", "1 piece")}</div>
                      </div>
                      {offers.map((offer: any) => (
                        <div
                          key={offer.id || offer.quantity}
                          onClick={() => setQuantity(offer.quantity)}
                          className={`p-3 text-center cursor-pointer transition-all ${
                            hasTheme ? '' : (quantity === offer.quantity ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200')
                          }`}
                          style={hasTheme ? {
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: quantity === offer.quantity ? themed.accent : themed.cardBorder,
                            borderRadius: themed.sectionRadius || '12px',
                            backgroundColor: quantity === offer.quantity ? `${themed.accent}10` : 'transparent',
                          } : {
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderRadius: '12px',
                          }}
                        >
                          <div className={hasTheme ? 'text-lg font-black font-outfit' : 'text-lg font-black text-slate-900 font-outfit'} style={hasTheme ? { color: themed.text } : {}}>{formatCurrency(offer.price)}</div>
                          <div className={hasTheme ? 'text-xs opacity-60' : 'text-xs text-slate-500'} style={hasTheme ? { color: themed.text } : {}}>{offer.quantity} {t("قطع", "pièces", "pieces")}</div>
                          {productPrice > 0 && (
                            <div className="text-[10px] text-green-600 font-bold mt-0.5">
                              {t("وفر", "Économisez", "Save")} {Math.round((1 - offer.price / offer.quantity / productPrice) * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null;
            }
            case "checkout": {
              const config = section.config || {};
              const form_language = config.form_language ?? store?.language ?? 'ar';
              const tf = (ar: string, fr: string, en: string) => {
                if (form_language === "en") return en;
                if (form_language === "fr") return fr;
                return ar;
              };
              const isFormArabic = form_language !== "fr" && form_language !== "en";
              const title = config.title ?? tf("تقديم طلب شراء (ملء البيانات أدناه)", "Passer une commande (remplir les données ci-dessous)", "Place an Order (fill in the details below)");
              const button_text = config.button_text ?? tf("تأكيد طلب الشراء والدفع عند الاستلام", "Confirmer la commande et payer à la livraison", "Confirm Order & Pay on Delivery");
              const show_address = config.show_address !== false;
              const show_phone2 = config.show_phone2 === true;

              const form_bg_color = config.form_bg_color ?? "#ffffff";
              const form_border_color = config.form_border_color ?? "#cbd5e1";
              const labels_text_color = config.labels_text_color ?? "#1e293b";
              const buttons_bg_color = config.buttons_bg_color ?? "#4f46e5";
              const buttons_text_color = config.buttons_text_color ?? "#ffffff";
              const fields_border_color = config.fields_border_color ?? "#cbd5e1";
              const fields_bg_color = config.fields_bg_color ?? "#ffffff";
              const fields_text_color = config.fields_text_color ?? "#1e293b";

              return (
                <div key={section.id || "checkout"} className="w-full md:px-4">
                  <div 
                    id="checkout-form-card" 
                    dir={isFormArabic ? "rtl" : "ltr"}
                    className={`rounded-none md:rounded-3xl shadow-none md:shadow-xl p-4 md:p-6 space-y-4 md:space-y-6 relative overflow-hidden ${isFormArabic ? 'text-right' : 'text-left'} transition-colors`}
                    style={{ 
                      backgroundColor: form_bg_color, 
                      borderColor: form_border_color,
                      borderWidth: isMobile ? undefined : '1px',
                      borderLeftWidth: isMobile ? '0px' : undefined,
                      borderRightWidth: isMobile ? '0px' : undefined,
                      borderTopWidth: isMobile ? '1px' : undefined,
                      borderBottomWidth: isMobile ? '1px' : undefined,
                      borderStyle: 'solid',
                      color: labels_text_color
                    }}
                  >
                    <div className="absolute top-0 right-0 left-0 h-1.5" style={{ backgroundColor: buttons_bg_color }}></div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" style={{ color: labels_text_color }} />
                      <h2 className="text-lg font-black font-cairo" style={{ color: labels_text_color }}>{title}</h2>
                    </div>

                    {error && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-650 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full name field */}
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                            <User className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {tf("الاسم الكامل", "Nom complet", "Full Name")}
                          </label>
                          <Input
                            required
                            placeholder={tf("الاسم واللقب", "Nom et prénom", "First & Last Name")}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="rounded-xl py-5"
                            style={{
                              backgroundColor: fields_bg_color,
                              color: fields_text_color,
                              borderColor: fields_border_color
                            }}
                          />
                        </div>

                        {/* Phone field */}
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                            <Phone className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {tf("رقم الهاتف", "Numéro de téléphone", "Phone Number")}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              required
                              type="tel"
                              placeholder="06XX XX XX XX / 07XX XX XX XX"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              disabled={phoneVerified || otpSent}
                              className={`border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-5 font-outfit ${isFormArabic ? 'text-right' : 'text-left'} flex-grow`}
                              style={{
                                backgroundColor: fields_bg_color,
                                color: fields_text_color,
                                borderColor: fields_border_color
                              }}
                            />
                            {hasOtpSection && store?.settings?.security_firebase_config_json && !phoneVerified && (
                            <Button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={sendingOtp || otpSent}
                              className="rounded-xl px-4 text-xs font-bold whitespace-nowrap h-11 self-end"
                              style={{
                                backgroundColor: buttons_bg_color,
                                color: buttons_text_color
                              }}
                            >
                              {sendingOtp ? tf("جاري الإرسال...", "Envoi en cours...", "Sending...") : otpSent ? tf("تم إرسال الرمز", "Code envoyé", "Code Sent") : tf("إرسال رمز SMS", "Envoyer le code SMS", "Send SMS Code")}
                            </Button>
                          )}
                          {hasOtpSection && store?.settings?.security_firebase_config_json && phoneVerified && (
                            <div className="h-11 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-650 text-xs font-bold gap-1 self-end">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>{tf("موثق", "Vérifié", "Verified")}</span>
                            </div>
                          )}
                        </div>

                        {/* Firebase reCAPTCHA container */}
                        <div id="recaptcha-container"></div>

                        {/* OTP code input UI */}
                        {hasOtpSection && store?.settings?.security_firebase_config_json && otpSent && !phoneVerified && (
                          <div className="mt-3 p-3 rounded-xl border bg-white space-y-2 animate-in fade-in slide-in-from-top-2" style={{ borderColor: fields_border_color }}>
                            <label className="text-xs font-bold block" style={{ color: labels_text_color }}>{tf("أدخل رمز التحقق (OTP) المكون من 6 أرقام", "Saisissez le code de vérification à 6 chiffres (OTP)", "Enter the 6-digit verification code (OTP)")}</label>
                            <div className="flex gap-2">
                              <Input
                                type="text"
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="text-center font-outfit rounded-xl tracking-widest text-sm flex-grow"
                                style={{
                                  backgroundColor: fields_bg_color,
                                  color: fields_text_color,
                                  borderColor: fields_border_color
                                }}
                              />
                              <Button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={verifyingOtp}
                                className="rounded-xl px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-10"
                              >
                                {verifyingOtp ? tf("جاري التحقق...", "Vérification...", "Verifying...") : tf("تأكيد الرمز", "Confirmer le code", "Confirm Code")}
                              </Button>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setOtpSent(false); if (document.getElementById("recaptcha-container")) document.getElementById("recaptcha-container")!.innerHTML = ""; setRecaptchaVerifier(null); }}
                              className={`text-[10px] hover:underline font-bold ${isFormArabic ? 'text-right' : 'text-left'} block w-full`}
                              style={{ color: buttons_bg_color }}
                            >
                              {tf("تغيير رقم الهاتف أو إعادة المحاولة", "Changer le numéro ou réessayer", "Change phone number or retry")}
                            </button>
                          </div>
                        )}
                      </div>
                      </div>

                      {/* Second Phone field (optional) */}
                      {show_phone2 && (
                        <div className="space-y-1 animate-in fade-in duration-200">
                          <label className="block text-xs font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                            <Phone className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {tf("رقم هاتف إضافي (اختياري)", "Numéro supplémentaire (Optionnel)", "Additional Phone Number (Optional)")}
                          </label>
                          <Input
                            type="tel"
                            placeholder={tf("رقم الهاتف البديل (مثال: 05XX XX XX XX)", "Numéro alternatif (ex: 05XX XX XX XX)", "Alternative phone number (e.g. 05XX XX XX XX)")}
                            value={phone2}
                            onChange={(e) => setPhone2(e.target.value)}
                            className={`rounded-xl py-5 font-outfit ${isFormArabic ? 'text-right' : 'text-left'}`}
                            style={{
                              backgroundColor: fields_bg_color,
                              color: fields_text_color,
                              borderColor: fields_border_color
                            }}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {/* Wilaya Selection - Standard HTML Dropdown */}
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                            <MapPin className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {tf("الولاية", "Wilaya", "Province")}
                          </label>
                          <select
                            required
                            value={selectedWilaya}
                            onChange={(e) => {
                              setSelectedWilaya(e.target.value);
                              setSelectedCommune("");
                            }}
                            className={`flex h-11 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:opacity-50 transition-all ${isFormArabic ? 'text-right' : 'text-left'} font-semibold`}
                            style={{
                              backgroundColor: fields_bg_color,
                              color: fields_text_color,
                              borderColor: fields_border_color
                            }}
                          >
                            <option value="" style={{ backgroundColor: fields_bg_color, color: fields_text_color }}>{tf("اختر الولاية", "Choisir la wilaya", "Select Province")}</option>
                            {wilayas.map((w) => (
                              <option key={w.code} value={w.code} style={{ backgroundColor: fields_bg_color, color: fields_text_color }}>
                                {w.code} - {isFormArabic ? w.name_ar : (store?.language === "en" ? (w.name_en || w.name_fr || w.name_ar) : (w.name_fr || w.name_ar))}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Commune Selection */}
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold flex items-center gap-1" style={{ color: labels_text_color }}>
                            <MapPin className="h-3.5 w-3.5" style={{ color: labels_text_color }} /> {tf("البلدية", "Commune", "Municipality")}
                          </label>
                          <select
                            required
                            disabled={!selectedWilaya}
                            value={selectedCommune}
                            onChange={(e) => setSelectedCommune(e.target.value)}
                            className={`flex h-11 w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:opacity-50 transition-all ${isFormArabic ? 'text-right' : 'text-left'} font-semibold`}
                            style={{
                              backgroundColor: fields_bg_color,
                              color: fields_text_color,
                              borderColor: fields_border_color
                            }}
                          >
                            <option value="" style={{ backgroundColor: fields_bg_color, color: fields_text_color }}>{tf("اختر البلدية", "Choisir la commune", "Select Municipality")}</option>
                            {communes.map((c) => (
                              <option key={c.id} value={c.id} style={{ backgroundColor: fields_bg_color, color: fields_text_color }}>
                                {isFormArabic ? (c.name_ar || c.name) : (c.name || c.name_ar)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Delivery type select cards */}
                      {selectedWilaya && (
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-extrabold" style={{ color: labels_text_color }}>{tf("طريقة الاستلام والتوصيل", "Mode de livraison", "Delivery Method")}</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDeliveryMethod('home')}
                              className="py-3 px-4 rounded-xl border text-xs font-extrabold transition-all duration-200 flex flex-col items-center gap-1.5"
                              style={{
                                backgroundColor: deliveryMethod === 'home' ? `${buttons_bg_color}15` : fields_bg_color,
                                color: deliveryMethod === 'home' ? buttons_bg_color : labels_text_color,
                                borderColor: deliveryMethod === 'home' ? buttons_bg_color : fields_border_color
                              }}
                            >
                              <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> {tf("توصيل للمنزل", "À domicile", "Home Delivery")}</span>
                              {selectedWilayaObj && (
                                <span className="text-[10px] font-bold font-outfit opacity-80">
                                  {selectedWilayaObj.home_price} DZD {tf("(24-72 ساعة)", "(24-72h)", "(24-72h)")}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeliveryMethod('desk')}
                              className="py-3 px-4 rounded-xl border text-xs font-extrabold transition-all duration-200 flex flex-col items-center gap-1.5"
                              style={{
                                backgroundColor: deliveryMethod === 'desk' ? `${buttons_bg_color}15` : fields_bg_color,
                                color: deliveryMethod === 'desk' ? buttons_bg_color : labels_text_color,
                                borderColor: deliveryMethod === 'desk' ? buttons_bg_color : fields_border_color
                              }}
                            >
                              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {tf("استلام من المكتب", "Au bureau", "Office Pickup")}</span>
                              {selectedWilayaObj && (
                                <span className="text-[10px] font-bold font-outfit opacity-80">
                                  {(selectedWilayaObj.desk_price || selectedWilayaObj.home_price - 200)} DZD {tf("(مرونة بالوقت)", "(Flexible)", "(Flexible)")}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Address Details */}
                      {show_address && (
                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold" style={{ color: labels_text_color }}>{tf("العنوان بالتفصيل (اختياري)", "Adresse détaillée (Optionnel)", "Detailed Address (Optional)")}</label>
                          <Input
                            placeholder={tf("اسم الشارع، الحي، رقم المنزل", "Nom de rue, quartier, numéro", "Street name, neighborhood, house number")}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="rounded-xl py-5"
                            style={{
                              backgroundColor: fields_bg_color,
                              color: fields_text_color,
                              borderColor: fields_border_color
                            }}
                          />
                        </div>
                      )}

                      {/* Quantity Selector */}
                      <div className="space-y-1 pt-1">
                        <label className="block text-xs font-extrabold" style={{ color: labels_text_color }}>{tf("الكمية المطلوبة", "Quantité souhaitée", "Quantity Required")}</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-lg transition-all"
                            style={{
                              backgroundColor: fields_bg_color,
                              color: labels_text_color,
                              borderColor: fields_border_color
                            }}
                          >−</button>
                          <span className="flex-grow text-center text-xl font-black font-outfit" style={{ color: labels_text_color }}>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-lg transition-all"
                            style={{
                              backgroundColor: fields_bg_color,
                              color: labels_text_color,
                              borderColor: fields_border_color
                            }}
                          >+</button>
                        </div>
                      </div>

                      {/* Price Calculation details summary */}
                      <div className="rounded-2xl p-4 space-y-2.5 border" style={{ backgroundColor: `${fields_bg_color}10`, borderColor: fields_border_color }}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium font-cairo" style={{ color: labels_text_color, opacity: 0.7 }}>{tf("سعر الوحدة", "Prix unitaire", "Unit Price")}</span>
                          <span className="font-extrabold font-outfit" style={{ color: labels_text_color }}>{formatCurrency(unitPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium font-cairo" style={{ color: labels_text_color, opacity: 0.7 }}>{tf("عدد القطع", "Quantité", "Quantity")}</span>
                          <span className="font-extrabold font-outfit" style={{ color: labels_text_color }}>{quantity}×</span>
                        </div>
                        {totalSavings > 0 && (
                          <div className="flex justify-between items-center text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg">
                            <span className="font-bold font-cairo">{tf("مجموع التوفير", "Économies totales", "Total Savings")}</span>
                            <span className="font-extrabold font-outfit">{formatCurrency(totalSavings)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs border-b pb-2" style={{ borderColor: fields_border_color }}>
                          <span className="font-medium font-cairo" style={{ color: labels_text_color, opacity: 0.7 }}>
                            {tf("تكلفة التوصيل", "Frais de livraison", "Delivery Fee")} ({deliveryMethod === 'home' ? tf("توصيل للمنزل", "À domicile", "Home Delivery") : tf("استلام من المكتب", "Au bureau", "Office Pickup")})
                          </span>
                          <span className="font-extrabold font-outfit" style={{ color: labels_text_color }}>{selectedWilaya ? formatCurrency(deliveryPrice) : "--"}</span>
                        </div>
                        {couponApplied && (
                          <div className="flex justify-between items-center text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg">
                            <span className="font-bold font-cairo">{tf("خصم القسيمة", "Remise coupon", "Coupon Discount")} ({couponDiscountPct}%)</span>
                            <span className="font-extrabold font-outfit">-{formatCurrency(couponDiscountAmount)}</span>
                          </div>
                        )}
                        <div className="pt-2.5 flex justify-between items-center text-sm">
                          <span className="font-black font-cairo" style={{ color: labels_text_color }}>{tf("المجموع الإجمالي", "Total global", "Grand Total")}</span>
                          <span className="text-xl font-black font-outfit" style={{ color: buttons_bg_color }}>
                            {selectedWilaya
                              ? formatCurrency(totalPrice)
                              : couponApplied
                                ? <>{formatCurrency(totalProductPrice - couponDiscountAmount)} <span className="text-xs font-medium opacity-50">+ {tf("توصيل", "livraison", "shipping")}</span></>
                                : tf("بانتظار اختيار الولاية", "En attente du choix de la wilaya", "Awaiting Province selection")
                            }
                          </span>
                        </div>
                      </div>

                      {/* Security Features Notices (applied on order form only) */}
                      {hasCaptchaSection && (
                        <div className="p-3.5 border rounded-2xl space-y-1.5 text-right bg-black/5" style={{ borderColor: fields_border_color }}>
                          <div className="flex items-center gap-1.5 text-[11px] justify-start" style={{ color: labels_text_color }}>
                            <Shield className="h-3.5 w-3.5 flex-shrink-0" style={{ color: buttons_bg_color }} />
                            <span>{tf("هذا الطلب محمي بكابتشا Google reCAPTCHA v3 ضد الطلبات العشوائية.", "Cette commande est protégée par Google reCAPTCHA v3 contre les commandes automatisées.", "This order is protected by Google reCAPTCHA v3 against automated orders.")}</span>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-6 text-base font-extrabold rounded-2xl shadow-lg transition-all font-cairo hover:opacity-95"
                        style={{
                          backgroundColor: buttons_bg_color,
                          color: buttons_text_color
                        }}
                      >
                        {submitting ? tf("جاري تسجيل طلبك...", "Enregistrement de votre commande...", "Registering your order...") : button_text}
                      </Button>
                    </form>
                  </div>
                </div>
              );
            }
            case "text":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? `p-4 md:p-5 ${isArabic ? 'text-right' : 'text-left'}` : `bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 ${isArabic ? 'text-right' : 'text-left'}`}
                  style={getSectionStyle(section)}
                >
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      fontSize: config.font_size || "14px",
                      color: hasTheme ? (config.color !== '#ffffff' ? config.color : themed.text) : (config.color || "#334155"),
                      textAlign: config.text_align || (isArabic ? "right" : "left"),
                    }}
                    dangerouslySetInnerHTML={{ __html: config.content || '' }}
                  />
                </div>
              );
            case "image":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? 'overflow-hidden' : 'bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md overflow-hidden'}
                  style={getSectionStyle(section)}
                >
                  <img
                    src={getFullImageUrl(config.image_url || config.image)}
                    alt={config.caption || ""}
                    className="w-full object-cover"
                    style={hasTheme ? { borderRadius: isMobile ? '0px' : themed.imgRadius } : {}}
                  />
                  {config.caption && (
                    <p
                      className={hasTheme ? 'text-xs text-center py-2 px-4 opacity-60' : 'text-xs text-slate-500 text-center py-2 px-4'}
                      style={hasTheme ? { color: themed.text } : {}}
                    >
                      {config.caption}
                    </p>
                  )}
                </div>
              );
            case "reviews": {
              // Combine curated reviews from config and approved reviews from API
              const allReviews = [
                ...(config.reviews || []).map((r: any) => ({
                  name: r.reviewer_name || r.name || t("زائر", "Visiteur", "Visitor"),
                  city: r.reviewer_city || r.city || "",
                  rating: typeof r.rating === 'number' ? r.rating : 5,
                  text: r.body || r.text || "",
                  photo: r.photo_url || r.photo || r.image_url || "",
                  date: r.created_at ? new Date(r.created_at).toLocaleDateString(isArabic ? 'ar-EG' : (store?.language === 'fr' ? 'fr-FR' : 'en-US')) : ""
                })),
                ...approvedReviews.map((r: any) => ({
                  name: r.reviewer_name || t("زائر", "Visiteur", "Visitor"),
                  city: r.reviewer_city || "",
                  rating: typeof r.rating === 'number' ? r.rating : 5,
                  text: r.body || "",
                  photo: r.photo_url || "",
                  date: r.created_at ? new Date(r.created_at).toLocaleDateString(isArabic ? 'ar-EG' : (store?.language === 'fr' ? 'fr-FR' : 'en-US')) : ""
                }))
              ];

              const totalReviews = allReviews.length;
              const averageRating = totalReviews > 0
                ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                : "5.0";

              const allowBuyerReviews = config.allow_buyer_reviews !== false;

              return (
                <div
                  key={section.id}
                  className={hasTheme ? `p-4 md:p-6 space-y-6 ${isArabic ? 'text-right' : 'text-left'}` : `bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-6 space-y-6 ${isArabic ? 'text-right' : 'text-left'}`}
                  style={getSectionStyle(section)}
                  data-section-type="reviews"
                >
                  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${isArabic ? 'flex-row-reverse' : ''}`} style={hasTheme ? { borderColor: themed.cardBorder } : { borderColor: '#f1f5f9' }}>
                    <div>
                      <h3
                        className={hasTheme ? 'font-extrabold text-lg' : 'font-extrabold text-slate-900 text-lg'}
                        style={hasTheme ? { color: themed.text } : {}}
                      >
                        {t("آراء العملاء", "Avis des clients", "Customer Reviews")}
                      </h3>
                      <p className="text-xs mt-1" style={hasTheme ? { color: themed.text, opacity: 0.6 } : { color: '#64748b' }}>
                        {t("ماذا يقول زبائننا عن هذا المنتج", "Ce que nos clients disent de ce produit", "What our customers say about this product")}
                      </p>
                    </div>

                    <div className={`flex items-center gap-3 bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-150 dark:border-zinc-800 ${isArabic ? 'flex-row-reverse' : ''}`} style={hasTheme ? { backgroundColor: `${themed.accent}05`, borderColor: themed.cardBorder } : {}}>
                      <div className="text-center">
                        <div className="text-2xl font-black" style={hasTheme ? { color: themed.accent } : { color: 'rgb(99,102,241)' }}>
                          {averageRating}
                        </div>
                        <div className="text-[10px]" style={hasTheme ? { color: themed.text, opacity: 0.6 } : { color: '#64748b' }}>
                          {t("من 5 نجوم", "sur 5 étoiles", "out of 5 stars")}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800" />
                      <div>
                        <div className={`flex text-amber-400 text-sm gap-0.5 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span key={idx}>
                              {idx < Math.round(Number(averageRating)) ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <div className={`text-xs ${isArabic ? 'text-right' : 'text-left'} mt-0.5`} style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>
                          {t("بناءً على", "Basé sur", "Based on")} {totalReviews} {t("تقييم", "avis", "reviews")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {totalReviews > 0 ? (
                      allReviews.map((r: any, i: number) => (
                        <div
                          key={i}
                          className="pb-4 last:pb-0 border-b last:border-b-0 border-slate-100 dark:border-zinc-800 flex flex-col gap-2"
                          style={hasTheme ? { borderColor: themed.cardBorder } : {}}
                        >
                          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                                style={hasTheme ? {
                                  backgroundColor: `${themed.accent}18`,
                                  color: themed.accent,
                                } : {
                                  backgroundColor: 'rgba(99,102,241,0.1)',
                                  color: 'rgb(99,102,241)',
                                }}
                              >
                                {(r.name || "?")[0].toUpperCase()}
                              </div>
                              <div className={isArabic ? 'text-right' : 'text-left'}>
                                <div className={`flex items-center gap-1.5 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                                  <span
                                    className={hasTheme ? 'text-xs font-extrabold' : 'text-xs font-extrabold text-slate-800'}
                                    style={hasTheme ? { color: themed.text } : {}}
                                  >
                                    {r.name}
                                  </span>
                                  {r.city && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-zinc-400">
                                      {r.city}
                                    </span>
                                  )}
                                </div>
                                <div className={`flex text-amber-400 text-[10px] mt-0.5 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                </div>
                              </div>
                            </div>
                            {r.date && (
                              <span className="text-[10px]" style={hasTheme ? { color: themed.text, opacity: 0.5 } : { color: '#94a3b8' }}>
                                {r.date}
                              </span>
                            )}
                          </div>

                          <p
                            className={hasTheme ? `text-xs md:text-sm ${isArabic ? 'mr-10' : 'ml-10'} opacity-80 leading-relaxed` : `text-xs md:text-sm text-slate-600 ${isArabic ? 'mr-10' : 'ml-10'} leading-relaxed`}
                            style={hasTheme ? { color: themed.text } : {}}
                          >
                            {r.text}
                          </p>

                          {r.photo && (
                            <div className={isArabic ? 'mr-10 mt-1' : 'ml-10 mt-1'}>
                              <a href={getFullImageUrl(r.photo)} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={getFullImageUrl(r.photo)}
                                  alt="Review photo"
                                  className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-zinc-800 hover:scale-105 transition-transform cursor-pointer"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className={hasTheme ? 'text-xs text-center py-6 opacity-50' : 'text-xs text-slate-400 text-center py-6'}>لا توجد آراء منشورة بعد. كن أول من يشارك رأيه!</p>
                    )}
                  </div>

                  {/* Form to submit review (if enabled) */}
                  {allowBuyerReviews && (
                    <div className="border-t pt-5 mt-4" style={hasTheme ? { borderColor: themed.cardBorder } : { borderColor: '#f1f5f9' }}>
                      <h4
                        className={hasTheme ? 'font-extrabold text-sm mb-3' : 'font-extrabold text-slate-800 text-sm mb-3'}
                        style={hasTheme ? { color: themed.text } : {}}
                      >
                        أضف تقييمك للمنتج
                      </h4>

                      {reviewSubmitSuccess ? (
                        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-400 text-xs p-4 rounded-xl text-center font-bold">
                          ✓ شكراً على تقييمك! سيتم نشره بعد المراجعة من قبل إدارة المتجر.
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="space-y-3">
                          {reviewSubmitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg text-center font-medium">
                              {reviewSubmitError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                            <div className="text-right">
                              <label className="block text-[11px] mb-1 font-bold" style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>الاسم الكامل *</label>
                              <input
                                type="text"
                                required
                                value={reviewForm.reviewer_name}
                                onChange={(e) => setReviewForm(prev => ({ ...prev, reviewer_name: e.target.value }))}
                                placeholder="مثال: محمد علي"
                                className="w-full rounded-lg border px-3 py-2 text-xs text-right focus-visible:outline-none focus:ring-1 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-slate-400"
                                style={hasTheme ? { color: themed.text, backgroundColor: themed.bg, borderColor: themed.cardBorder } : {}}
                              />
                            </div>
                            <div className="text-right">
                              <label className="block text-[11px] mb-1 font-bold" style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>المدينة (اختياري)</label>
                              <input
                                type="text"
                                value={reviewForm.reviewer_city}
                                onChange={(e) => setReviewForm(prev => ({ ...prev, reviewer_city: e.target.value }))}
                                placeholder="مثال: الجزائر، وهران"
                                className="w-full rounded-lg border px-3 py-2 text-xs text-right focus-visible:outline-none focus:ring-1 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-slate-400"
                                style={hasTheme ? { color: themed.text, backgroundColor: themed.bg, borderColor: themed.cardBorder } : {}}
                              />
                            </div>
                          </div>

                          <div className="text-right">
                            <label className="block text-[11px] mb-1 font-bold" style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>تقييمك للمنتج *</label>
                            <div className="flex gap-1.5 justify-end">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button
                                  type="button"
                                  key={stars}
                                  onClick={() => setReviewForm(prev => ({ ...prev, rating: stars }))}
                                  className="text-xl transition-transform hover:scale-110"
                                  style={{
                                    color: stars <= reviewForm.rating ? '#fbbf24' : '#d1d5db'
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-right">
                            <label className="block text-[11px] mb-1 font-bold" style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>ملاحظاتك أو رأيك *</label>
                            <textarea
                              required
                              value={reviewForm.body}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, body: e.target.value }))}
                              placeholder="اكتب هنا رأيك حول جودة المنتج، التوصيل، إلخ..."
                              className="w-full rounded-lg border px-3 py-2 text-xs text-right min-h-[70px] focus-visible:outline-none focus:ring-1 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 focus:ring-slate-400"
                              style={hasTheme ? { color: themed.text, backgroundColor: themed.bg, borderColor: themed.cardBorder } : {}}
                            />
                          </div>

                          {/* Image Attachment */}
                          <div className="flex flex-col items-end gap-1.5 text-right">
                            <label className="block text-[11px] font-bold" style={hasTheme ? { color: themed.text, opacity: 0.8 } : { color: '#475569' }}>إرفاق صورة (اختياري)</label>
                            <div className="flex items-center gap-2 justify-end w-full">
                              {reviewForm.photo_url && (
                                <div className="relative h-12 w-12 border rounded-lg overflow-hidden group">
                                  <img src={getFullImageUrl(reviewForm.photo_url)} alt="Review attachment preview" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewForm(prev => ({ ...prev, photo_url: '' }));
                                      setReviewPhotoName('');
                                    }}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] transition-opacity font-bold"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              )}
                              <label
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-xs font-semibold"
                                style={hasTheme ? { color: themed.text, borderColor: themed.cardBorder } : { color: '#475569', borderColor: '#cbd5e1' }}
                              >
                                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{reviewPhotoUploading ? 'جاري الرفع...' : reviewPhotoName ? 'تغيير الصورة' : 'إضافة صورة'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={reviewPhotoUploading}
                                  onChange={handleReviewPhotoUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            {reviewPhotoName && !reviewForm.photo_url && !reviewPhotoUploading && (
                              <span className="text-[10px] text-red-500">فشل رفع الصورة، يرجى إعادة المحاولة</span>
                            )}
                            {reviewPhotoName && reviewForm.photo_url && (
                              <span className="text-[9px] text-emerald-600 font-medium">✓ تم إرفاق الصورة ({reviewPhotoName})</span>
                            )}
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={reviewSubmitting || reviewPhotoUploading}
                              className="px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                              style={hasTheme ? {
                                backgroundColor: themed.btnBg || themed.accent,
                                color: themed.btnText || '#ffffff',
                                borderRadius: themed.btnRadius || '12px',
                              } : {
                                backgroundColor: 'rgb(99,102,241)',
                                color: '#ffffff',
                              }}
                            >
                              {reviewSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            case "before_after":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? 'p-4 md:p-5 text-right' : 'bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 text-right'}
                  style={getSectionStyle(section)}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {(config.before_url || config.before) && (
                      <div>
                        <p
                          className={hasTheme ? 'text-xs font-bold mb-1 text-center opacity-60' : 'text-xs font-bold text-slate-500 mb-1 text-center'}
                          style={hasTheme ? { color: themed.text } : {}}
                        >
                          {t("قبل", "Avant", "Before")}
                        </p>
                        <img src={getFullImageUrl(config.before_url || config.before)} alt="Before" className="w-full" style={{ borderRadius: hasTheme && !isMobile ? themed.imgRadius : '12px', border: hasTheme && !isMobile ? themed.imgBorder : undefined }} />
                      </div>
                    )}
                    {(config.after_url || config.after) && (
                      <div>
                        <p
                          className={hasTheme ? 'text-xs font-bold mb-1 text-center opacity-60' : 'text-xs font-bold text-slate-500 mb-1 text-center'}
                          style={hasTheme ? { color: themed.text } : {}}
                        >
                          {t("بعد", "Après", "After")}
                        </p>
                        <img src={getFullImageUrl(config.after_url || config.after)} alt="After" className="w-full" style={{ borderRadius: hasTheme && !isMobile ? themed.imgRadius : '12px', border: hasTheme && !isMobile ? themed.imgBorder : undefined }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            case "features":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? `p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}` : `bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}
                  style={getSectionStyle(section)}
                >
                  <h3
                    className={hasTheme ? 'font-extrabold' : 'font-extrabold text-slate-900'}
                    style={hasTheme ? { color: themed.text } : {}}
                  >
                    {t("مميزات المنتج", "Caractéristiques du produit", "Product Features")}
                  </h3>
                  {(config.features || []).length > 0 ? (
                    <ul className="space-y-2">
                      {(Array.isArray(config.features) ? config.features : config.features.split("\n").filter(Boolean)).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm justify-start" style={hasTheme ? { color: themed.text } : { color: '#475569' }}>
                          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={hasTheme ? themed.accent : '#22c55e'} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={hasTheme ? 'text-xs text-center py-2 opacity-50' : 'text-xs text-slate-400 text-center py-2'}>{t("لا توجد مميزات مضافة", "Aucune caractéristique ajoutée", "No features added")}</p>
                  )}
                </div>
              );
            case "security_otp":
            case "security_captcha":
            case "security_phone_validation":
            case "security_rate_limit":
            case "security_algerian_ip":
              return null;
            case "security_commitment": {
              const commitmentText = config.text || (isArabic ? "أتعهد بجدية طلبي واستلام المنتج عند وصوله من شركة التوصيل." : (store?.language === 'fr' ? "Je m'engage à être sérieux concernant ma commande et à la réceptionner." : "I commit to my order and promise to receive it."));
              return (
                <div
                  key={section.id}
                  id="security-commitment-container"
                  className={hasTheme ? `p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}` : `bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}
                  style={getSectionStyle(section)}
                >
                  <div className={`flex items-start gap-3 justify-start`}>
                    <input
                      type="checkbox"
                      id="security-commitment-checkbox"
                      checked={commitmentChecked}
                      onChange={(e) => setCommitmentChecked(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 accent-primary flex-shrink-0 cursor-pointer mt-0.5"
                    />
                    <label
                      htmlFor="security-commitment-checkbox"
                      className="text-sm font-bold select-none cursor-pointer leading-relaxed"
                      style={hasTheme ? { color: themed.text } : { color: '#1e293b' }}
                    >
                      {commitmentText} <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>
              );
            }
            case "header":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? 'w-full py-4 px-4 md:px-6 border-b flex items-center justify-between' : `w-full bg-white border-b border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 flex items-center justify-between ${isArabic ? 'text-right' : 'text-left'}`}
                  style={{
                    backgroundColor: config.background_color || (hasTheme ? (themed.bg || '#ffffff') : '#ffffff'),
                    color: config.color || (hasTheme ? themed.text : '#1e293b'),
                    borderColor: hasTheme ? (themed.cardBorder || '#f1f5f9') : '#cbd5e1',
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                  }}
                >
                  {store?.logo ? (
                    <Link href={getStorefrontLink(subdomain, "/")}>
                      <img 
                        src={getFullImageUrl(store.logo)} 
                        alt={store.name} 
                        className="h-9 w-auto object-contain flex-shrink-0 cursor-pointer hover:opacity-95" 
                      />
                    </Link>
                  ) : (
                    <Link href={getStorefrontLink(subdomain, "/")} className="flex items-center gap-2 flex-grow justify-start">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                        style={hasTheme ? { 
                          backgroundColor: `${themed.accent || '#6366f1'}15`,
                          color: themed.accent || '#6366f1',
                        } : {
                          backgroundColor: 'rgba(99,102,241,0.1)',
                          color: 'rgb(99,102,241)',
                        }}
                      >
                        <span>{store?.name?.charAt(0).toUpperCase() || "M"}</span>
                      </div>
                      <div
                        className={`text-sm font-bold leading-relaxed flex-grow ${isArabic ? 'text-right' : 'text-left'} font-cairo`}
                        style={{
                          fontSize: config.font_size || "18px",
                          color: config.color || themed.text || "#111111",
                          textAlign: config.text_align || (isArabic ? "right" : "left"),
                        }}
                        dangerouslySetInnerHTML={{ __html: config.content || store?.name || t("متجرنا", "Notre Boutique", "Our Store") }}
                      />
                    </Link>
                  )}
                </div>
              );
            case "footer":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? 'w-full text-center py-6 border-t' : 'w-full bg-white border-t border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5 text-center'}
                  style={{
                    backgroundColor: config.background_color || (hasTheme ? (themed.bg || '#ffffff') : '#ffffff'),
                    color: config.color || (hasTheme ? themed.text : '#1e293b'),
                    borderColor: hasTheme ? (themed.cardBorder || '#f1f5f9') : '#cbd5e1',
                    borderTopWidth: '1px',
                    borderTopStyle: 'solid',
                  }}
                >
                  <div
                    className="text-xs opacity-80 leading-relaxed font-cairo"
                    style={{
                      fontSize: config.font_size || "14px",
                      color: config.color || themed.text || "#64748b",
                      textAlign: config.text_align || "center",
                    }}
                    dangerouslySetInnerHTML={{ __html: config.content || t("© جميع الحقوق محفوظة", "© Tous droits réservés", "© All rights reserved") }}
                  />
                </div>
              );
            case "coupon":
              return (
                <div
                  key={section.id}
                  className={hasTheme ? 'p-4 md:p-5' : 'bg-white border-y border-slate-100 md:border md:rounded-3xl md:shadow-md p-4 md:p-5'}
                  style={getSectionStyle(section)}
                >
                  <div className="text-center space-y-3">
                    <Tag className="h-6 w-6 mx-auto text-amber-500" />
                    <p className="text-sm font-bold text-amber-700">
                      {t("لديك كود خصم؟ أدخله هنا", "Avez-vous un code de réduction ?", "Have a discount code?")}
                    </p>
                    <div className="flex gap-2 max-w-xs mx-auto">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                        placeholder={t("أدخل كود الخصم", "Entrez le code", "Enter code")}
                        className="flex-grow px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-sm text-center text-slate-900 font-outfit tracking-widest uppercase placeholder:text-slate-400 placeholder:tracking-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        disabled={couponApplied}
                      />
                      {couponApplied ? (
                        <button
                          onClick={() => { setCouponApplied(false); setCouponInput(""); setCouponDiscountPct(0); }}
                          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all"
                        >
                          {t("إلغاء", "Annuler", "Cancel")}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const entered = couponInput.trim().toLowerCase();
                            const validCode = (config.code || "").trim().toLowerCase();
                            if (entered && entered === validCode) {
                              setCouponApplied(true);
                              setCouponDiscountPct(Number(config.discount_percent) || 0);
                              setCouponError("");
                            } else {
                              setCouponError(t("رمز الخصم غير صالح", "Code promo invalide", "Invalid coupon code"));
                              setCouponApplied(false);
                              setCouponDiscountPct(0);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all"
                        >
                          {t("تطبيق", "Appliquer", "Apply")}
                        </button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 font-bold">{couponError}</p>
                    )}
                    {couponApplied && (
                      <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-block">
                        {t("تم تطبيق الخصم بنجاح! خصم", "Remise appliquée avec succès ! Réduction de", "Coupon applied successfully! Discount of")} {config.discount_percent || 0}%
                      </p>
                    )}
                  </div>
                </div>
              );
            case "custom_html": {
              const htmlCode = config.html || "";
              if (!htmlCode) return null;
              return (
                <div
                  key={section.id}
                  className="w-full text-right"
                  dangerouslySetInnerHTML={{ __html: htmlCode }}
                />
              );
            }
            default:
              return null;
          }
        })();
        if (!content) return null;
        return (
          <div key={section.id || section.section_type} data-section-type={section.section_type}>
            {content}
          </div>
        );
      })}
    </div>

      {/* Floating Animated Social Urgency bubble */}
      <AnimatePresence>
        {socialToast && (
          <div className={`fixed bottom-4 ${isArabic ? 'right-4' : 'left-4'} z-50 max-w-sm w-full bg-slate-900/95 text-white border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-fade-in-up backdrop-blur-md`}>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
              <ShoppingBag className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className={`flex-grow ${isArabic ? 'text-right' : 'text-left'} text-xs`}>
              <p className="font-medium text-slate-300" dangerouslySetInnerHTML={{ __html: t(
                `قام العميل <strong className="text-white font-bold">${socialToast.name}</strong> من <strong className="text-primary font-bold">${socialToast.city}</strong>`,
                `Le client <strong className="text-white font-bold">${socialToast.name}</strong> de <strong className="text-primary font-bold">${socialToast.city}</strong>`,
                `Customer <strong className="text-white font-bold">${socialToast.name}</strong> from <strong className="text-primary font-bold">${socialToast.city}</strong>`
              ) }} />
              <p className="mt-0.5 text-[11px] text-white/90 truncate font-semibold">{t("بشراء:", "a acheté :", "purchased:")} {socialToast.productTitle}</p>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">{socialToast.time} ✅</span>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Sticky Order CTA Button ===== */}
      {(() => {
        const checkoutSection = (product?.sections || []).find((s: any) => s.section_type === 'checkout');
        const checkoutConfig = checkoutSection?.config || {};
        // Respect the on/off toggle (defaults to ON if never set)
        const showSticky = checkoutConfig.show_sticky_cta !== false;
        if (!showSticky) return null;
        // Use dedicated sticky colors, fall back to form button colors
        const ctaBg = checkoutConfig.sticky_cta_bg_color || checkoutConfig.buttons_bg_color || '#4f46e5';
        const ctaText = checkoutConfig.sticky_cta_text_color || checkoutConfig.buttons_text_color || '#ffffff';
        // Use dedicated sticky label, fall back to form button label
        const ctaLabel = checkoutConfig.sticky_cta_text || checkoutConfig.button_text || t("اطلب الآن", "Commander maintenant", "Order Now");
        return (
          <div
            className={`fixed bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pt-2 transition-all duration-300 ${
              isFormVisible ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
            }`}
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 100%)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('checkout-form-card');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full max-w-md flex items-center justify-center gap-2.5 font-black font-cairo text-base py-4 rounded-2xl shadow-2xl active:scale-95 transition-transform"
              style={{
                backgroundColor: ctaBg,
                color: ctaText,
                boxShadow: `0 8px 32px ${ctaBg}55`,
              }}
            >
              <ShoppingCart className="h-5 w-5 flex-shrink-0" />
              <span>{ctaLabel}</span>
            </button>
          </div>
        );
      })()}
    </div>
  );
}
