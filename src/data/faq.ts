export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Shared FAQ content — the home page shows a preview, /faq shows everything.
 * Answers must stay consistent with /privacy, /terms, and /refund.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is this the official state website?",
    answer:
      "No. AnglerPermit.com is a privately owned license-assistance service and is not affiliated with, endorsed by, or operated by any government agency. Fishing licenses are also available directly from official state agencies, often at a lower cost. We provide a convenience service: you fill out one simple form, and our team completes the purchase on the official state portal for you.",
  },
  {
    question: "Why is there a service fee?",
    answer:
      "The official state license fee goes directly to the state — we never mark it up. Our separate service fee covers reviewing your application for errors, completing the purchase on the official state portal on your behalf, handling any issues with the state system, and delivering your license by email. Both amounts are always itemized separately before you submit, so there are no surprises.",
  },
  {
    question: "Is my Social Security number safe?",
    answer:
      "Some states require an SSN by law for fishing-license applicants. When a state requires it, we collect it over an encrypted connection, mask it everywhere (our admin notifications and logs only ever show the last four digits, e.g. ***-**-6789), and use it solely to complete your license purchase on the official state portal. See our Privacy Policy for full details on handling and retention.",
  },
  {
    question: "How fast will I get my license?",
    answer:
      "Most applications are reviewed within one business day and purchased on the official state portal shortly after. Delivery timing depends on the state's system — many licenses are issued almost immediately and are emailed to you as soon as the state generates them. During peak seasons or state-system outages it can take longer; if anything is delayed, we will let you know.",
  },
  {
    question: "What do you do with my information?",
    answer:
      "We use the information you provide for one purpose: purchasing your fishing license from the official state agency. We do not sell your personal information. We retain application data only as long as needed to complete your order and meet legal obligations. Full details are in our Privacy Policy.",
  },
  {
    question: "Is the license I receive the real, official license?",
    answer:
      "Yes. We purchase directly from the state's official licensing portal using the information you provide. The license document you receive is issued by the state fish and wildlife agency itself — we never issue our own licenses.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "Our service fee is refundable until we purchase your license from the state. Once a license has been purchased, state license fees are generally non-refundable because state agencies do not offer refunds to us. If we cannot complete your purchase for any reason, you receive a full refund of everything you paid. See the Refund Policy page for details.",
  },
  {
    question: "Can I buy directly from the state instead?",
    answer:
      "Absolutely — every state page links to the official portal, and you will pay only the state's listed fees there. AnglerPermit exists for anglers who prefer a simpler, guided application with itemized pricing and hands-on support.",
  },
  {
    question: "What information do I need to apply?",
    answer:
      "Typically your full legal name, date of birth, contact information, address, and a form of identification. Some states also require a Social Security number or physical descriptors. Each state page's form asks only what that state requires — nothing more.",
  },
  {
    question: "Do I need to be a resident to buy a license?",
    answer:
      "No. Every state offers nonresident licenses, and our forms filter the available options based on the residency status you select — exactly as the official portals do. Residency rules (such as how long you must have lived in a state) are set by each state agency.",
  },
  {
    question: "What if I make a mistake on my application?",
    answer:
      "Contact us as soon as possible with your reference number. If we have not yet purchased your license, we will correct the application at no charge. If the license has already been purchased, we will work with you and the state agency on available options.",
  },
  {
    question: "How will my license be delivered?",
    answer:
      "By email, to the address you provide in your application. Most states issue a digital license document you can print or carry on your phone. If a state requires a physical document to be mailed, we will tell you what to expect.",
  },
  {
    question: "Is AnglerPermit a government agency?",
    answer:
      "No. We are a private company. We are not affiliated with, endorsed by, or operated by any government agency, and we never represent ourselves as one. Our role is limited to assisting you with the application and purchasing process.",
  },
];
