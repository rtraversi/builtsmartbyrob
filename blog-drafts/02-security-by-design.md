# Security by Design: How I Keep Your Data and Automations Secure

When you bring AI and automation into a practice that handles sensitive client information, one question matters before any other: *is this safe?*

For an immigration or family law practice — where clients hand over the most personal details of their lives — "trust me, it's fine" isn't good enough. So instead of a promise, here's the concrete version: seven specific ways I build every setup so your data and your automations stay protected. No jargon required.

## 1. Your data is completely isolated — it never shares a database with another firm

This is the foundation everything else sits on. Your practice gets its **own** database, its **own** website, and its **own** AI key. There is no shared, multi-tenant system where a single bug could leak one firm's data to another — because the firms aren't in the same system to begin with. The separation is physical, not just a setting. One firm, one walled-off environment.

## 2. Everything is encrypted — in transit and at rest

Every connection is encrypted (HTTPS/TLS), and it's *enforced* — there's no way to reach your system over an unencrypted connection. Your database and every uploaded file are also encrypted while stored, on enterprise cloud infrastructure. So whether your data is moving or sitting still, it's scrambled to anyone who isn't supposed to see it.

## 3. Only the people you authorize can get in

Access is locked behind a real login system — you decide exactly who on your team gets an account. On top of that, the database enforces its own access rules at the data layer (a security model called Row-Level Security). The practical upshot: even if there were a flaw in the app itself, the database still won't hand out information the rules forbid. Your security doesn't rely on one locked door — there are two, and the inner one lives in the data itself.

## 4. The powerful keys never touch anyone's browser

Systems like this run on "keys" — credentials that grant access. The powerful ones (database admin, the AI key) live **server-side only**, in protected settings that are never sent to anyone's computer. The browser only ever receives a restricted, public-safe key that's further fenced in by those database access rules. Nothing sensitive is shipped to a user's machine or buried in the website's code where someone could dig it out.

## 5. Sensitive documents are minimized, not hoarded

Uploaded files go straight into private storage — never a public link someone could stumble onto. And intake documents are **deleted right after the information is pulled from them**. You don't end up sitting on an ever-growing pile of sensitive PDFs. The logic is simple: the less data kept on hand, the less there is to ever be exposed.

## 6. The AI does not train on your data

This is the question I get asked most — especially in immigration and family law — so it's worth being precise. The setup uses Anthropic's **commercial API**, which does **not** use customer data to train its models. Your requests run under your own dedicated key. A document is sent to the AI only to handle that one task — then it's done. It isn't absorbed into the model or used to make it "smarter" for anyone else.

This distinction — a consumer chatbot account versus enterprise API terms — is exactly where the law is drawing the line. I've broken down the [2026 federal case law on AI and attorney confidentiality](https://builtsmartbyrob.com/ai-confidentiality.html) on its own page if you want the citations.

*(For an especially sensitive matter, there's even an upgrade path: Anthropic offers Zero Data Retention agreements. Good to know it exists if you ever need to go a step further.)*

## 7. The infrastructure is enterprise-grade and independently audited

None of this runs on a homemade server in someone's closet. The building blocks — Netlify, Supabase, and Anthropic — all maintain **SOC 2 compliance**. That means an independent auditor has examined and verified their security controls, not just taken their word for it. Your setup stands on infrastructure already held to a standard you could hand to an auditor. (The full breakdown of how it all fits together lives on my [Security &amp; Privacy page](https://builtsmartbyrob.com/security-privacy.html).)

---

## Why I build it this way

Notice the thread running through all seven: this isn't "AI, with security bolted on afterward." It's an environment **designed around confidentiality from the start**, then tailored to how your firm actually works. That's the whole premise of what I build — practical automation and AI that earn their place in a practice precisely *because* they respect the duty of confidentiality instead of threatening it.

If your clients' information deserves that level of care — and in immigration and family law, it does — that's exactly the kind of setup worth having. [Reach out](https://builtsmartbyrob.com/#contact) and let's talk about what it would look like for your practice.

**Want the deeper version?** I've put the full detail on two pages: the [AI &amp; attorney confidentiality case-law analysis](https://builtsmartbyrob.com/ai-confidentiality.html) and the [Security &amp; Privacy breakdown](https://builtsmartbyrob.com/security-privacy.html).

---

*Rob is a web and automation consultant, not an attorney. Nothing here is legal advice, and confidentiality obligations vary by jurisdiction. For guidance on your professional responsibilities, consult your bar association or your own counsel.*
