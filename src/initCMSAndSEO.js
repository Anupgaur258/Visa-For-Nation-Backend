import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');

// Initial CMS Data matching Home.jsx, About.jsx, Contact.jsx
const initialCMS = {
  home: {
    hero: {
      eyebrow: "Trusted Visa & Immigration Consultants",
      title: "Your Global Journey Begins with",
      accent: "Visa For Nation",
      subtitle: "Expert guidance for Permanent Residency, Work Permits, Study Visas, and Tourist Visas from Delhi's leading immigration consultancy.",
      experienceYears: "10+",
      successRate: "98%",
      happyClients: "15,000+",
      bannerImage: ""
    },
    why_us: {
      tag: "Why Choose Us",
      title: "Why Visa For Nation Stands Out",
      accent: "From The Rest",
      items: [
        {
          title: "Visa Application Assistance",
          desc: "Dedicated support for documentation, filings, and embassy requirements — ensuring a smooth and hassle-free process."
        },
        {
          title: "Settlement Services",
          desc: "Guidance for accommodation, lifestyle setup, and essential services — helping you settle comfortably abroad."
        },
        {
          title: "Career Assistance",
          desc: "Support for job search, profile building, and connections — empowering you to start strong in your new country."
        }
      ]
    },
    contact_banner: {
      title: "Ready to Start Your Global Journey?",
      subtitle: "Talk to our senior immigration consultants in Kailash Colony, New Delhi for a free eligibility check.",
      phone: "+91 7677666677",
      email: "info@visafornation.com"
    }
  },
  about: {
    hero: {
      eyebrow: "About Us",
      title: "Delhi's Trusted Immigration",
      accent: "Consultants",
      lead: "Honest guidance, properly documented applications and support at every step."
    },
    purpose: {
      visionTitle: "A World Without Boundaries",
      visionText: "To become a trusted immigration consultancy connecting people with global opportunities through ethical, informed guidance.",
      missionTitle: "Making Your Journey Simpler",
      missionText: "To simplify the immigration process through specialised consultation, transparent communication and end-to-end support."
    },
    commitment: {
      title: "Your Dreams Deserve The Right Direction",
      tag: "OUR COMMITMENT",
      text1: "At Visa For Nation, we believe every global dream deserves the right guidance — delivered with integrity, expertise and commitment.",
      text2: "We are a dedicated team of visa professionals helping individuals, students, skilled professionals and families explore international opportunities."
    }
  },
  contact: {
    office: {
      address: "HS-33, Kailash Colony Market, Greater Kailash-1, New Delhi, Delhi 110048",
      phone: "+91 7677666677",
      email: "info@visafornation.com",
      whatsapp: "+91 7677666677",
      timings: "Mon to Sat: 10:00 AM – 6:00 PM",
      saturday: "10:00 AM – 4:00 PM",
      sunday: "Closed",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.545628094768!2d77.2424971!3d28.553374!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x83678360f861adbb%3A0x6e0d63b897943054!2sVisa%20For%20Nation!5e0!3m2!1sen!2sin"
    }
  }
};

// Initial SEO Data
const initialSEO = [
  {
    _id: "seo_home",
    pageUrl: "/",
    metaTitle: "Best Immigration Consultants in Delhi | Visa For Nation",
    metaDescription: "Visa For Nation is Delhi's trusted immigration consultancy for Canada PR, Australia PR, Study Abroad, Work Permits, and Tourist Visas. Free assessment.",
    keywords: "immigration consultants in delhi, canada pr, australia pr, study abroad, visa for nation, kailash colony",
    canonicalUrl: "https://visafornation.com/",
    ogImage: "/logo.png",
    customHeaderTags: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Visa For Nation",
  "url": "https://visafornation.com/",
  "telephone": "+91-7677666677",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "HS-33, Kailash Colony Market, Greater Kailash-1",
    "addressLocality": "New Delhi",
    "postalCode": "110048",
    "addressCountry": "IN"
  }
}
</script>`,
    status: "active"
  },
  {
    _id: "seo_about",
    pageUrl: "/about",
    metaTitle: "About Visa For Nation | Trusted Immigration Consultancy Delhi",
    metaDescription: "Learn about Visa For Nation, our vision, mission, and experienced team guiding thousands of clients to successful international migration.",
    keywords: "about visa for nation, immigration experts delhi, visa consultancy greater kailash",
    canonicalUrl: "https://visafornation.com/about",
    ogImage: "/logo.png",
    customHeaderTags: "",
    status: "active"
  },
  {
    _id: "seo_contact",
    pageUrl: "/contact-us",
    metaTitle: "Contact Visa For Nation | Office in Kailash Colony New Delhi",
    metaDescription: "Get in touch with Visa For Nation in Kailash Colony Market, Greater Kailash-1, New Delhi. Call +91 7677666677 for a free eligibility evaluation.",
    keywords: "contact visa for nation, immigration office delhi, kailash colony visa consultant",
    canonicalUrl: "https://visafornation.com/contact-us",
    ogImage: "/logo.png",
    customHeaderTags: "",
    status: "active"
  },
  {
    _id: "seo_canada_pr",
    pageUrl: "/visa/pr/canada",
    metaTitle: "Canada PR Visa 2026: Express Entry, PNP & Process from India",
    metaDescription: "Apply for Canada Permanent Residency (PR) with Visa For Nation. Expert guidance for Express Entry CRS score, PNP nominations, and document filing.",
    keywords: "canada pr visa, express entry draw, pnp canada, canada immigration delhi",
    canonicalUrl: "https://visafornation.com/visa/pr/canada",
    ogImage: "/logo.png",
    customHeaderTags: "",
    status: "active"
  },
  {
    _id: "seo_australia_pr",
    pageUrl: "/visa/pr/australia",
    metaTitle: "Australia PR Visa Guide: Subclass 189, 190, 491 Points & Process",
    metaDescription: "Complete guide for Australia PR from India. Calculate points, understand Subclass 189, 190 and 491 visas, skills assessment, and eligibility.",
    keywords: "australia pr, subclass 189, subclass 190, subclass 491, australia immigration delhi",
    canonicalUrl: "https://visafornation.com/visa/pr/australia",
    ogImage: "/logo.png",
    customHeaderTags: "",
    status: "active"
  }
];

// Write cms.json
const cmsPath = path.join(DATA_DIR, 'cms.json');
if (!fs.existsSync(cmsPath)) {
  fs.writeFileSync(cmsPath, JSON.stringify(initialCMS, null, 2), 'utf8');
  console.log('Created cms.json');
}

// Write seo.json
const seoPath = path.join(DATA_DIR, 'seo.json');
if (!fs.existsSync(seoPath)) {
  fs.writeFileSync(seoPath, JSON.stringify(initialSEO, null, 2), 'utf8');
  console.log('Created seo.json');
}

// Write initial inquiries.json with realistic samples if not existing
const inqPath = path.join(DATA_DIR, 'inquiries.json');
if (!fs.existsSync(inqPath)) {
  const sampleInquiries = [
    {
      _id: "inq_1711200001",
      name: "Amanpreet Singh",
      phone: "+91 9811234567",
      email: "aman.singh@example.com",
      category: "PR Visa",
      country: "Canada",
      visaType: "Express Entry / PNP",
      ageGroup: "25-32",
      qualification: "Master's Degree",
      experience: "5+ Years",
      languageScore: "IELTS 8.0",
      sourcePage: "/visa/pr/canada",
      message: "Looking for Canada Express Entry assessment. Working as Senior Software Engineer.",
      status: "new",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      _id: "inq_1711200002",
      name: "Rohit Verma",
      phone: "+91 9988776655",
      email: "rohit.verma@example.com",
      category: "PR Visa",
      country: "Australia",
      visaType: "Subclass 189 / 190",
      ageGroup: "25-32",
      qualification: "Bachelor's in Engineering",
      experience: "4 Years",
      languageScore: "PTE 79+",
      sourcePage: "/visa/pr/australia",
      message: "Mechanical Engineer with 4 yrs experience. Need ACS skills assessment support.",
      status: "contacted",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      _id: "inq_1711200003",
      name: "Sneha Nair",
      phone: "+91 9876543210",
      email: "sneha.nair@example.com",
      category: "Study Visa",
      country: "Germany",
      visaType: "Master's in Data Science",
      intake: "Winter 2026",
      qualification: "B.Tech CSE (CGPA 8.4)",
      sourcePage: "/study-in-germany",
      message: "Interested in public university admissions in Germany with tuition-free courses.",
      status: "new",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      _id: "inq_1711200004",
      name: "Rajesh Khanna",
      phone: "+91 9711002233",
      email: "rajesh.khanna@example.com",
      category: "Tourist Visa",
      country: "USA",
      visaType: "B1/B2 Visitor",
      travelDate: "December 2026",
      sourcePage: "/usa-tourist-visa",
      message: "Family of 3 planning holiday to New York and California. Need DS-160 and slot appointment.",
      status: "in_progress",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      _id: "inq_1711200005",
      name: "Vikram Malhotra",
      phone: "+91 9812345678",
      email: "vikram.m@example.com",
      category: "Work Permit",
      country: "Singapore",
      visaType: "Employment Pass (EP)",
      experience: "8+ Years",
      qualification: "MBA Finance",
      sourcePage: "/singapore-work-permit",
      message: "Have interview with fintech firm in Singapore. Need assistance with EP application.",
      status: "closed",
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];
  fs.writeFileSync(inqPath, JSON.stringify(sampleInquiries, null, 2), 'utf8');
  console.log('Created inquiries.json with realistic samples');
}
