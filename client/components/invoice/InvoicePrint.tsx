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

  // Compact cell style used throughout
  const cs = "px-1.5 py-0.5"; // compact cell padding
  const csb = `${cs} border-r border-black`; // compact cell + right border

  return (
    <div className="print-a4" style={{
      padding: '10px 14px',
      fontSize: '11px',
      lineHeight: '1.2',
    }}>
      <div className="text-center font-semibold" style={{ fontSize: '13px' }}>TAX INVOICE</div>
      <div className="text-center font-extrabold tracking-wide" style={{ color: '#4F81BD', fontSize: '28px', lineHeight: '1.1' }}>{profile.name}</div>
      <div className="text-center uppercase" style={{ fontSize: '11px' }}>{profile.trade}</div>
      <div className="mt-1 flex items-center justify-center gap-6 pb-1 border-b border-black" style={{ fontSize: '10px' }}>
        <div>GSTIN NO. - {profile.gstin}</div>
        <div>MSME NO. - {profile.msme}</div>
      </div>
      <div className="text-center uppercase" style={{ fontSize: '10px', marginTop: '2px' }}>{profile.addressLine}</div>
      <div className="text-center pb-1 border-b border-black" style={{ fontSize: '10px' }}>{profile.contact} , E - MAIL - {profile.email}</div>

      {/* Meta table */}
      <div className="mt-1 grid grid-cols-2 gap-1">
        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <tbody>
            <tr className="border-b border-black"><td className={`${csb} w-32`}>Invoice No.</td><td className={cs}>{invoice.number}</td></tr>
            <tr className="border-b border-black"><td className={csb}>Invoice Date</td><td className={cs}>{fmtDate(invoice.date)}</td></tr>
            <tr className="border-b border-black"><td className={csb}>P. O. No.</td><td className={cs}>{invoice.meta?.poNo ?? ""}</td></tr>
            <tr><td className={csb}>P. O. Date</td><td className={cs}>{fmtDate(invoice.meta?.poDate)}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <tbody>
            <tr className="border-b border-black"><td className={`${csb} w-32`}>Transport Mode</td><td className={cs}>{invoice.meta?.transportMode ?? ""}</td></tr>
            <tr className="border-b border-black"><td className={csb}>Vehicle No.</td><td className={cs}>{invoice.meta?.vehicleNo ?? ""}</td></tr>
            <tr className="border-b border-black"><td className={csb}>Date Of Supply</td><td className={cs}>{fmtDate(invoice.meta?.dateOfSupply)}</td></tr>
            <tr><td className={csb}>L. R. No.</td><td className={cs}>{invoice.meta?.lrNo ?? ""}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Parties */}
      <div className="mt-1 grid grid-cols-2 gap-1">
        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <thead><tr className="border-b border-black"><th className={`${cs} text-left bg-gray-50/50`}>Details Of Receiver / Billed To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className={`${cs} font-medium`}>Name : {invoice.customer.name}</td></tr>
            <tr className="border-b border-black"><td className={cs}>Address : {invoice.customer.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className={cs}>GSTIN : {invoice.customer.gstin ?? ""}</td></tr>
            <tr><td className={cs}>State & Code : {fmtStateCode(invoice.customer.state)}</td></tr>
          </tbody>
        </table>
        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <thead><tr className="border-b border-black"><th className={`${cs} text-left bg-gray-50/50`}>Details Of Consignee / Shipped To</th></tr></thead>
          <tbody>
            <tr className="border-b border-black"><td className={`${cs} font-medium`}>Name : {ship.name}</td></tr>
            <tr className="border-b border-black"><td className={cs}>Address : {ship.address ?? ""}</td></tr>
            <tr className="border-b border-black"><td className={cs}>GSTIN : {ship.gstin ?? ""}</td></tr>
            <tr><td className={cs}>State & Code : {fmtStateCode(ship.state)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Items table */}
      <div className="mt-1" style={{ minHeight: '120px', display: 'flex', flexDirection: 'column' }}>
        <table className="w-full border border-black inv-tbl h-full flex-grow" style={{ fontSize: '10px' }}>
          <thead className="border-b border-black bg-gray-50/50">
            <tr>
              <th className={`${csb} w-8 text-center`}>Sr.<br/>No.</th>
              <th className={`${csb} text-left`}>Product Name</th>
              <th className={`${csb} text-center w-20`}>HSN Code</th>
              <th className={`${csb} text-center w-16`}>No. of<br/>Pkgs</th>
              <th className={`${csb} text-center w-16`}>Qty<br/>Per</th>
              <th className={`${csb} text-center w-16`}>Total<br/>Qty</th>
              <th className={`${csb} text-center w-20`}>Rate</th>
              <th className={`${cs} text-right w-24`}>Taxable<br/>Value</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={it.id} className="border-b border-black align-top">
                <td className={`${csb} text-center font-medium`}>{i+1}</td>
                <td className={csb}>{it.productName}</td>
                <td className={`${csb} text-center`}>{it.hsn ?? ""}</td>
                <td className={`${csb} text-center align-middle`}>
                  <div className="font-medium">{it.packages ?? ""}</div>
                  {it.packageType && <div className="text-gray-700" style={{ fontSize: '9px' }}>{it.packageType}</div>}
                </td>
                <td className={`${csb} text-center align-middle`}>
                  <div className="font-medium">{it.quantityPer ?? ""}</div>
                  {it.unit && <div className="text-gray-700" style={{ fontSize: '9px' }}>{it.unit}</div>}
                </td>
                <td className={`${csb} text-center align-middle`}>
                  <div className="font-medium">{it.qty}</div>
                  {it.unit && <div className="text-gray-700" style={{ fontSize: '9px' }}>{it.unit}</div>}
                </td>
                <td className={`${csb} text-center align-middle`}>
                  <div className="font-medium">{INR(it.rate)}</div>
                  {it.unit ? <div className="text-gray-700 whitespace-nowrap" style={{ fontSize: '9px' }}>Per {it.unit === 'Nos.' ? 'No.' : it.unit === 'Sheets' ? 'Sheet' : it.unit}</div> : null}
                </td>
                <td className={`${cs} text-right font-semibold`}>{INR(it.qty * it.rate)}</td>
              </tr>
            ))}
            {/* Filler row to take up remaining space if items list is small */}
            <tr className="align-top h-full">
                <td className={`${csb} text-center`}></td>
                <td className={csb}></td>
                <td className={`${csb} text-center`}></td>
                <td className={`${csb} text-center align-middle`}></td>
                <td className={`${csb} text-center align-middle`}></td>
                <td className={`${csb} text-center align-middle`}></td>
                <td className={`${csb} text-center align-middle`}></td>
                <td className={`${cs} text-right`}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom two-column */}
      <div className="mt-1 grid grid-cols-2 gap-1">
        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <tbody>
            <tr><td className={`${cs} font-semibold bg-gray-50/50 border-b border-black`}>Our Bank Details :-</td></tr>
            <tr><td className={cs}><span className="font-medium">Name:</span> {profile.name}</td></tr>
            <tr><td className={cs}><span className="font-medium">Bank:</span> {profile.bank.bank}</td></tr>
            <tr><td className={cs}><span className="font-medium">A/C No.:</span> {profile.bank.account}</td></tr>
            <tr><td className={cs}><span className="font-medium">IFSC:</span> {profile.bank.ifsc}</td></tr>
            <tr><td className={cs}><span className="font-medium">Branch:</span> {profile.bank.branch}</td></tr>
          </tbody>
        </table>

        <table className="w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
          <tbody>
            <tr className="border-b border-black"><td className={csb}>Freight</td><td className={`${cs} text-right`}>{INR(invoice.freight ?? 0)}</td></tr>
            <tr className="border-b border-black"><td className={`${csb} font-semibold`}>Total Amount Before Tax</td><td className={`${cs} text-right font-semibold`}>{INR(invoice.totals.subtotal + (invoice.freight ?? 0))}</td></tr>
            {invoice.taxType === 'intra' && (
              <>
                <tr className="border-b border-black"><td className={csb}>Add : CGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className={`${cs} text-right`}>{INR(invoice.totals.cgst)}</td></tr>
                <tr className="border-b border-black"><td className={csb}>Add : SGST @ {(invoice.taxRate/2).toFixed(0)} %</td><td className={`${cs} text-right`}>{INR(invoice.totals.sgst)}</td></tr>
              </>
            )}
            {invoice.taxType === 'inter' && (
              <tr className="border-b border-black"><td className={csb}>Add : IGST @ {invoice.taxRate} %</td><td className={`${cs} text-right`}>{INR(invoice.totals.igst)}</td></tr>
            )}
            <tr className="border-b border-black"><td className={`${csb} font-medium`}>Tax Amount : GST @ {invoice.taxRate} %</td><td className={`${cs} text-right font-medium`}>{INR(invoice.totals.cgst + invoice.totals.sgst + invoice.totals.igst)}</td></tr>
            <tr className="border-b border-black"><td className={csb}>Round Off.</td><td className={`${cs} text-right`}>{roundOff.toFixed(2)}</td></tr>
            <tr className="bg-gray-50/50"><td className={`${csb} font-bold`} style={{ fontSize: '12px' }}>Total Amount After Tax</td><td className={`${cs} text-right font-bold`} style={{ fontSize: '12px' }}>{INR(grand)}</td></tr>
          </tbody>
        </table>
      </div>

      <table className="mt-1 w-full border border-black inv-tbl" style={{ fontSize: '10px' }}>
        <tbody>
          <tr className="border-b border-black"><td className={`${csb} w-48 font-semibold bg-gray-50/50`}>Total Invoice Amount In Words :</td><td className={`${cs} font-medium`}>Rupees {amountToWordsIndian(grand)}</td></tr>
          <tr className="border-b border-black"><td className={`${csb} font-semibold bg-gray-50/50`}>Payment Term :</td><td className={cs}>{invoice?.meta?.paymentTerm ?? "Advance"} Days</td></tr>
          <tr><td className={`${csb} font-semibold bg-gray-50/50`}>Due Date :</td><td className={cs}>{fmtDate(invoice?.meta?.dueDate)}</td></tr>
        </tbody>
      </table>

      <div className="mt-1 grid grid-cols-2 gap-1" style={{ pageBreakInside: 'avoid' }}>
        <div className="border border-black p-2 text-center flex items-end justify-center" style={{ fontSize: '10px', minHeight: '70px' }}>
          <span className="font-medium text-gray-500">Receiver's Signature & Stamp</span>
        </div>
        <div className="border border-black p-2 text-right flex flex-col justify-between" style={{ fontSize: '10px', minHeight: '70px' }}>
          <div className="text-gray-700" style={{ fontSize: '9px' }}>We hereby certify that the particulars given above are true & correct.</div>
          <div className="font-bold" style={{ fontSize: '12px' }}>For {profile.name}</div>
          
          <div className="flex justify-end items-center my-1" style={{ minHeight: '40px' }}>
            {wantStamp && (
              <img
                src={stampUrls[org]}
                alt="Company stamp"
                className="pointer-events-none select-none opacity-80 mix-blend-multiply object-contain mr-4"
                style={{ height: '50px', width: '50px' }}
              />
            )}
          </div>
          
          <div className="font-medium">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
