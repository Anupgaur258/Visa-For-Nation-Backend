import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load existing pages
const existingPagesPath = path.resolve(__dirname, '../data/pages.json');
let existingPages = [];
try {
  existingPages = JSON.parse(fs.readFileSync(existingPagesPath, 'utf8'));
} catch (e) {
  existingPages = [];
}

const navPath = path.resolve(__dirname, '../../frontend/src/data/nav.json');
const nav = JSON.parse(fs.readFileSync(navPath, 'utf8'));

const existingUrls = new Set(existingPages.map(p => p.fullUrl.replace(/^\/+/, '')));

// Comprehensive templates for each category
const getPageData = (href, label, category, subCategory) => {
  const url = href.replace(/^\/+/, '');
  const cleanLabel = label.trim();

  // 1. Germany Opportunity Card
  if (url === 'germany-opportunity-card') {
    return {
      category: 'migrate', subCategory: 'germany', slug: 'germany-opportunity-card', fullUrl: url,
      bannerImage: '', heroBadge: 'Germany Chancenkarte 2026',
      heroTitle: 'Germany Opportunity Card (Chancenkarte): Complete Guide & Points Calculator',
      heroDesc: 'Live and search for a qualified job in Germany for up to 1 year with the new points-based Opportunity Card.',
      content: `
        <p>The German Opportunity Card (<em>Chancenkarte</em>), launched under Germany’s updated Skilled Immigration Act, is a revolutionary points-based visa allowing skilled professionals from non-EU nations to enter Germany and search for qualified employment without needing a prior job offer.</p>
        <p>At Visa For Nation, our experienced immigration consultants evaluate your points, guide your recognition of foreign qualifications (ZAB/Anabin), and ensure a smooth visa filing at the German embassy in Delhi.</p>

        <h2>What is the Germany Opportunity Card?</h2>
        <p>The Chancenkarte is a residence permit for jobseekers based on a points system. Successful applicants receive a 1-year residence permit to find qualified employment. During this period, candidates can work part-time (up to 20 hours per week) or take up probationary employment with prospective German employers for up to two weeks.</p>
        <p>Once you secure a full-time qualified job in Germany, your Opportunity Card can easily transition into an EU Blue Card or a standard German Skilled Worker Residence Permit.</p>

        <h2>Key Eligibility Criteria & Points System</h2>
        <p>To qualify for the Opportunity Card, applicants must score a minimum of <strong>6 points</strong> in the points assessment, unless they already hold full recognition of their foreign degree in Germany (in which case they qualify directly without points calculation).</p>
        <table width="100%">
          <thead>
            <tr><th>Criteria</th><th>Points Awarded</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>Partial Recognition of Degree</td><td>4 Points</td><td>If your degree requires further adaptation training in Germany.</td></tr>
            <tr><td>Bottleneck Occupation (MINT/STEM, Healthcare)</td><td>1 Point</td><td>Occupations facing acute labor shortages in Germany.</td></tr>
            <tr><td>Work Experience (within last 5 years)</td><td>2 to 3 Points</td><td>2 points for 2 years of experience; 3 points for 5+ years of experience.</td></tr>
            <tr><td>Language Skills (German or English)</td><td>1 to 3 Points</td><td>German A2 (1 pt), German B1 (2 pts), German B2 (3 pts), English C1 (1 pt).</td></tr>
            <tr><td>Age Under 35 / 40</td><td>1 to 2 Points</td><td>2 points if aged under 35; 1 point if aged between 35 and 40.</td></tr>
            <tr><td>Previous Stay in Germany</td><td>1 Point</td><td>At least 6 continuous months in Germany in the past 5 years.</td></tr>
            <tr><td>Spouse Qualifications</td><td>1 Point</td><td>If your spouse also meets Opportunity Card requirements.</td></tr>
          </tbody>
        </table>

        <h2>Mandatory Basic Requirements</h2>
        <ul>
          <li><strong>Qualification:</strong> At least 2 years of vocational training or a university degree recognized by the country of origin.</li>
          <li><strong>Language:</strong> Minimum German A1 OR English B2 proficiency according to CEFR standards.</li>
          <li><strong>Financial Proof:</strong> Blocked account with approx. €1,027 per month (€12,324 for one year) or an employment contract for secondary part-time work in Germany.</li>
          <li><strong>Health Insurance:</strong> Comprehensive incoming travel health insurance covering your entire stay.</li>
        </ul>

        <h2>Step-by-Step Application Process</h2>
        <ol>
          <li><strong>Free Profile Assessment:</strong> Visa For Nation reviews your educational credentials, age, and work experience.</li>
          <li><strong>ZAB / Anabin Degree Verification:</strong> Submission of degree documents for Statement of Comparability.</li>
          <li><strong>Blocked Account & Insurance Setup:</strong> Assisting with account opening and health insurance.</li>
          <li><strong>Embassy Appointment & Visa Filing:</strong> Preparation of cover letters, motivation letters, and checklist for the VFS/German mission in New Delhi.</li>
          <li><strong>Visa Issuance & Pre-Departure:</strong> Receive your visa and prepare for your move to Germany with our settlement team.</li>
        </ol>

        <h2>Why Apply with Visa For Nation?</h2>
        <p>Visa For Nation in Kailash Colony, New Delhi is recognized for accurate documentation, transparent pricing, and comprehensive interview preparation. We assist you with document translation, ZAB verification, CV restructuring to German DIN 5008 standards, and personalized job search guidance.</p>
      `,
      faqs: [
        { q: 'Can I work while on the Opportunity Card?', a: 'Yes. You are allowed to work part-time up to 20 hours per week and take up trial employment for up to two weeks with an employer.' },
        { q: 'How many points do I need for the Opportunity Card?', a: 'You need at least 6 points on the German points scale, in addition to basic language and financial proof requirements.' },
        { q: 'Is German language mandatory?', a: 'No. You can qualify with English B2 level, although knowing German gives you valuable additional points.' },
        { q: 'What happens after I find a job in Germany?', a: 'You can convert your Opportunity Card directly into an EU Blue Card or Skilled Worker Residence Permit without leaving Germany.' }
      ],
      metaTitle: 'Germany Opportunity Card (Chancenkarte) 2026 - Points & Eligibility',
      metaDescription: 'Complete guide for Indian professionals applying for the German Opportunity Card (Chancenkarte). Check points, requirements, blocked account and process.',
      status: 'published'
    };
  }

  // 2. Portugal Job Seeker Visa
  if (url === 'portugal-job-seeker-visa') {
    return {
      category: 'migrate', subCategory: 'portugal', slug: 'portugal-job-seeker-visa', fullUrl: url,
      bannerImage: '', heroBadge: 'Portugal Job Seeker Visa',
      heroTitle: 'Portugal Job Seeker Visa: Step-by-Step Application Guide',
      heroDesc: 'Move to Portugal for up to 120 + 60 days to search for employment in Europe and secure your residence permit.',
      content: `
        <p>The Portugal Job Seeker Visa allows foreign nationals, including Indian skilled professionals and graduates, to enter Portugal specifically for the purpose of seeking employment. Valid for 120 days and extendable by another 60 days, it is one of the most accessible entry pathways into the European Union and Schengen Area.</p>

        <h2>What is the Portugal Job Seeker Visa?</h2>
        <p>Introduced by the Portuguese government to attract global talent across technology, hospitality, healthcare, and engineering, this visa grants the holder permission to reside in Portugal while actively seeking employment registered with the Institute for Employment and Vocational Training (IEFP).</p>
        <p>Once you secure a registered employment contract in Portugal, you can immediately apply for a formal Portuguese Residence Permit (Title of Residence) and begin your path towards permanent residency and EU citizenship after 5 years.</p>

        <h2>Eligibility & Requirements</h2>
        <ul>
          <li><strong>IEFP Registration:</strong> Online registration declaring your qualifications and skills on the Portuguese employment portal.</li>
          <li><strong>Proof of Funds:</strong> Minimum equivalent of 3 Portuguese national minimum wages (approx. €2,460+) maintained in a bank account.</li>
          <li><strong>Accommodation Proof:</strong> Valid rental agreement, hotel reservation, or a Term of Responsibility signed by a Portuguese citizen/resident.</li>
          <li><strong>Return Ticket / Flight Reservation:</strong> Proof of return transportation or sufficient funds for return.</li>
          <li><strong>Police Clearance Certificate:</strong> Valid PCC apostilled by the Ministry of External Affairs (MEA), India.</li>
          <li><strong>Travel Insurance:</strong> Comprehensive Schengen travel health insurance with minimum €30,000 coverage.</li>
        </ul>

        <h2>Step-by-Step Application Process</h2>
        <ol>
          <li><strong>IEFP Registration:</strong> Register your expression of interest on the IEFP portal.</li>
          <li><strong>Document Legalization & Apostille:</strong> MEA Apostille of degree certificates and PCC.</li>
          <li><strong>VFS Portugal Appointment:</strong> Visa application submission at VFS Global in New Delhi.</li>
          <li><strong>Visa Grant:</strong> Receive your temporary job seeker visa stamped in your passport.</li>
          <li><strong>Travel & Job Search:</strong> Arrive in Portugal, attend interviews, and finalize employment.</li>
          <li><strong>Residence Permit Conversion:</strong> Apply for AIMA (former SEF) appointment to receive your biometrics residence card.</li>
        </ol>

        <h2>Why Choose Visa For Nation?</h2>
        <p>Our team in New Delhi provides end-to-end assistance: IEFP registration, MEA Apostille coordination, accommodation advice, and interview preparation to ensure high visa approval rates.</p>
      `,
      faqs: [
        { q: 'How long is the Portugal Job Seeker Visa valid?', a: 'It is initially valid for 120 days and can be renewed once for an additional 60 days (total 180 days).' },
        { q: 'Can I bring my family on a Portugal Job Seeker Visa?', a: 'Family reunification is possible once you secure employment and convert your visa into a full Portuguese residence permit.' },
        { q: 'What is the processing time from India?', a: 'Processing typically takes between 30 to 60 days following your VFS appointment in Delhi.' }
      ],
      metaTitle: 'Portugal Job Seeker Visa Guide - Requirements & IEFP Process',
      metaDescription: 'Step-by-step guide to applying for Portugal Job Seeker Visa from India. Minimum funds, IEFP registration, documents and residence permit conversion.',
      status: 'published'
    };
  }

  // 3. Work Permits
  if (url.includes('work-permit') || url.includes('work-visa')) {
    const country = cleanLabel.split(' ')[0] || 'International';
    return {
      category: 'migrate', subCategory: 'work-permit', slug: url.split('/').pop(), fullUrl: url,
      bannerImage: '', heroBadge: `${country} Work Permit`,
      heroTitle: `${country} Work Permit & Employment Visa Guide 2026`,
      heroDesc: `Comprehensive guide to obtaining a legal work permit, employer sponsorship, and work visa for ${country}.`,
      content: `
        <p>Working abroad offers exceptional salary packages, career advancement, and a stable pathway towards permanent residency. Visa For Nation specializes in overseas employment visas and work permits for skilled professionals and tradespeople seeking to build their careers in ${country}.</p>

        <h2>Overview of ${country} Work Permit</h2>
        <p>A work permit grants authorized foreign workers the legal right to work for an accredited employer in ${country}. Depending on the immigration framework of ${country}, work permits can be employer-specific, industry-specific, or open permits for qualifying professionals.</p>

        <h2>Eligibility Criteria</h2>
        <ul>
          <li><strong>Valid Job Offer / Contract:</strong> An official offer letter or employment contract from a recognized sponsor/employer in ${country}.</li>
          <li><strong>Labor Market Approval:</strong> LMIA (Canada), Labor Market Testing (Australia/Ireland), or local workforce clearance where required.</li>
          <li><strong>Relevant Work Experience:</strong> Minimum 2 to 3 years of verified professional experience in your nominated occupation.</li>
          <li><strong>Educational Qualifications:</strong> Degrees, diplomas, or trade certificates evaluated by the designated assessment bodies.</li>
          <li><strong>Medical & Character Clearance:</strong> Valid medical fitness report and Police Clearance Certificate (PCC).</li>
        </ul>

        <h2>Step-by-Step Application Roadmap</h2>
        <ol>
          <li><strong>Profile Assessment & Verification:</strong> Our consultants evaluate your CV, qualifications, and credentials.</li>
          <li><strong>Employer Documentation:</strong> Review of employer sponsorship letters and government approvals.</li>
          <li><strong>Visa Filing:</strong> Complete preparation of application forms, financial records, and supporting affidavits.</li>
          <li><strong>Biometrics & Medicals:</strong> Attending required biometrics at VFS and accredited medical screening.</li>
          <li><strong>Visa Decision & Relocation:</strong> Receive passport dispatch with visa stamping and plan your overseas departure.</li>
        </ol>

        <h2>Why Visa For Nation?</h2>
        <p>Based in Kailash Colony Market, New Delhi, Visa For Nation provides comprehensive assistance for ${country} work permits. We ensure error-free documentation, strict compliance with immigration laws, and post-visa guidance.</p>
      `,
      faqs: [
        { q: `Can my spouse work with me in ${country}?`, a: `In many categories, spouses of full-time skilled workers in ${country} are eligible for dependent work permits or open work permits.` },
        { q: `Does this work permit lead to permanent residency?`, a: `Yes, work experience gained in ${country} significantly strengthens your eligibility for PR streams such as Express Entry CEC or state nominee programs.` },
        { q: `What is the average processing time?`, a: `Processing varies from 4 to 12 weeks depending on government verification queues and the specific visa stream.` }
      ],
      metaTitle: `${country} Work Permit & Employment Visa - Eligibility & Process`,
      metaDescription: `Apply for ${country} work permit and visa from India. Learn eligibility criteria, required documents, employer sponsorship and processing timelines.`,
      status: 'published'
    };
  }

  // 4. Job Assistance Pages
  if (url.includes('job-assistance')) {
    const country = cleanLabel.split(' ')[0] || 'Europe';
    return {
      category: 'migrate', subCategory: 'job-assistance', slug: url.split('/').pop(), fullUrl: url,
      bannerImage: '', heroBadge: `${country} Job Assistance`,
      heroTitle: `${country} Job Assistance & Skilled Career Pathways`,
      heroDesc: `Professional CV optimization, interview coaching, and employer connect for skilled professionals targeting ${country}.`,
      content: `
        <p>Securing employment in ${country} requires an international-standard resume, in-depth understanding of local recruitment portals, and strategic application targeting. Visa For Nation empowers Indian professionals with structured overseas job assistance for ${country}.</p>

        <h2>How Job Assistance for ${country} Works</h2>
        <p>Our job search assistance is designed to enhance your profile visibility among licensed employers and recruitment agencies in ${country}. We do not sell illegal job promises; rather, we provide ethical, rigorous career coaching, international resume remodeling, LinkedIn optimization, and targeted recruiter reach-outs.</p>

        <h2>What Our Job Assistance Service Includes</h2>
        <ul>
          <li><strong>International Resume & Cover Letter:</strong> Tailored to the formatting conventions and ATS filters of ${country} (Europass, DIN standard, etc.).</li>
          <li><strong>LinkedIn Profile Overhaul:</strong> Enhancing your headline, summary, and industry keywords to attract international recruiters.</li>
          <li><strong>Targeted Employer & Portal Listing:</strong> Curated list of verified job boards, government portals, and accredited sponsors hiring foreign talent.</li>
          <li><strong>Interview Preparation:</strong> Mock interview sessions focusing on behavioral and cultural interview questions common in ${country}.</li>
          <li><strong>Visa Guidance:</strong> Once you receive an offer, our immigration team manages your full work visa filing.</li>
        </ul>

        <h2>In-Demand Sectors in ${country}</h2>
        <p>High employment demand is consistently seen in Information Technology, Software Development, Data Analytics, Healthcare, Nursing, Engineering, Renewable Energy, Logistics, and Hospitality.</p>
      `,
      faqs: [
        { q: `Do you guarantee a job in ${country}?`, a: `No legitimate consultant can guarantee job offers, as final hiring decisions rest solely with overseas employers. We guarantee professional profile optimization, employer connections, and comprehensive visa processing.` },
        { q: `Do I need to speak the local language of ${country}?`, a: `For multinational companies and IT roles, fluent English is usually sufficient. However, learning basic local language significantly boosts your prospects.` }
      ],
      metaTitle: `${country} Job Assistance & Career Pathways - Visa For Nation`,
      metaDescription: `Get professional job search assistance for ${country}. International CV formatting, LinkedIn optimization, interview prep and work permit guidance.`,
      status: 'published'
    };
  }

  // 5. Tourist Visas
  if (url.includes('tourist-visa')) {
    const dest = cleanLabel.replace(/Tourist Visa/i, '').trim() || 'International';
    return {
      category: 'tourist', subCategory: 'tourist', slug: url.split('/').pop(), fullUrl: url,
      bannerImage: '', heroBadge: `${dest} Tourist Visa`,
      heroTitle: `${dest} Tourist Visa: Application Process, Fees & Checklist`,
      heroDesc: `Explore ${dest} with complete visitor visa support from Delhi’s trusted travel visa specialists.`,
      content: `
        <p>Planning a holiday, family visit, or business trip to ${dest}? Securing a tourist visa requires careful documentation, strong financial proof, and a well-planned travel itinerary. At Visa For Nation, our travel visa experts ensure your application is submitted flawlessly to maximize your approval chances.</p>

        <h2>Overview of ${dest} Tourist Visa</h2>
        <p>The ${dest} visitor visa permits foreign nationals to travel for leisure, tourism, sightseeing, meeting friends or family, and short-term business consultations. Visa validity can range from 30 days single entry to multiple entries valid for up to 2, 5, or 10 years depending on the country.</p>

        <h2>Key Requirements & Documents Checklist</h2>
        <ul>
          <li><strong>Valid Passport:</strong> Minimum 6 months validity with at least two blank visa pages.</li>
          <li><strong>Financial Proof:</strong> Last 6 months bank statements with adequate balance and bank stamp/sign.</li>
          <li><strong>Income Tax Returns (ITR):</strong> Last 3 years ITR acknowledgement forms.</li>
          <li><strong>Employment Proof:</strong> Leave sanction letter, salary slips (last 3 months), or GST certificate for business owners.</li>
          <li><strong>Travel Itinerary:</strong> Flight reservations, confirmed hotel bookings, and a detailed day-wise travel plan.</li>
          <li><strong>Cover Letter:</strong> Personalized statement explaining the purpose of your visit, itinerary, and clear intent to return to India.</li>
          <li><strong>Invitation Letter (if visiting relatives):</strong> Host passport copy, resident status proof, and invitation letter.</li>
        </ul>

        <h2>Common Reasons for Tourist Visa Rejection & How We Prevent Them</h2>
        <p>Tourist visas are frequently rejected due to insufficient bank balances, weak home ties to India, lack of travel history, or generic cover letters. Visa For Nation prepares a strong financial affidavit, proves strong social and economic ties to India, and structures a compelling cover letter for the visa officer.</p>

        <h2>Step-by-Step Application Process</h2>
        <ol>
          <li><strong>Document Evaluation:</strong> Complete review of your financial and personal documents.</li>
          <li><strong>Application Form Filing:</strong> Accurate online visa form submission.</li>
          <li><strong>Fee Payment & Appointment:</strong> Booking biometrics / interview slot at VFS / Embassy.</li>
          <li><strong>Submission & Tracking:</strong> Monitoring passport processing with regular updates.</li>
        </ol>
      `,
      faqs: [
        { q: `How much bank balance is required for a ${dest} tourist visa?`, a: `Generally, we recommend maintaining at least ₹2.5 to ₹4 Lakhs per person for Europe/UK/USA trips to demonstrate adequate financial capacity.` },
        { q: `How long does the tourist visa take?`, a: `Normal processing takes 10 to 20 working days following your biometrics appointment at VFS.` },
        { q: `Can I extend my tourist visa while in ${dest}?`, a: `Tourist visas are generally strictly non-extendable except under rare emergency medical circumstances.` }
      ],
      metaTitle: `${dest} Tourist Visa Application & Requirements 2026 - VFN`,
      metaDescription: `Apply for ${dest} tourist visa from India. Check document checklist, bank balance requirements, processing time and expert assistance in Delhi.`,
      status: 'published'
    };
  }

  // 6. Study in Country
  if (url.startsWith('study-in-')) {
    const country = cleanLabel.replace(/Study in/i, '').trim();
    return {
      category: 'study', subCategory: 'study-visa', slug: url.split('/').pop(), fullUrl: url,
      bannerImage: '', heroBadge: `Study in ${country}`,
      heroTitle: `Study in ${country}: Top Universities, Courses, Scholarships & Student Visa`,
      heroDesc: `Unlock world-class education, global degrees, and post-study work opportunities in ${country}.`,
      content: `
        <p>Studying in ${country} opens doors to globally recognized degrees, high-paying career avenues, multicultural exposure, and long-term settlement pathways. Visa For Nation provides comprehensive end-to-end foreign education guidance: university selection, admission letters, scholarship guidance, and student visa filing.</p>

        <h2>Why Choose ${country} for Higher Education?</h2>
        <ul>
          <li><strong>Global Academic Excellence:</strong> Home to top-ranked international universities and research institutes.</li>
          <li><strong>Post-Study Work Rights:</strong> Generous post-graduation work permits allowing students to gain valuable international experience.</li>
          <li><strong>Part-Time Work Opportunities:</strong> Permitted to work up to 20 hours per week during academic semesters and full-time during breaks.</li>
          <li><strong>Scholarships & Financial Aid:</strong> Merit-based and need-based tuition fee waivers for international students.</li>
        </ul>

        <h2>Popular Courses & Intakes</h2>
        <p>Popular disciplines include Data Science, AI & Machine Learning, Computer Science, Master of Business Administration (MBA), International Business, Mechanical & Civil Engineering, Biotechnology, and Healthcare Management. Main intakes are typically in <strong>Fall (September/October)</strong> and <strong>Spring (January/February)</strong>.</p>

        <h2>Student Visa Requirements Checklist</h2>
        <ul>
          <li><strong>Offer Letter / Confirmation of Enrolment:</strong> Letter of Acceptance (LOA) from a recognized university/college.</li>
          <li><strong>Academic Transcripts:</strong> 10th, 12th, Bachelor's mark sheets and provisional/degree certificates.</li>
          <li><strong>Language Proficiency:</strong> IELTS, PTE Academic, TOEFL, or Duolingo English Test scores.</li>
          <li><strong>Statement of Purpose (SOP):</strong> A well-crafted motivation letter detailing your academic background and career goals.</li>
          <li><strong>Financial Proof:</strong> Evidence of tuition fee payment and living expenses (GIC, blocked account, or education loan letter).</li>
          <li><strong>Medical Fitness & PCC:</strong> Up-to-date immigration medical exam and police clearance.</li>
        </ul>

        <h2>Our End-to-End Support</h2>
        <p>From personalized profile evaluation to university applications, SOP editing, loan assistance, and mock visa interviews — our senior counselors in Delhi ensure a seamless admission journey.</p>
      `,
      faqs: [
        { q: `What is the minimum IELTS/PTE score required for ${country}?`, a: `Undergraduate programs typically require IELTS 6.0 overall (no band less than 5.5). Postgraduate programs usually require IELTS 6.5 (no band less than 6.0) or equivalent PTE score.` },
        { q: `Can I stay back and work after completing my studies in ${country}?`, a: `Yes, ${country} offers post-study work visas ranging from 1 to 3+ years depending on the qualification level and location.` },
        { q: `Are education loans accepted for visa filing?`, a: `Yes, sanctioned education loan letters from nationalized and approved private banks are widely accepted as proof of funds.` }
      ],
      metaTitle: `Study in ${country} - Top Universities, Fees & Student Visa Guide`,
      metaDescription: `Complete guide for Indian students planning to study in ${country}. Intakes, fees, scholarships, post-study work rights and visa guidance in Delhi.`,
      status: 'published'
    };
  }

  // 7. Services - Exams (IELTS, PTE, Duolingo, GRE/GMAT)
  if (['ielts', 'pte', 'duolingo-english-test', 'gre-gmat'].includes(url)) {
    return {
      category: 'service', subCategory: 'exams', slug: url, fullUrl: url,
      bannerImage: '', heroBadge: `${cleanLabel} Preparation`,
      heroTitle: `${cleanLabel} Coaching & Test Preparation - Score High with VFN`,
      heroDesc: `Master your language and aptitude tests with certified trainers, updated mock tests, and personalized feedback.`,
      content: `
        <p>Achieving a top score in ${cleanLabel} is the single most important step for overseas admissions and immigration PR points. At Visa For Nation, our expert training programs are structured around current exam patterns, proven test-taking strategies, and individual feedback to help you achieve your target score on your first attempt.</p>

        <h2>Course Highlights</h2>
        <ul>
          <li><strong>Certified Master Trainers:</strong> Learn from trainers with 10+ years of test preparation experience.</li>
          <li><strong>Comprehensive Study Material:</strong> Authentic practice tests, vocabulary banks, and grammar modules.</li>
          <li><strong>Full-Length Mock Exams:</strong> Timed computer-based tests simulating the real test environment.</li>
          <li><strong>Personalized Feedback:</strong> One-on-one speaking evaluations and detailed writing essay corrections.</li>
          <li><strong>Flexible Batch Timings:</strong> Weekday morning, evening, and weekend batches available online and offline in Delhi.</li>
        </ul>

        <h2>Target Scores We Train For</h2>
        <p>Whether you need an <strong>IELTS Band 8.0+ (CLB 9/10)</strong> for Canada PR Express Entry, or a <strong>PTE score of 79+</strong> for Australia 20 PR points, our customized test syllabus guarantees rapid score enhancement.</p>
      `,
      faqs: [
        { q: `What is the duration of the coaching program?`, a: `Standard courses run for 4 to 8 weeks, with intensive crash courses available for 2 weeks.` },
        { q: `Are mock tests included in the course fee?`, a: `Yes, unlimited section tests and 10 full-length scored mock tests are included.` }
      ],
      metaTitle: `${cleanLabel} Coaching Classes in Delhi - High Score Guarantee`,
      metaDescription: `Join the best ${cleanLabel} coaching in South Delhi. Certified trainers, updated mock tests, flexible batches and proven score improvement.`,
      status: 'published'
    };
  }

  // 8. Other Services (Student Support & Settlement)
  return {
    category: 'service', subCategory: 'support', slug: url.split('/').pop(), fullUrl: url,
    bannerImage: '', heroBadge: `Visa For Nation | ${cleanLabel}`,
    heroTitle: `${cleanLabel}: Comprehensive Professional Support`,
    heroDesc: `Expert guidance and reliable assistance for ${cleanLabel} from Delhi’s trusted immigration consultancy.`,
    content: `
      <p>Visa For Nation provides dedicated, high-quality assistance for <strong>${cleanLabel}</strong>. We believe every global dream deserves meticulous preparation, clear documentation, and ethical guidance.</p>

      <h2>Why ${cleanLabel} Matters for Your Journey</h2>
      <p>Navigating global migration rules and foreign university applications can be complex. Overlooking subtle requirements or drafting generic paperwork frequently leads to avoidable delays or refusals. Our specialized ${cleanLabel} services ensure your application stands out with absolute precision.</p>

      <h2>Our Service Deliverables</h2>
      <ul>
        <li><strong>Detailed Assessment:</strong> Complete evaluation of your profile, eligibility, and specific requirements.</li>
        <li><strong>Expert Documentation:</strong> Professional drafting, formatting, and verification of all required records.</li>
        <li><strong>Timely Delivery:</strong> Adherence to strict deadlines with regular status updates.</li>
        <li><strong>Post-Service Support:</strong> Ongoing consultation to ensure your smooth transition abroad.</li>
      </ul>

      <h2>Why Choose Visa For Nation?</h2>
      <p>Headquartered in Kailash Colony Market, Greater Kailash-1, New Delhi, we bring unmatched expertise, a high client satisfaction rate, and complete transparency with no false promises.</p>
    `,
    faqs: [
      { q: `How do I get started with ${cleanLabel}?`, a: `Simply fill out our free consultation form or call our office at +91 7677666677 to connect with a senior specialist.` },
      { q: `Is this service available online for candidates outside Delhi?`, a: `Yes, we serve clients across India and internationally through secure digital consultations and document sharing.` }
    ],
    metaTitle: `${cleanLabel} Services in Delhi - Visa For Nation`,
    metaDescription: `Professional ${cleanLabel} support from Visa For Nation. Honest advice, meticulous preparation and personalized assistance.`,
    status: 'published'
  };
};

// Iterate all links from nav.json and generate missing pages
const allNavLinks = [];
Object.entries(nav).forEach(([catKey, sections]) => {
  sections.forEach(sec => {
    (sec.links || []).forEach(l => {
      allNavLinks.push({
        href: l.href,
        label: l.label,
        category: catKey,
        subCategory: sec.title || catKey
      });
    });
  });
});

let addedCount = 0;
const finalPages = [...existingPages];

allNavLinks.forEach(({ href, label, category, subCategory }) => {
  const url = href.replace(/^\/+/, '');
  if (!existingUrls.has(url)) {
    const pageData = getPageData(href, label, category, subCategory);
    finalPages.push(pageData);
    existingUrls.add(url);
    addedCount++;
  }
});

console.log(`Initial pages: ${existingPages.length}`);
console.log(`Added new pages: ${addedCount}`);
console.log(`Total final pages: ${finalPages.length}`);

// Write updated backend/data/pages.json
fs.writeFileSync(existingPagesPath, JSON.stringify(finalPages, null, 2), 'utf8');
console.log(`Wrote ${finalPages.length} pages to ${existingPagesPath}`);

// Write frontend/src/data/pagesData.js for seamless offline/zero-404 fallback!
const frontendPagesPath = path.resolve(__dirname, '../../frontend/src/data/pagesData.js');
const exportContent = `// Auto-generated full offline and instant fallback dataset for all 63 website routes
export const ALL_PAGES = ${JSON.stringify(finalPages, null, 2)};

export const PAGES_BY_URL = ALL_PAGES.reduce((acc, p) => {
  const key = p.fullUrl.replace(/^\\/+/, '').toLowerCase();
  acc[key] = p;
  return acc;
}, {});

export function getFallbackPage(url) {
  if (!url) return null;
  const clean = String(url).replace(/^\\/+/, '').replace(/\\/+$/, '').toLowerCase();
  return PAGES_BY_URL[clean] || null;
}
`;

fs.writeFileSync(frontendPagesPath, exportContent, 'utf8');
console.log(`Wrote frontend fallback data to ${frontendPagesPath}`);
