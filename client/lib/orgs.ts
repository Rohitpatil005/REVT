import { Org } from "./data/types";

export const Orgs: Record<Org, {
  name: string;
  trade: string;
  gstin: string;
  msme: string;
  contact: string;
  email: string;
  addressLine: string;
  bank: { bank: string; account: string; ifsc: string; branch: string };
}> = {
  rohit: {
    name: "ROHIT ENTERPRISES",
    trade: "SUPPLIERS OF INDUSTRIAL CHEMICALS & INSULATION PRODUCTS",
    gstin: "27ANPPP1249L1ZE",
    msme: "UDYAM-MH-26-0274528",
    contact: "MOBILE - 9890352222",
    email: "rohitent2006@rediffmail.com",
    addressLine:
      "FLAT NO. A - 5 , DARPAN CO - OP HOUSING SOCIETY , OFF NEW D. P. ROAD JAGTAP DAIRY , VISHAL NAGAR , PIMPLE NILAKH , PUNE - 411027",
    bank: {
      bank: "HDFC Bank",
      account: "50200017516152",
      ifsc: "HDFC0003982",
      branch: "Pimple Nilakh , Pune - 411027",
    },
  },
  vighneshwar: {
    name: "VIGHNESHWAR TRADERS",
    trade: "SUPPLIERS OF CIVIL & PACKAGING MATERIALS",
    gstin: "27ALPPP6828H1ZG",
    msme: "UDYAM-MH-26-0262264",
    contact: "MOBILE - 9890352222",
    email: "vighneshwartraders@gmail.com",
    addressLine:
      "FLAT NO. A - 5 , DARPAN CO - OP HOUSING SOCIETY , OFF NEW D. P. ROAD JAGTAP DAIRY , VISHAL NAGAR , PIMPLE NILAKH , PUNE - 411027",
    bank: {
      bank: "HDFC BANK",
      account: "50200044012483",
      ifsc: "HDFC0003982",
      branch: "Pimple Nilakh , Pune",
    },
  },
};
