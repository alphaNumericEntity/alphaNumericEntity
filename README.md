### I build privacy-first tools, and fix bugs in the open-source libraries underneath them.

📍 Sydney, Australia

**[PDFAirlock](https://pdfairlock.com)**: PDF tools that run entirely in your browser. Merge, split, compress, redact, sign, protect and convert, with no upload step anywhere.

- **You don't have to trust it.** The site ships a `connect-src 'self'` Content-Security-Policy, so the browser itself refuses to send your file to any other host. It also works with the network off.
- **Redaction that actually removes text.** Marked pages are rebuilt, then the output is re-opened and checked, and you get a report of what the check could and couldn't prove. A companion tool finds text still sitting under someone else's black boxes.
- Next.js static export, pdf.js, qpdf compiled to WebAssembly, and a service worker. [Source](https://github.com/alphaNumericEntity/pdfairlock), AGPL-3.0.

**[pdf-redaction-check](https://github.com/alphaNumericEntity/pdf-redaction-check)**: PDFAirlock's redaction checker as a Node library and CLI. It reports text under black boxes, unapplied Redact annotations, and removed text still sitting in a PDF's earlier saved versions. Its exit codes let it fail a CI job before a leaky PDF ships. MIT.

**[no-phone-home](https://github.com/alphaNumericEntity/no-phone-home)**: fails CI when a web page can contact a host you didn't allow. It reads the Content-Security-Policy the page actually serves and reports every way it still reaches out: fetch and WebSockets, scripts, pixels, frames, form posts and violation reports. MIT.

### Open-source contributions

<!-- contributions:start -->
| Project | Pull request | Status |
|---|---|---|
| [foliojs/pdfkit](https://github.com/foliojs/pdfkit) ★11k | [Say that no font is set instead of failing on null in documents created with font: null](https://github.com/foliojs/pdfkit/pull/1867) | Open |
| [mozilla/pdf.js](https://github.com/mozilla/pdf.js) ★54k | [Render the value of text fields without an appearance stream (issue 20266)](https://github.com/mozilla/pdf.js/pull/22541) | Open |
| [pixijs/pixijs](https://github.com/pixijs/pixijs) ★49k | [fix: stop HTMLText textures coming out smaller than their image](https://github.com/pixijs/pixijs/pull/12412) | Open |
| [necolas/react-native-web](https://github.com/necolas/react-native-web) ★22k | [\[fix\] Responder: keep negative touch identifiers in the touch bank](https://github.com/necolas/react-native-web/pull/2965) | Open |
| [cantoo-scribe/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) ★361 | [Measure standard font text without kerning, as drawText draws it](https://github.com/cantoo-scribe/pdf-lib/pull/182) | Open |
| [better-auth/better-auth](https://github.com/better-auth/better-auth) ★31k | [fix(two-factor): use the issuer option in get-totp-uri](https://github.com/better-auth/better-auth/pull/12637) | Open |
<!-- contributions:end -->

<sub>Updated daily from GitHub by a workflow in this repo.</sub>

### What I work with

TypeScript, React and Next.js, Node.js, Go, Kotlin and Java (Spring Boot), Python. Lately, a lot of PDF internals and browser security.
