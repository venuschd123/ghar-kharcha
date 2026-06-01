import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By installing or using Ghar Kharcha ("the App"), you agree to these Terms of Use. If you do not agree, please uninstall the App and do not use it.`,
  },
  {
    title: '2. Nature of the App',
    body: `Ghar Kharcha is a personal expense-tracking tool designed to help homeowners and builders record construction costs for their own reference. It is NOT:\n\n• A licensed accounting, auditing, or bookkeeping service\n• A financial advisor or investment advisor\n• A legal, tax, or compliance advisor\n• A substitute for professional CA, CS, or legal services\n\nAll data entered is for your personal record-keeping only. Do not rely on this App for tax filings, legal disputes, insurance claims, or any formal financial or legal purpose without independent professional verification.`,
  },
  {
    title: '3. Your Data — Local Storage Only',
    body: `All data (expenses, photos, vendor contacts, project details) is stored exclusively on your device using your browser's IndexedDB. The App has no servers and transmits no data over the internet.\n\nThis means:\n• We cannot access, read, recover, or restore your data under any circumstances\n• If you clear your browser data, uninstall the App, or your device is lost/damaged, your data is permanently gone\n• You are solely responsible for maintaining backups (use Settings → Export Backup regularly)\n\nWe disclaim all liability for any data loss arising from device failure, browser updates, accidental deletion, or any other cause.`,
  },
  {
    title: '4. Receipt Photos & Camera',
    body: `When you photograph a receipt, the image is stored locally on your device in IndexedDB — it is never uploaded to any server. OCR (receipt scanning) is processed entirely on-device using Tesseract.js. No image data leaves your device.\n\nOCR results are approximate and should be verified before use. We are not liable for incorrect amounts extracted from photos.`,
  },
  {
    title: '5. Pro Features & Payments',
    body: `Ghar Kharcha Pro features are currently in early access. The free trial does not require payment. Any future paid plans will be clearly disclosed before any charge is made.\n\nNo payment is processed within the App at this time. If a payment page is added in the future, it will be handled by a regulated payment processor and governed by a separate payment terms document.\n\nActivation codes, if issued, are for personal use only and may not be shared, resold, or transferred.`,
  },
  {
    title: '6. No Warranty',
    body: `The App is provided "as is" and "as available" without any warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.\n\nWe do not guarantee that the App will be error-free, uninterrupted, or that calculations are correct in all cases. Always verify critical figures independently.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, the developers of Ghar Kharcha shall not be liable for any:\n\n• Loss of data or inability to access data\n• Financial loss arising from reliance on App calculations\n• Indirect, incidental, special, or consequential damages\n• Loss of business, revenue, or profits\n\nThis limitation applies regardless of the cause and whether based in contract, tort, negligence, or any other legal theory.`,
  },
  {
    title: '8. Permitted Use',
    body: `You may use the App for your own personal construction or renovation expense tracking. You may not:\n\n• Reverse-engineer, decompile, or extract the App's source code for commercial purposes\n• Use the App to process data on behalf of third parties as a service\n• Remove or alter any legal notices or branding within the App`,
  },
  {
    title: '9. Children',
    body: `The App is intended for adults (18+) managing construction projects. It is not directed at children under 13. We do not knowingly collect any information from minors.`,
  },
  {
    title: '10. Changes to These Terms',
    body: `We may update these Terms from time to time. Continued use of the App after such changes constitutes your acceptance of the updated terms. The "Last updated" date at the bottom of this page will reflect any changes.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by the laws of India. Any disputes arising under these Terms shall be subject to the jurisdiction of courts in India. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force.`,
  },
  {
    title: '12. Contact',
    body: `For questions or concerns about these Terms, contact us at:\nghar.kharcha.app@gmail.com`,
  },
];

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <span className="page-title">Terms of Use</span>
        <div style={{ width: 38 }} />
      </header>

      <div style={{ padding: '0 var(--px)' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '12px 16px',
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20,
          border: '1px solid var(--border)',
        }}>
          <strong style={{ color: 'var(--text)' }}>Plain-language summary:</strong> All your data stays on your phone — we never see it. This app is a personal tracker, not a CA or legal service. Use the Export backup feature regularly. No payments are processed in the app right now.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SECTIONS.map(({ title, body }) => (
            <div key={title} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 16px',
              boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{body}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--text-3)' }}>
          Last updated: June 2026
        </div>
      </div>
    </div>
  );
}
