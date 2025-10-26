export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-slate-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Introduction</h2>
              <p>
                MobileToolsBox ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, and safeguard your information when you use our mobile application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Information We Collect</h2>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Account information (if you create an account)</li>
                <li>User-generated content (notes, todos, voice recordings)</li>
                <li>App usage patterns and preferences</li>
              </ul>
              
              <h3 className="text-lg font-medium text-slate-800 mb-2 mt-4">Technical Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Device information (model, operating system)</li>
                <li>App performance and crash reports</li>
                <li>Anonymous usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain the app's functionality</li>
                <li>Store your personal productivity data locally</li>
                <li>Improve app performance and user experience</li>
                <li>Process optional donations through secure payment providers</li>
                <li>Respond to user support requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Data Storage and Security</h2>
              <p className="mb-3">
                Your personal productivity data (notes, todos, habits, etc.) is primarily stored locally on your device. 
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Local data encryption</li>
                <li>Secure transmission protocols (HTTPS)</li>
                <li>Limited data collection practices</li>
                <li>Regular security updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Third-Party Services</h2>
              <p className="mb-3">We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Stripe:</strong> For processing optional donations (subject to Stripe's privacy policy)</li>
                <li><strong>Analytics:</strong> Anonymous usage data to improve the app</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Rights</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
                <li>Opt out of analytics</li>
                <li>Request data corrections</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Children's Privacy</h2>
              <p>
                Our app is safe for users of all ages. We do not knowingly collect personal information from 
                children under 13 without parental consent. The app contains no inappropriate content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of any significant 
                changes through the app or by posting the new policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                <p><strong>Email:</strong> privacy@mobiletoolsbox.com</p>
                <p><strong>Support:</strong> support@mobiletoolsbox.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}