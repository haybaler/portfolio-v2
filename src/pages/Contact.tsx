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
    'w-full border border-line-control bg-ground px-4 py-3 text-sm text-text placeholder:text-text-3 focus:border-action focus:outline-none';

  return (
    <section className="wrap max-w-2xl py-16 md:py-24">
      <p className="eyebrow">Get in Touch</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.1]">
        Have a Business Problem That Should Be a Working Product?
      </h1>
      <p className="mt-5 text-base leading-relaxed text-text-2">
        Tell me about it. I read every message and reply to the ones with a real problem in them.
      </p>

      {status === 'sent' ? (
        <div className="mt-10 border-l-2 border-ok bg-card p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ok" />
            <div>
              <h2 className="text-base font-semibold">Message Sent</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-2">
                Thank you. Your message is saved and I will reply to the email you gave me. If it
                is urgent, you can also reach me directly.
              </p>
              <a href={CONTACT_HREF} className="btn-secondary mt-4 !py-2 text-xs">
                Email Me Directly
              </a>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-2">
                Name
              </span>
              <input name="name" required maxLength={120} className={field} placeholder="Your name" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-2">
                Email
              </span>
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
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-2">
              Company <span className="normal-case text-text-3">(Optional)</span>
            </span>
            <input name="company" maxLength={160} className={field} placeholder="Company name" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-2">
              Message
            </span>
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
            <p role="alert" className="border-l-2 border-error bg-card px-4 py-3 text-sm text-text">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-60">
              <Send size={15} />
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            <span className="text-xs text-text-3">Or write directly:</span>
            <a href={CONTACT_HREF} className="text-xs font-medium text-action hover:underline">
              {CONTACT_EMAIL}
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-text-2 transition-colors hover:text-action"
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
