import { Invoice, Org, INR } from "@/lib/data/types";
import { Orgs } from "@/lib/orgs";
import { amountToWordsIndian } from "@/lib/amountToWords";

export default function InvoicePrint({ invoice }: { invoice: Invoice }) {
  const org: Org = invoice.org;
  const profile = Orgs[org];
  const grandBeforeRound = (invoice.totals.total + (invoice.freight ?? 0));
  const roundOff = Math.round(grandBeforeRound) - grandBeforeRound;
  const grand = grandBeforeRound + roundOff;
  const ship = invoice.shipping ?? invoice.customer;
  function fmtStateCode(s?: string) {
    if (!s) return "";
    const m = s.match(/^\s*(.*?)\s*(?:[- ]\s*)?(\d{2})\s*$/);
    if (m) return `${m[1]}(${m[2]})`;
    return s;
  }

  const wantStamp = !!invoice?.meta?.stamped;
  const stampUrls: Record<Org, string> = {
    rohit: "https://cdn.builder.io/api/v1/image/assets%2F286324d8989e4ca6baf7420b6841ad90%2Ff65e4168987046ecbd26086f088e2bfe?format=webp&width=800",
    vighneshwar: "https://cdn.builder.io/api/v1/image/assets%2F286324d8989e4ca6baf7420b6841ad90%2Ffcb987f4399a43aaaab48f21e14bc60a?format=webp&width=800",
  };

  return (
    <div className="print-a4 p-4 text-[14px] leading-tight text-black" style={{ border: '1px solid #000' }}>
      <div className="text-center font-semibold">TAX INVOICE</div>
      <div className="text-center text-[32px] font-extrabold tracking-wide" style={{ color: '#4F81BD' }}>{profile.name}</div>
      <div className="text-center uppercase text-[12px]">{profile.trade}</div>
      <div className="mt-1 flex items-center justify-center gap-6 text-[11px] pb-1 border-b border-black">
        <div>GSTIN NO. - {profile.gstin}</div>
        <div>MSME NO. - {profile.msme}</div>
      </div>
      <div className="mt-1 text-center text-[10px] uppercase">{profile.addressLine}</div>
      <div className="text-center text-[10px] pb-1 border-b border-black">{profile.contact} , E - MAIL - {profile.email}</div>

      {/* Meta table */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[10px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-1 w-40">Invoice No.</td><td className="p-1">{invoice.number}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Invoice Date</td><td className="p-1">{new Date(invoice.date).toLocaleDateString()}</td></tr>
            <tr className="border-b border-black"><td className="p-1">P. O. No.</td><td className="p-1">{invoice.meta?.poNo ?? ""}</td></tr>
            <tr><td className="p-1">P. O. Date</td><td className="p-1">{invoice.meta?.poDate ? new Date(invoice.meta!.poDate!).toLocaleDateString() : ""}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl text-[10px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-1 w-40">Transport Mode</td><td className="p-1">{invoice.meta?.transportMode ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Vehicle No.</td><td className="p-1">{invoice.meta?.vehicleNo ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Date Of Supply</td><td className="p-1">{invoice.meta?.dateOfSupply ? new Date(invoice.meta!.dateOfSupply!).toLocaleDateString() : ""}</td></tr>
            <tr><td className="p-1">L. R. No.</td><td className="p-1">{invoice.meta?.lrNo ?? ""}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Parties */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[10px]">
          <thead><tr className="border-b border-black"><th className="p-1 text-left">Details Of Receiver / Billed To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className="p-1">Name : {invoice.customer.name}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Address : {invoice.customer.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-1">GSTIN : {invoice.customer.gstin ?? ""}</td></tr>
            <tr><td className="p-1">State & Code {fmtStateCode(invoice.customer.state)}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl text-[10px]">
          <thead><tr className="border-b border-black"><th className="p-1 text-left">Details Of Consignee / Shipped To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className="p-1">Name : {ship.name}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Address : {ship.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-1">GSTIN : {ship.gstin ?? ""}</td></tr>
            <tr><td className="p-1">State & Code {fmtStateCode(ship.state)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Items table */}
      <div className="mt-2">
        <table className="w-full border border-black inv-tbl text-[10px]">
          <thead className="border-b border-black">
            <tr>
              <th className="p-1 w-6 text-left">Sr. No.</th>
              <th className="p-1 text-left">Product Name</th>
              <th className="p-1">HSN Code</th>
              <th className="p-1">No. of Packages</th>
              <th className="p-1">Quantity Per</th>
              <th className="p-1">Total Quantity</th>
              <th className="p-1">Rate</th>
              <th className="p-1">Taxable Value</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={it.id} className="border-t border-black align-top">
                <td className="p-1">{i+1}</td>
                <td className="p-1">{it.productName}</td>
                <td className="p-1 text-center">{it.hsn ?? ""}</td>
                <td className="p-1 text-center"><div>{it.packages ?? ""}</div><div className="text-[9px]">{it.packageType ?? ""}</div></td>
                <td className="p-1 text-center"><div>{it.quantityPer ?? ""}</div><div className="text-[9px]">{it.unit ?? ""}</div></td>
                <td className="p-1 text-center"><div>{it.qty}</div><div className="text-[9px]">{it.unit ?? ""}</div></td>
                <td className="p-1 text-center">{INR(it.rate)}{it.unit ? `\nPer ${it.unit}` : ""}</td>
                <td className="p-1 text-right">{INR(it.qty * it.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom two-column */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[10px]">
          <tbody>
            <tr><td className="p-1 font-semibold">Our Bank Details :-</td></tr>
            <tr><td className="p-1">{profile.name.split(" ")[0]} {profile.name.split(" ")[1] ?? ""}</td></tr>
            <tr><td className="p-1">{profile.bank.bank}</td></tr>
            <tr><td className="p-1">A/C No. :- {profile.bank.account}</td></tr>
            <tr><td className="p-1">IFSC - {profile.bank.ifsc}</td></tr>
            <tr><td className="p-1">Branch - {profile.bank.branch}</td></tr>
          </tbody>
        </table>

        <table className="w-full border border-black inv-tbl text-[10px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-1">Freight</td><td className="p-1 text-right">{INR(invoice.freight ?? 0)}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Total Amount Before Tax</td><td className="p-1 text-right">{INR(invoice.totals.subtotal)}</td></tr>
            {invoice.taxType === 'intra' && (
              <>
                <tr className="border-b border-black"><td className="p-1">Add : CGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className="p-1 text-right">{INR(invoice.totals.cgst)}</td></tr>
                <tr className="border-b border-black"><td className="p-1">Add : SGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className="p-1 text-right">{INR(invoice.totals.sgst)}</td></tr>
              </>
            )}
            {invoice.taxType === 'inter' && (
              <tr className="border-b border-black"><td className="p-1">Add : IGST @ {invoice.taxRate} %</td><td className="p-1 text-right">{INR(invoice.totals.igst)}</td></tr>
            )}
            <tr className="border-b border-black"><td className="p-1">Tax Amount : GST @ {invoice.taxRate} %</td><td className="p-1 text-right">{INR(invoice.totals.cgst + invoice.totals.sgst + invoice.totals.igst)}</td></tr>
            <tr className="border-b border-black"><td className="p-1">Round Off.</td><td className="p-1 text-right">{roundOff.toFixed(2)}</td></tr>
            <tr><td className="p-1 font-semibold">Total Amount After Tax</td><td className="p-1 text-right font-semibold">{INR(grand)}</td></tr>
          </tbody>
        </table>
      </div>

      <table className="mt-2 w-full border border-black inv-tbl text-[10px]">
        <tbody>
          <tr className="border-b border-black"><td className="p-1 w-48">Total Invoice Amount In Words :</td><td className="p-1">Rupees {amountToWordsIndian(grand)}</td></tr>
          <tr className="border-b border-black"><td className="p-1">Payment Term :</td><td className="p-1">{invoice?.meta?.paymentTerm ?? ""}</td></tr>
          <tr><td className="p-1">Due Date :</td><td className="p-1">{invoice?.meta?.dueDate ? new Date(invoice.meta!.dueDate!).toLocaleDateString() : ""}</td></tr>
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="border border-black p-8 text-center text-[10px]">Receiver's Signature & Stamp</div>
        <div className="relative border border-black p-4 text-right text-[10px]">
          <div>We hereby certify that the particulars given above are true & correct.</div>
          <div className="mt-6">For {profile.name.split(" ")[0]} {profile.name.split(" ")[1] ?? ""}</div>
          {wantStamp && (
            <img
              src={stampUrls[org]}
              alt="Company stamp"
              className="pointer-events-none select-none absolute right-6 bottom-6 opacity-80 mix-blend-multiply h-20 w-20 object-contain"
            />
          )}
          <div className="mt-10">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
