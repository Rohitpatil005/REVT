import { Invoice, Org, INR } from "@/lib/data/types";
import { Orgs } from "@/lib/orgs";
import { amountToWordsIndian } from "@/lib/amountToWords";

export default function InvoicePrint({ invoice }: { invoice: Invoice }) {
  const org: Org = invoice.org;
  const profile = Orgs[org];
  const grandBeforeRound = invoice.totals.total;
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

  function fmtDate(d?: string | number | Date) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  return (
    <div className="print-a4" style={{
      padding: '16px',
      fontSize: '14px',
      lineHeight: '1.25',
    }}>
      <div className="text-center font-semibold text-lg">TAX INVOICE</div>
      <div className="text-center text-[40px] font-extrabold tracking-wide" style={{ color: '#4F81BD' }}>{profile.name}</div>
      <div className="text-center uppercase text-[14px]">{profile.trade}</div>
      <div className="mt-2 flex items-center justify-center gap-6 text-[13px] pb-2 border-b border-black">
        <div>GSTIN NO. - {profile.gstin}</div>
        <div>MSME NO. - {profile.msme}</div>
      </div>
      <div className="mt-2 text-center text-[13px] uppercase">{profile.addressLine}</div>
      <div className="text-center text-[13px] pb-2 border-b border-black">{profile.contact} , E - MAIL - {profile.email}</div>

      {/* Meta table */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[12px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-2 border-r border-black w-40">Invoice No.</td><td className="p-2">{invoice.number}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">Invoice Date</td><td className="p-2">{fmtDate(invoice.date)}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">P. O. No.</td><td className="p-2">{invoice.meta?.poNo ?? ""}</td></tr>
            <tr><td className="p-2 border-r border-black">P. O. Date</td><td className="p-2">{fmtDate(invoice.meta?.poDate)}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl text-[12px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-2 border-r border-black w-40">Transport Mode</td><td className="p-2">{invoice.meta?.transportMode ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">Vehicle No.</td><td className="p-2">{invoice.meta?.vehicleNo ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">Date Of Supply</td><td className="p-2">{fmtDate(invoice.meta?.dateOfSupply)}</td></tr>
            <tr><td className="p-2 border-r border-black">L. R. No.</td><td className="p-2">{invoice.meta?.lrNo ?? ""}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Parties */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[12px]">
          <thead><tr className="border-b border-black"><th className="p-2 text-left bg-gray-50/50">Details Of Receiver / Billed To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className="p-2 font-medium">Name : {invoice.customer.name}</td></tr>
            <tr className="border-b border-black"><td className="p-2">Address : {invoice.customer.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-2">GSTIN : {invoice.customer.gstin ?? ""}</td></tr>
            <tr><td className="p-2">State & Code : {fmtStateCode(invoice.customer.state)}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl text-[12px]">
          <thead><tr className="border-b border-black"><th className="p-2 text-left bg-gray-50/50">Details Of Consignee / Shipped To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className="p-2 font-medium">Name : {ship.name}</td></tr>
            <tr className="border-b border-black"><td className="p-2">Address : {ship.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className="p-2">GSTIN : {ship.gstin ?? ""}</td></tr>
            <tr><td className="p-2">State & Code : {fmtStateCode(ship.state)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Items table */}
      <div className="mt-2" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
        <table className="w-full border border-black inv-tbl text-[11px] h-full flex-grow">
          <thead className="border-b border-black bg-gray-50/50">
            <tr>
              <th className="p-2 border-r border-black w-10 text-center">Sr.<br/>No.</th>
              <th className="p-2 border-r border-black text-left">Product Name</th>
              <th className="p-2 border-r border-black text-center w-28">HSN Code</th>
              <th className="p-2 border-r border-black text-center w-24">No. of<br/>Packages</th>
              <th className="p-2 border-r border-black text-center w-24">Quantity<br/>Per</th>
              <th className="p-2 border-r border-black text-center w-24">Total<br/>Quantity</th>
              <th className="p-2 border-r border-black text-center w-28">Rate</th>
              <th className="p-2 text-right w-36">Taxable<br/>Value</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={it.id} className="border-b border-black align-top">
                <td className="p-2 border-r border-black text-center font-medium">{i+1}</td>
                <td className="p-2 border-r border-black">{it.productName}</td>
                 <td className="p-2 border-r border-black text-center">{it.hsn ?? ""}</td>
                <td className="p-2 border-r border-black text-center align-middle">
                  <div className="font-medium">{it.packages ?? ""}</div>
                  <div className="text-[11px] text-gray-700" style={{ marginTop: '2px' }}>{it.packageType ?? ""}</div>
                </td>
                <td className="p-2 border-r border-black text-center align-middle">
                  <div className="font-medium">{it.quantityPer ?? ""}</div>
                  <div className="text-[11px] text-gray-700" style={{ marginTop: '2px' }}>{it.unit ?? ""}</div>
                </td>
                <td className="p-2 border-r border-black text-center align-middle">
                  <div className="font-medium">{it.qty}</div>
                  <div className="text-[11px] text-gray-700" style={{ marginTop: '2px' }}>{it.unit ?? ""}</div>
                </td>
                <td className="p-2 border-r border-black text-center align-middle">
                  <div className="font-medium">{INR(it.rate)}</div>
                  {it.unit ? <div className="text-[11px] text-gray-700 whitespace-nowrap" style={{ marginTop: '2px' }}>Per {it.unit === 'Nos.' ? 'No.' : it.unit === 'Sheets' ? 'Sheet' : it.unit}</div> : null}
                </td>
                <td className="p-2 text-right font-semibold">{INR(it.qty * it.rate)}</td>
              </tr>
            ))}
            {/* Filler row to take up remaining space if items list is small */}
            <tr className="align-top h-full">
                <td className="p-2 border-r border-black text-center"></td>
                <td className="p-2 border-r border-black"></td>
                 <td className="p-2 border-r border-black text-center"></td>
                <td className="p-2 border-r border-black text-center align-middle"></td>
                <td className="p-2 border-r border-black text-center align-middle"></td>
                <td className="p-2 border-r border-black text-center align-middle"></td>
                <td className="p-2 border-r border-black text-center align-middle"></td>
                <td className="p-2 text-right"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom two-column */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <table className="w-full border border-black inv-tbl text-[12px]">
          <tbody>
            <tr><td className="p-2 font-semibold bg-gray-50/50 border-b border-black">Our Bank Details :-</td></tr>
            <tr><td className="p-2"><span className="font-medium">Name:</span> {profile.name}</td></tr>
            <tr><td className="p-2"><span className="font-medium">Bank:</span> {profile.bank.bank}</td></tr>
            <tr><td className="p-2"><span className="font-medium">A/C No.:</span> {profile.bank.account}</td></tr>
            <tr><td className="p-2"><span className="font-medium">IFSC:</span> {profile.bank.ifsc}</td></tr>
            <tr><td className="p-2"><span className="font-medium">Branch:</span> {profile.bank.branch}</td></tr>
          </tbody>
        </table>

        <table className="w-full border border-black inv-tbl text-[12px]">
          <tbody>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">Freight</td><td className="p-2 text-right">{INR(invoice.freight ?? 0)}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black font-semibold">Total Amount Before Tax</td><td className="p-2 text-right font-semibold">{INR(invoice.totals.subtotal + (invoice.freight ?? 0))}</td></tr>
            {invoice.taxType === 'intra' && (
              <>
                <tr className="border-b border-black"><td className="p-2 border-r border-black">Add : CGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className="p-2 text-right">{INR(invoice.totals.cgst)}</td></tr>
                <tr className="border-b border-black"><td className="p-2 border-r border-black">Add : SGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className="p-2 text-right">{INR(invoice.totals.sgst)}</td></tr>
              </>
            )}
            {invoice.taxType === 'inter' && (
              <tr className="border-b border-black"><td className="p-2 border-r border-black">Add : IGST @ {invoice.taxRate} %</td><td className="p-2 text-right">{INR(invoice.totals.igst)}</td></tr>
            )}
            <tr className="border-b border-black"><td className="p-2 border-r border-black font-medium">Tax Amount : GST @ {invoice.taxRate} %</td><td className="p-2 text-right font-medium">{INR(invoice.totals.cgst + invoice.totals.sgst + invoice.totals.igst)}</td></tr>
            <tr className="border-b border-black"><td className="p-2 border-r border-black">Round Off.</td><td className="p-2 text-right">{roundOff.toFixed(2)}</td></tr>
            <tr className="bg-gray-50/50"><td className="p-2 border-r border-black font-bold text-[14px]">Total Amount After Tax</td><td className="p-2 text-right font-bold text-[14px]">{INR(grand)}</td></tr>
          </tbody>
        </table>
      </div>

      <table className="mt-2 w-full border border-black inv-tbl text-[12px]">
        <tbody>
          <tr className="border-b border-black"><td className="p-2 border-r border-black w-60 font-semibold bg-gray-50/50">Total Invoice Amount In Words :</td><td className="p-2 font-medium">Rupees {amountToWordsIndian(grand)}</td></tr>
          <tr className="border-b border-black"><td className="p-2 border-r border-black font-semibold bg-gray-50/50">Payment Term :</td><td className="p-2">{invoice?.meta?.paymentTerm ?? "Advance"} Days</td></tr>
          <tr><td className="p-2 border-r border-black font-semibold bg-gray-50/50">Due Date :</td><td className="p-2">{fmtDate(invoice?.meta?.dueDate)}</td></tr>
        </tbody>
      </table>

      <div className="mt-2 grid grid-cols-2 gap-3" style={{ pageBreakInside: 'avoid' }}>
        <div className="border border-black p-4 text-center text-[12px] flex items-end justify-center min-h-[120px]">
          <span className="font-medium text-gray-500">Receiver's Signature & Stamp</span>
        </div>
        <div className="border border-black p-4 text-right text-[12px] flex flex-col justify-between min-h-[120px]">
          <div className="text-[11px] text-gray-700">We hereby certify that the particulars given above are true & correct.</div>
          <div className="mt-2 font-bold text-[14px]">For {profile.name}</div>
          
          <div className="flex justify-end items-center my-2 min-h-[60px]">
            {wantStamp && (
              <img
                src={stampUrls[org]}
                alt="Company stamp"
                className="pointer-events-none select-none opacity-80 mix-blend-multiply h-20 w-20 object-contain mr-6"
              />
            )}
          </div>
          
          <div className="font-medium">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
