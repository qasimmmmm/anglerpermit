import type { StateConfig } from "@/lib/state-config";

/**
 * TEXAS — Texas Parks and Wildlife Department (TPWD)
 * Official portal: Texas License Connection (https://www.txfgsales.com/)
 * Converted 1:1 from /research/texas.json (prices verified 2026-07-18).
 *
 * Type-mapping decisions (no data dropped):
 *  - All license residency values (resident | senior | nonresident | any) and
 *    categories (freshwater | saltwater | all-water | other) are in-union; used verbatim.
 *  - `duration` is a free string, so "Annual (year from purchase)" and
 *    "Annual (expires Dec. 31)" are preserved verbatim.
 *  - Select fields whose official option lists could not be verified carry no
 *    `options` (empty = placeholder only) plus a "TODO: verify" officialNote,
 *    exactly as in the research. No options were invented.
 *  - `ssn` keeps the official 9-digit no-dashes `validation.pattern` (^\d{9}$) and
 *    `mask: "ssn"` from the research. NOTE: shared buildFieldSchema/maskSSNInput
 *    currently hardcode the dashed 123-45-6789 format for ssn-type fields
 *    (reported to orchestrator — shared code not modified per rules).
 *  - Top-level `sources[]` from the JSON is not part of StateConfig; it is
 *    appended to `researchNotes` as a SOURCES list so nothing is lost.
 */
export const config: StateConfig = {
  slug: "texas",
  stateName: "Texas",
  officialAgencyName: "Texas Parks and Wildlife Department",
  officialPortalName: "Texas License Connection (TPWD online license sales)",
  officialPortalUrl: "https://www.txfgsales.com/",
  lastVerified: "2026-07-18",
  requiresSSN: true,
  ssnExplainer: "Collection of the SSN is mandated by federal and state law (42 U.S.C.A. 666 and Texas Family Code, Section 231.302) for the purpose of child support collection enforcement; under state law it is voluntary for persons 13 years of age and younger. TPWD cannot sell a license to an applicant over 13 who refuses to provide an SSN (a passport may be used instead by out-of-country customers).",
  residencyOptions: [
    {
      value: "resident",
      label: "Texas Resident",
    },
    {
      value: "senior",
      label: "Texas Resident 65+ (born on or after Jan. 1, 1931)",
    },
    {
      value: "nonresident",
      label: "Non-resident",
    },
    {
      value: "youth",
      label: "Under 17 (no fishing license required)",
    }
  ],
  licenseYearNote: "Texas license year: Sept. 1 - Aug. 31. Annual freshwater, saltwater and all-water packages are valid from the date of sale through Aug. 31 of the same year. New-year licenses go on sale Aug. 15. The Year-from-Purchase All-Water Package (resident only) is instead valid from the date of purchase through the end of the purchase month of the next license year. The Lake Texoma License is valid until December 31 following the date of issuance.",
  licenses: [
    {
      id: "resident-freshwater-package",
      name: "Resident Freshwater Package",
      price: 30,
      residency: "resident",
      duration: "Annual",
      category: "freshwater",
      description: "Texas resident fishing license valid from the date of sale to Aug. 31 of the same year, plus a freshwater endorsement. A saltwater endorsement may also be purchased. (TPWD Item 231)",
      suggestedAddOns: [
        "saltwater-fishing-endorsement"
      ],
      officialNote: "Verified $30 (Item 231) on official Texas Outdoor Annual (eRegulations) fishing licenses & packages page.",
    },
    {
      id: "senior-freshwater-package",
      name: "Senior Freshwater Package",
      price: 12,
      residency: "senior",
      duration: "Annual",
      category: "freshwater",
      description: "Available to any Texas resident who is at least 65 years of age and was born on or after January 1, 1931. Resident fishing license valid from date of sale to Aug. 31 plus a freshwater endorsement. (TPWD Item 234)",
      suggestedAddOns: [
        "saltwater-fishing-endorsement"
      ],
      officialNote: "Verified $12 (Item 234) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "nonresident-freshwater-package",
      name: "Non-resident Freshwater Package",
      price: 58,
      residency: "nonresident",
      duration: "Annual",
      category: "freshwater",
      description: "Non-resident fishing license valid from the date of sale to Aug. 31 of the same year, plus a freshwater endorsement. A saltwater endorsement may also be purchased. (TPWD Item 250)",
      suggestedAddOns: [
        "saltwater-fishing-endorsement"
      ],
      officialNote: "Verified $58 (Item 250) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "resident-saltwater-package",
      name: "Resident Saltwater Package",
      price: 35,
      residency: "resident",
      duration: "Annual",
      category: "saltwater",
      description: "Texas resident fishing license valid from the date of sale to Aug. 31 of the same year, plus a saltwater endorsement with a red drum tag or spotted seatrout tag, or both, depending on the package selected. A freshwater endorsement may also be purchased. (TPWD Item 232)",
      suggestedAddOns: [
        "freshwater-fishing-endorsement",
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $35 (Item 232) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "senior-saltwater-package",
      name: "Senior Saltwater Package",
      price: 17,
      residency: "senior",
      duration: "Annual",
      category: "saltwater",
      description: "Available to any Texas resident who is at least 65 years of age and was born on or after January 1, 1931. Resident fishing license valid from date of sale to Aug. 31 plus a saltwater endorsement (with red drum tag or spotted seatrout tag, or both, depending on package). (TPWD Item 235)",
      suggestedAddOns: [
        "freshwater-fishing-endorsement",
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $17 (Item 235) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "nonresident-saltwater-package",
      name: "Non-resident Saltwater Package",
      price: 63,
      residency: "nonresident",
      duration: "Annual",
      category: "saltwater",
      description: "Non-resident fishing license valid from the date of sale to Aug. 31 of the same year, plus a saltwater sportfishing stamp (endorsement) with a red drum tag and a spotted seatrout tag. A freshwater endorsement may also be purchased. (TPWD Item 251)",
      suggestedAddOns: [
        "freshwater-fishing-endorsement",
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $63 (Item 251) on official Texas Outdoor Annual (eRegulations); package contents confirmed in Texas Register adopted rule TRD-202502444 (eff. 7/31/2025).",
    },
    {
      id: "resident-all-water-package",
      name: "Resident All-Water Package",
      price: 40,
      residency: "resident",
      duration: "Annual",
      category: "all-water",
      description: "Texas resident fishing license valid from the date of sale to Aug. 31 of the same year, with a freshwater endorsement and a saltwater endorsement (red drum tag and spotted seatrout tag included with the saltwater endorsement). (TPWD Item 233)",
      suggestedAddOns: [
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $40 (Item 233) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "year-from-purchase-all-water-package",
      name: "Year-from-Purchase All-Water Package",
      price: 47,
      residency: "resident",
      duration: "Annual (year from purchase)",
      category: "all-water",
      description: "Texas residents only. Fishing license, a freshwater endorsement and a saltwater endorsement with a red drum and spotted seatrout tag are all valid from the date of purchase through the end of the purchase month of the next license year. (TPWD Item 237)",
      suggestedAddOns: [
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $47 (Item 237) on official Texas Outdoor Annual (eRegulations). Note: this is the only annual Texas fishing package that does NOT expire Aug. 31.",
    },
    {
      id: "senior-all-water-package",
      name: "Senior All-Water Package",
      price: 22,
      residency: "senior",
      duration: "Annual",
      category: "all-water",
      description: "Available to any Texas resident who is at least 65 years of age and was born on or after January 1, 1931. Senior resident fishing license valid from date of sale to Aug. 31, with a freshwater endorsement, a saltwater endorsement with a red drum or spotted seatrout tag, or both depending on the package selected. (TPWD Item 236)",
      suggestedAddOns: [
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $22 (Item 236) on official Texas Outdoor Annual (eRegulations).",
    },
    {
      id: "nonresident-all-water-package",
      name: "Non-resident All-Water Package",
      price: 68,
      residency: "nonresident",
      duration: "Annual",
      category: "all-water",
      description: "Non-resident fishing license valid from the date of sale to Aug. 31 of the same year, a freshwater fishing stamp (endorsement), and a saltwater sportfishing stamp (endorsement) with a red drum tag and a spotted seatrout tag. (TPWD Item 252)",
      suggestedAddOns: [
        "bonus-red-drum-tag",
        "bonus-spotted-seatrout-tag"
      ],
      officialNote: "Verified $68 (Item 252) on official Texas Outdoor Annual (eRegulations); package contents confirmed in Texas Register adopted rule TRD-202502444 (eff. 7/31/2025).",
    },
    {
      id: "resident-one-day-all-water-license",
      name: "One-Day All-Water License",
      price: 11,
      residency: "resident",
      duration: "1-Day",
      category: "all-water",
      description: "Valid for the selected day or days purchased. Endorsements are not required for this license. Consecutive days may be bought at the time of purchase. One red drum tag (Item 598) and one spotted seatrout tag (Item 596) are available at no additional charge with the purchase of the first one-day license only (limit one per customer). (TPWD Item 213)",
      officialNote: "Verified $11 (Item 213) on official Texas Outdoor Annual (eRegulations); no-charge tags with first one-day license confirmed in Texas Register TRD-202502444.",
    },
    {
      id: "nonresident-one-day-all-water-license",
      name: "One-Day All-Water License",
      price: 16,
      residency: "nonresident",
      duration: "1-Day",
      category: "all-water",
      description: "Valid for the selected day or days purchased. Endorsements are not required for this license. Consecutive days may be bought at the time of purchase. One red drum tag (Item 598) and one spotted seatrout tag (Item 596) are available at no additional charge with the purchase of the first one-day license only (limit one per customer). (TPWD Item 214)",
      officialNote: "Verified $16 (Item 214) on official Texas Outdoor Annual (eRegulations) and Texas Register TRD-202502444.",
    },
    {
      id: "special-resident-all-water-fishing-license",
      name: "Special Resident All-Water Fishing License",
      price: 7,
      residency: "resident",
      duration: "Annual",
      category: "all-water",
      description: "Available to any Texas resident who is legally blind. Endorsements are not required for this license. Includes one red drum tag and one spotted seatrout tag. (TPWD Item 244)",
      officialNote: "Verified $7 (Item 244) on official Texas Outdoor Annual (eRegulations). NOT sold online - purchase at a TPWD law enforcement sales office or license retailer.",
    },
    {
      id: "lake-texoma-license",
      name: "Lake Texoma License",
      price: 12,
      residency: "any",
      duration: "Annual (expires Dec. 31)",
      category: "other",
      description: "Valid until December 31 following the date of issuance. Holder may fish in both the Texas and Oklahoma waters of Lake Texoma without any additional Texas or Oklahoma fishing licenses; holders are exempt from freshwater fishing stamp requirements solely for fishing on Lake Texoma. A Texas resident 65 years of age or older does not need this license to fish the Oklahoma portion of Lake Texoma. Valid ONLY on Lake Texoma. (TPWD Item 208)",
      officialNote: "Verified $12 (Item 208) on official Texas Outdoor Annual (eRegulations) and Texas Register TRD-202502444.",
    },
    {
      id: "lifetime-resident-fishing-package",
      name: "Lifetime Resident Fishing Package",
      price: 1000,
      residency: "resident",
      duration: "Lifetime",
      category: "all-water",
      description: "Texas residents only. Fishing license valid for the lifetime of the license holder. Lifetime license holders are exempt from state endorsement requirements (except the Reptile and Amphibian endorsement), but the red drum tag requirement still applies; current-year tags are available at no fee beginning Aug. 15 each license year. (TPWD Item 982)",
      officialNote: "Verified $1,000 (Item 982) on official Texas Outdoor Annual (eRegulations). Sold BY APPLICATION only (TPWD Austin HQ / Law Enforcement offices) - not sold online.",
    },
  ],
  addOns: [
    {
      id: "freshwater-fishing-endorsement",
      name: "Freshwater Fishing Endorsement",
      price: 5,
      required: false,
      description: "Required with a valid fishing license to take or attempt to take fish in Texas public fresh waters, unless exempt or already included in the package (freshwater and all-water packages, lifetime combination/fishing include it). Not required of persons under 17 years of age.",
      officialNote: "$5 fee consistently documented (TPWD Outdoor Annual endorsement pages; statutory freshwater fishing stamp). TODO: verify on official page - https://tpwd.texas.gov/regulations/outdoor-annual/licenses/fishing-licenses-and-packages",
    },
    {
      id: "saltwater-fishing-endorsement",
      name: "Saltwater Fishing Endorsement",
      price: 10,
      required: false,
      description: "Required with a valid fishing license to fish in Texas public salt water, unless exempt or already included in the package (saltwater and all-water packages include it). Includes a red drum tag and a spotted seatrout tag at no additional charge. Not required of persons under 17 years of age.",
      officialNote: "$10 fee consistently documented (TPWD Outdoor Annual endorsement pages; statutory saltwater sportfishing stamp). Tag inclusion confirmed in Texas Register TRD-202502444. TODO: verify on official page - https://tpwd.texas.gov/regulations/outdoor-annual/licenses/fishing-licenses-and-packages",
    },
    {
      id: "bonus-red-drum-tag",
      name: "Bonus Red Drum Tag",
      price: 3,
      required: false,
      appliesTo: [
        "resident-saltwater-package",
        "senior-saltwater-package",
        "nonresident-saltwater-package",
        "resident-all-water-package",
        "year-from-purchase-all-water-package",
        "senior-all-water-package",
        "nonresident-all-water-package"
      ],
      description: "Provides a second red drum tag to a person who has previously received a red drum tag. Allows retention of one red drum over 28 inches (oversized/bull red) per license year, in addition to the daily bag limit. (TPWD Item 599)",
      officialNote: "Verified $3 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(2), eff. 7/31/2025); Item 599 per TPWD news release.",
    },
    {
      id: "exempt-angler-red-drum-tag",
      name: "Exempt Angler Red Drum Tag",
      price: 3,
      required: false,
      description: "Provides a red drum tag for persons who are exempt by statute or rule from the purchase of a resident or non-resident fishing license of any type or duration (e.g., anglers under 17) so they may retain an oversized red drum. Also available as a digital exempt angler red drum tag. (TPWD Item 257)",
      officialNote: "Verified $3 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(1), eff. 7/31/2025); Item 257 per TPWD news release.",
    },
    {
      id: "bonus-spotted-seatrout-tag",
      name: "Bonus Spotted Seatrout Tag",
      price: 3,
      required: false,
      appliesTo: [
        "resident-saltwater-package",
        "senior-saltwater-package",
        "nonresident-saltwater-package",
        "resident-all-water-package",
        "year-from-purchase-all-water-package",
        "senior-all-water-package",
        "nonresident-all-water-package"
      ],
      description: "Provides a second spotted seatrout tag to a person who has previously received a spotted seatrout tag (used to retain an oversized spotted seatrout per current bag/length rules).",
      officialNote: "Verified $3 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(4), eff. 7/31/2025).",
    },
    {
      id: "exempt-angler-spotted-seatrout-tag",
      name: "Exempt Angler Spotted Seatrout Tag",
      price: 3,
      required: false,
      description: "Provides a spotted seatrout tag for persons who are exempt by statute or rule from the purchase of a resident or non-resident fishing license of any type or duration (e.g., anglers under 17).",
      officialNote: "Verified $3 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(3), eff. 7/31/2025).",
    },
    {
      id: "saltwater-trotline-tag",
      name: "Saltwater Trotline Tag",
      price: 5,
      required: false,
      description: "Required for each 300 feet of mainline (or fraction thereof) on non-commercial trotlines and sail lines fished in Texas coastal waters. Must be purchased at TPWD Law Enforcement offices.",
      officialNote: "Verified $5 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(6), eff. 7/31/2025); LE-office purchase per official Texas Outdoor Annual (eRegulations) trotline rules.",
    },
    {
      id: "individual-bait-shrimp-trawl-tag",
      name: "Individual Bait-Shrimp Trawl Tag",
      price: 37,
      required: false,
      description: "Required in addition to a valid recreational fishing license to trawl for shrimp for bait purposes with an individual (hand-operated, max 20 ft) bait-shrimp trawl in salt water. Must be in possession while trawling. Purchased at TPWD Law Enforcement offices.",
      officialNote: "Verified $37 in Texas Register adopted rule TRD-202502444 (31 TAC 53.3(e)(5), eff. 7/31/2025).",
    },
  ],
  formFields: [
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      required: true,
      autocomplete: "family-name",
      validation: {
        minLength: 1,
        maxLength: 50,
      },
      step: 2,
      officialNote: "Exact label from official View/Edit Customer Details screen (txfghelpsupport.com/ISAImages/isa5.png). Also asked on the initial Customer Login and Creation screen ('*Last Name:'). Name changes after account creation require contacting TPWD at (512) 389-4820.",
    },
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      required: true,
      autocomplete: "given-name",
      validation: {
        minLength: 1,
        maxLength: 50,
      },
      step: 2,
      officialNote: "Exact label from official View/Edit Customer Details screen.",
    },
    {
      name: "middleName",
      label: "Middle Name",
      type: "text",
      required: false,
      autocomplete: "additional-name",
      validation: {
        maxLength: 50,
      },
      step: 2,
      officialNote: "Exact label from official View/Edit Customer Details screen; no asterisk (optional).",
    },
    {
      name: "suffix",
      label: "Suffix",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Dropdown on official View/Edit Customer Details screen; no asterisk (optional). TODO: verify dropdown options (e.g., Jr., Sr., II, III) - https://www.txfgsales.com/",
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Dropdown on official screen (screenshot shows 'Male' selected); no asterisk. TODO: verify full dropdown options - https://www.txfgsales.com/",
    },
    {
      name: "heightFeet",
      label: "Feet",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Shown together with 'Inches' under a single 'Height' label on the official screen (two dropdowns: Feet, Inches). No asterisk. TODO: verify option ranges - https://www.txfgsales.com/",
    },
    {
      name: "heightInches",
      label: "Inches",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Second dropdown of the official 'Height' field group. No asterisk. TODO: verify option ranges - https://www.txfgsales.com/",
    },
    {
      name: "eyeColor",
      label: "Eye Color",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Dropdown on official screen (screenshot shows 'Blue' selected); no asterisk. TODO: verify full dropdown options - https://www.txfgsales.com/",
    },
    {
      name: "hairColor",
      label: "Hair Color",
      type: "select",
      required: false,
      step: 2,
      officialNote: "Dropdown on official screen (screenshot shows 'Grey' selected); no asterisk. TODO: verify full dropdown options - https://www.txfgsales.com/",
    },
    {
      name: "dob",
      label: "DOB (MM/DD/YYYY)",
      type: "date",
      required: true,
      mask: "dob",
      autocomplete: "bday",
      step: 2,
      officialNote: "Exact label 'DOB (MM/DD/YYYY)' with asterisk on official screen; rendered as three separate text inputs (MM / DD / YYYY). Also asked on the initial Customer Login and Creation screen ('*Date of Birth:', mm/dd/yyyy inputs). DOB drives senior (65+) catalog filtering and under-17 exemption; DOB changes after account creation require contacting TPWD.",
    },
    {
      name: "ssn",
      label: "SSN (xxxxxxxxx)",
      type: "ssn",
      required: true,
      helpText: "Collection of the SSN is mandated by federal and state law (42 U.S.C.A. 666 and Texas Family Code, Section 231.302) for child support collection enforcement. Customers that are 13 years old and younger are not required to enter a Social Security Number.",
      mask: "ssn",
      validation: {
        pattern: "^\\d{9}$",
        patternMessage: "Enter the 9-digit Social Security number without dashes.",
      },
      step: 2,
      officialNote: "Exact label 'SSN (xxxxxxxxx)' marked '***' on official screen. Official footnote: '*** Only one field containing this indicator is required. Customers that are 13 years old and younger are not required to enter a Social Security Number.' i.e., one of SSN or Passport Number must be provided; TPWD FAQ states individuals over 13 are required to provide their SSN (out-of-country customers typically use the passport field instead).",
    },
    {
      name: "driversLicenseState",
      // Label disambiguated 2026-07 (QA: two identical "Driver's License" labels
      // rendered for this field group). Official screen shows ONE "Driver's
      // License" label above a state dropdown + number input pair.
      label: "Driver's License State",
      type: "select",
      required: false,
      step: 2,
      officialNote: "State dropdown portion of the official 'Driver's License' field group (defaults to 'TX' in screenshot), paired with a number text input. No asterisk. TODO: verify state option list - https://www.txfgsales.com/",
    },
    {
      name: "driversLicenseNumber",
      // Label disambiguated 2026-07 (see driversLicenseState note).
      label: "Driver's License Number",
      type: "text",
      required: false,
      autocomplete: "off",
      validation: {
        maxLength: 25,
      },
      step: 2,
      officialNote: "Number text-input portion of the official 'Driver's License' field group. No asterisk. Also usable as the lookup identifier on the Customer Login and Creation screen ('Driver's License # and state').",
    },
    {
      name: "passportNumber",
      label: "Passport Number",
      type: "text",
      required: false,
      autocomplete: "off",
      validation: {
        maxLength: 25,
      },
      conditional: {
        field: "ssn",
        equals: "",
      },
      step: 2,
      officialNote: "Marked '***' on official screen - one of SSN or Passport Number is required ('Only one field containing this indicator is required'). Help text: 'The passport field is usually used by out-of-country guests.'",
    },
    {
      name: "passportIssuingCountry",
      label: "Passport Issuing Country",
      type: "select",
      required: false,
      conditional: {
        field: "ssn",
        equals: "",
      },
      step: 2,
      officialNote: "Dropdown directly beneath Passport Number on the official screen. TODO: verify country option list - https://www.txfgsales.com/",
    },
    {
      name: "customerId",
      label: "Customer ID",
      type: "text",
      required: false,
      step: 2,
      officialNote: "System-assigned TPWD customer number shown read-only on the official screen (13 digits in current screenshot; 12 in 2021 version). Created after the customer's first purchase; printed on licenses. DO NOT collect as free input - display only.",
    },
    {
      name: "texasResident",
      label: "Texas Resident",
      type: "select",
      required: true,
      options: [
        {
          value: "yes",
          label: "Yes",
        },
        {
          value: "no",
          label: "No",
        }
      ],
      step: 2,
      officialNote: "Dropdown on official screen (screenshot shows 'Yes' selected); drives license catalog filtering ('The list of licenses offered for sale depends upon the customer's age, residency, holdings and the items already added to the shopping cart.'). Separate 'Update Residency' button exists on the official screen. Residency definition (official Outdoor Annual): a person who has lived continuously in Texas for more than six months immediately before buying their license; also officially documented Kickapoo Traditional Tribe of Texas members and U.S. Armed Forces members (and dependents) on active duty anywhere. TODO: verify dropdown option labels - https://www.txfgsales.com/",
    },
    {
      name: "resAddress1",
      label: "Address Line 1",
      type: "text",
      required: true,
      autocomplete: "address-line1",
      validation: {
        minLength: 1,
        maxLength: 100,
      },
      step: 2,
      officialNote: "Residence Address section, exact label with asterisk on official screen.",
    },
    {
      name: "resAddress2",
      label: "Address Line 2",
      type: "text",
      required: false,
      autocomplete: "address-line2",
      validation: {
        maxLength: 100,
      },
      step: 2,
      officialNote: "Residence Address section, exact label; optional.",
    },
    {
      name: "resCity",
      label: "City/Town",
      type: "text",
      required: true,
      autocomplete: "address-level2",
      validation: {
        minLength: 1,
        maxLength: 60,
      },
      step: 2,
      officialNote: "Residence Address section, exact label 'City/Town' with asterisk.",
    },
    {
      name: "resState",
      label: "State",
      type: "select",
      required: true,
      autocomplete: "address-level1",
      step: 2,
      officialNote: "Residence Address section, dropdown with asterisk (defaults to 'TX' in screenshot). TODO: verify full state/territory option list - https://www.txfgsales.com/",
    },
    {
      name: "resZip",
      label: "Zip",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "postal-code",
      validation: {
        pattern: "^\\d{5}$",
        patternMessage: "Enter the 5-digit ZIP code.",
      },
      step: 2,
      officialNote: "Residence Address section, exact label 'Zip' with asterisk; official screen has TWO inputs: 5-digit ZIP plus a separate 4-digit ZIP+4 extension input.",
    },
    {
      name: "phone",
      label: "Phone No.",
      type: "tel",
      required: true,
      mask: "phone",
      autocomplete: "tel-national",
      validation: {
        pattern: "^\\d{10}$",
        patternMessage: "Enter a 10-digit phone number.",
      },
      step: 2,
      officialNote: "Residence Address section, exact label 'Phone No.' WITH asterisk on the current official screen (rendered as three inputs: area code / prefix / line). Note: the 2021 archived form did NOT mark phone/email required - the current form does.",
    },
    {
      name: "email",
      label: "E-Mail Address",
      type: "email",
      required: true,
      autocomplete: "email",
      validation: {
        maxLength: 100,
      },
      step: 2,
      officialNote: "Residence Address section, exact label 'E-Mail Address' WITH asterisk on the current official screen. Billing screen also asks 'Email Address *' ('Email Address is Required') - order confirmation is sent to the billing email.",
    },
    {
      name: "resNonUsAddress",
      label: "Non U.S. Address",
      type: "checkbox",
      required: false,
      step: 2,
      officialNote: "Residence Address section checkbox on official screen; expected to switch state/ZIP inputs for foreign addresses. TODO: verify conditional behavior - https://www.txfgsales.com/",
    },
    {
      name: "mailSameAsResidence",
      label: "Same as Residence Address",
      type: "checkbox",
      required: false,
      step: 2,
      officialNote: "Mailing Address section checkbox on official screen; when checked the mailing address copies the residence address.",
    },
    {
      name: "mailAddress1",
      label: "Address Line 1",
      type: "text",
      required: true,
      autocomplete: "off",
      validation: {
        minLength: 1,
        maxLength: 100,
      },
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section, exact label with asterisk.",
    },
    {
      name: "mailAddress2",
      label: "Address Line 2",
      type: "text",
      required: false,
      autocomplete: "off",
      validation: {
        maxLength: 100,
      },
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section, exact label; optional.",
    },
    {
      name: "mailCity",
      label: "City/Town",
      type: "text",
      required: true,
      autocomplete: "off",
      validation: {
        minLength: 1,
        maxLength: 60,
      },
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section, exact label with asterisk.",
    },
    {
      name: "mailState",
      label: "State",
      type: "select",
      required: true,
      autocomplete: "off",
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section, dropdown with asterisk. TODO: verify option list - https://www.txfgsales.com/",
    },
    {
      name: "mailZip",
      label: "Zip",
      type: "zip",
      required: true,
      mask: "zip",
      autocomplete: "off",
      validation: {
        pattern: "^\\d{5}$",
        patternMessage: "Enter the 5-digit ZIP code.",
      },
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section, exact label 'Zip' with asterisk; two inputs (5-digit + 4-digit extension) like the residence ZIP.",
    },
    {
      name: "mailNonUsAddress",
      label: "Non U.S. Address",
      type: "checkbox",
      required: false,
      conditional: {
        field: "mailSameAsResidence",
        equals: "false",
      },
      step: 2,
      officialNote: "Mailing Address section checkbox on official screen.",
    },
  ],
  stateIdentifiers: [
    {
      name: "customerNumber",
      label: "Customer Number",
      helpText: "Your TPWD Customer Number (Customer ID) is printed on any current/prior Texas license and is the most reliable way to find your record on the Customer Login and Creation screen. New customers receive a Customer Number after completing their first purchase.",
      required: false,
    }
  ],
  consentExtra: "By purchasing, the applicant affirms Texas residency status as declared. Official flow note: the list of licenses offered depends on the customer's age, residency, holdings, and items already in the cart. Orders may be canceled only until midnight (CST) on the day of purchase; license fees are not refundable, exchangeable or transferable.",
  researchNotes: "OFFICIAL FLOW (Texas License Connection, txfgsales.com; vendor system 'TLC Internet Sales Application'): (1) Customer Login and Creation screen - enter *Last Name, *Date of Birth (mm/dd/yyyy), and pick ONE identifier from a dropdown (Customer Number, Driver's License # + state, SSN, or Passport - passport usually used by out-of-country guests); Cloudflare Turnstile check; links for '13 and Younger Customer Login and Creation' (SSN voluntary for <=13) and 'Switch to Business Customer Login'. If no record found: 'We couldn't find you. Make a mistake?' -> Create an Account. (2) View/Edit Customer Details - Personal Details (Last Name*, First Name*, Middle Name, Suffix, Gender, Height Feet/Inches, Eye Color, Hair Color, DOB (MM/DD/YYYY)*, SSN (xxxxxxxxx)***, Driver's License (state+number), Passport Number***, Passport Issuing Country, Customer ID [read-only], Texas Resident [dropdown]) + Residence Address (Address Line 1*, Address Line 2, City/Town*, State*, Zip* [5+4 inputs], Phone No.* [3 inputs], E-Mail Address*, Non U.S. Address checkbox) + Mailing Address (Same as Residence Address checkbox, Address Line 1*, Address Line 2, City/Town*, State*, Zip* [5+4], Non U.S. Address checkbox). Footnotes: '* Mandatory field'; '*** Only one field containing this indicator is required. Customers that are 13 years old and younger are not required to enter a Social Security Number.' (3) Item Selection - catalog filtered by age, residency, holdings, and cart contents. (4) Shopping Cart. (5) Checkout > Shipping: Delivery Method dropdown (Standard Delivery Free; expedited $15.95, physical address/no PO boxes + contact phone required), ship-to address pulldown (customer addresses or OTHER), prefilled name fields, Address Line 1*, Address Line 2, City*, State*, Zip Code* (5+4), Phone Number. (6) Checkout > Billing: Billing Address pulldown ('Same As Shipping Address' or OTHER), Check if Non U.S. Address, Address Line 1*, Address Line 2, City*, State*, Zip Code*; Card Information: Name on Card*, Card Number*, Expiration Date* (month/year dropdowns), Security Code*, Email Address*; Visa/MasterCard/Discover accepted. (7) Order Review -> Confirmation/Receipt. FEES: $5.00 administrative fee per online/phone transaction (not charged for $0 digital items). LICENSE YEAR: Sept. 1 - Aug. 31; annual packages valid date of sale -> Aug. 31; new licenses on sale Aug. 15; Year-from-Purchase All-Water Package (resident only, $47) valid through end of purchase month of next license year; Lake Texoma License valid until Dec. 31 following issuance. RESIDENCY (official Outdoor Annual): resident = lived continuously in Texas more than six months immediately before buying; also documented Kickapoo Traditional Tribe of Texas members and active-duty U.S. Armed Forces members + dependents anywhere; claiming residency in any other state for any purpose voids TX residency (except tribe/military). EXEMPTIONS: residents - under 17, born before Jan. 1 1931, certain intellectual-disability circumstances (medically approved therapy / supervised by licensed family angler with doctor's note), fishing from bank/pier in a state park or waters fully enclosed by a state park, Free Fishing Day (first Saturday in June). Non-residents - under 17; Louisiana residents 65+ holding a valid Louisiana Recreational Fishing License; Oklahoma residents 65+. PORTAL STATUS: txfgsales.com confirmed live/official (June 2026 TPWD vendor cybersecurity incident affected DL/passport/contact data - NOT SSN/DOB/payment; sales continued; portal unchanged). Field-level evidence: current official help-site screenshots isa3/isa5/isa8/isa9 (txfghelpsupport.com) captured 2026-07-18; older 2021 archive cross-checked (phone/email were optional in 2021, required now; 'Update Residency' button added; SSN label changed from '(xxx-xx-xxxx)' to '(xxxxxxxxx)').\n\nSOURCES:\n- https://www.eregulations.com/texas/fishing/fishing-licenses-and-packages\n- https://www.eregulations.com/texas/fishing/general-fishing-regulations\n- https://www.sos.texas.gov/texreg/pdf/backview/0725/0725is.pdf\n- https://www.txfghelpsupport.com/ISAHelp/InternetSalesHelp.html\n- https://www.txfghelpsupport.com/ISAImages/isa3.png\n- https://www.txfghelpsupport.com/ISAImages/isa5.png\n- https://www.txfghelpsupport.com/ISAImages/isa8.png\n- https://www.txfghelpsupport.com/ISAImages/isa9.png\n- https://www.txfgsales.com/\n- https://tpwd.texas.gov/regulations/outdoor-annual/licenses/fishing-licenses-and-packages\n- https://tpwd.texas.gov/regulations/outdoor-annual/licenses/purchase-requirements\n- https://statutes.capitol.texas.gov/Docs/FA/htm/FA.231.htm\n- https://texasborderbusiness.com/texas-hunting-and-fishing-licenses-on-sale-aug-15/\n- https://www.click2houston.com/news/local/2026/06/22/texas-parks-and-wildlife-warns-3-million-hunting-fishing-license-customers-about-data-breach/",
};

export default config;
