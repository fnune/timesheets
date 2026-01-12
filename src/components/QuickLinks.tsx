export default function QuickLinks() {
  return (
    <div className="text-sm space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">How to use</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>Configure your settings below, add your manager to the recipients, then bookmark this page</li>
          <li>Each month, open your bookmark and mark any PTO days</li>
          <li>Click "Print PDF" to save your timesheet as a PDF</li>
          <li>Click "Open email" to draft a message, then attach the PDF and send</li>
        </ol>
        <p className="text-xs text-gray-500">
          The month/year are not saved in the URL, so your bookmark always opens to the previous month.
        </p>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          URL parameters reference
        </summary>
        <div className="mt-2 space-y-2">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1 text-left">Parameter</th>
                <th className="border px-2 py-1 text-left">Example</th>
                <th className="border px-2 py-1 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1 font-mono">name</td>
                <td className="border px-2 py-1 font-mono">Jane%20Doe</td>
                <td className="border px-2 py-1">Employee name</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">company</td>
                <td className="border px-2 py-1 font-mono">Acme Inc</td>
                <td className="border px-2 py-1">Company name</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">country</td>
                <td className="border px-2 py-1 font-mono">DE, US, GB</td>
                <td className="border px-2 py-1"><a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ISO 3166-1 alpha-2</a> country code</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">region</td>
                <td className="border px-2 py-1 font-mono">DE-BY, DE-BE, US-CA</td>
                <td className="border px-2 py-1"><a href="https://en.wikipedia.org/wiki/ISO_3166-2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ISO 3166-2</a> region code (for regional holidays)</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">start</td>
                <td className="border px-2 py-1 font-mono">09:00</td>
                <td className="border px-2 py-1">Default work start time</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">breakStart / breakEnd</td>
                <td className="border px-2 py-1 font-mono">12:00 / 13:00</td>
                <td className="border px-2 py-1">Default break times</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">end</td>
                <td className="border px-2 py-1 font-mono">18:00</td>
                <td className="border px-2 py-1">Default work end time</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">icsUrl</td>
                <td className="border px-2 py-1 font-mono break-all">https://...</td>
                <td className="border px-2 py-1">Company holiday calendar (ICS format)</td>
              </tr>
              <tr>
                <td className="border px-2 py-1 font-mono">emailTo</td>
                <td className="border px-2 py-1 font-mono">hr@example.com, mgr@example.com</td>
                <td className="border px-2 py-1">Email recipients (comma-separated)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
