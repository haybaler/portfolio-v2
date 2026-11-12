import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Linkedin, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { CONTACT_EMAIL, CONTACT_HREF, LINKEDIN_URL } from '@/lib/content';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      company: String(data.get('company') ?? '').trim() || null,
      message: String(data.get('message') ?? '').trim(),
    };

    setStatus('sending');
    setErrorMsg('');
    const { error } = await supabase.from('contact_messages').insert(payload);
    if (error) {
      setStatus('error');
      setErrorMsg('Something went wrong sending your message. Please try again, or email me directly.');
      return;
    }
    setStatus('sent');
    form.reset();
  }

  const field =
    'w-full border border-line-2 bg-ground px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none';

  return (
    <section className="wrap max-w-2xl py-14 md:py-20">
      <p className="label">Get in Touch</p>
      <h1 className="mt-2 max-w-[22ch] text-[clamp(2rem,5vw,3.25rem)] font-light leading-[1.15]">
        Have a Business Problem That Should Be a Working Product?
      </h1>
      <p className="lede mt-4 max-w-[48ch]">
        Tell me about it. I read every message and reply to the ones with a real problem in them.
      </p>

      {status === 'sent' ? (
        <div className="mt-10 border-l-2 border-positive bg-card p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-positive" />
            <div className="stack gap-1">
              <h2 className="text-base font-semibold">Message Sent</h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                Thank you. Your message is saved and I will reply to the email you gave me. If it
                is urgent, you can also reach me directly.
              </p>
              <a href={CONTACT_HREF} className="btn mt-3 !min-h-9 w-fit !py-1.5 text-sm">
                Email Me Directly
              </a>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="stack gap-2">
              <span className="label">Name</span>
              <input name="name" required maxLength={120} className={field} placeholder="Your name" />
            </label>
            <label className="stack gap-2">
              <span className="label">Email</span>
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                className={field}
                placeholder="you@company.com"
              />
            </label>
          </div>
          <label className="stack gap-2">
            <span className="label">Company (Optional)</span>
            <input name="company" maxLength={160} className={field} placeholder="Company name" />
          </label>
          <label className="stack gap-2">
            <span className="label">Message</span>
            <textarea
              name="message"
              required
              rows={6}
              maxLength={5000}
              className={`${field} resize-y`}
              placeholder="The problem you are trying to solve, and what getting it fixed would be worth."
            />
          </label>

          {status === 'error' && (
            <p role="alert" className="border-l-2 border-negative bg-card px-4 py-3 text-sm text-ink">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary w-fit disabled:opacity-60">
              <Send size={15} />
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            <span className="text-xs text-ink-faint">Or write directly:</span>
            <a href={CONTACT_HREF} className="font-mono text-xs text-ink hover:text-signal-text">
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-signal-text"
            >
              <Linkedin size={13} />
              LinkedIn
              <ArrowUpRight size={11} />
            </a>
          </div>
        </form>
      )}
    </section>
  );
}
