import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { processEmail } from '../../api/email';
import type { EmailResponse } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Circle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import './ProcessEmail.css';

const schema = z.object({
  sender_email: z.string().email('Enter a valid email'),
  email_id: z.string().optional(),
  email_content: z.string().min(10, 'Email content must be at least 10 characters'),
});
type FormValues = z.infer<typeof schema>;

const STEPS = [
  'Read Email',
  'Classify Intent',
  'Search Knowledge Base',
  'Draft Response',
  'Human Review Check',
];

const intentColors: Record<string, string> = {
  bug: 'badge-bug', question: 'badge-question', billing: 'badge-billing',
  feature: 'badge-feature', complex: 'badge-complex',
};
const urgencyColors: Record<string, string> = {
  critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low',
};

export default function ProcessEmail() {
  const [result, setResult] = useState<EmailResponse | null>(null);
  const [activeStep, setActiveStep] = useState<number>(-1);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      setActiveStep(0);
      // Simulate progressive steps visually while the real API call runs
      const timer = setInterval(() => {
        setActiveStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 600);
      try {
        const res = await processEmail(data);
        clearInterval(timer);
        setActiveStep(4);
        return res;
      } catch (e) {
        clearInterval(timer);
        setActiveStep(-1);
        throw e;
      }
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.requires_human_review) {
        toast('Email flagged for human review', { icon: '👁️' });
      } else {
        toast.success('Reply drafted and sent!');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to process email');
    },
  });

  const onSubmit = (data: FormValues) => {
    setResult(null);
    setActiveStep(-1);
    mutation.mutate(data);
  };

  const handleReset = () => {
    reset();
    setResult(null);
    setActiveStep(-1);
    mutation.reset();
  };

  return (
    <div className="process-email-layout">
      {/* Form + Result Column */}
      <div className="process-email-main">
        <div className="page-header">
          <h1 className="page-title">Process Email</h1>
          <p className="page-subtitle">Submit a customer email to the AI agent for classification and response drafting.</p>
        </div>

        <div className="card">
          <div className="card-header"><Send size={16} /> Submit Email for AI Processing</div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="stack">
              <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Sender Email *</label>
                  <input {...register('sender_email')} className="form-input" placeholder="customer@example.com" />
                  {errors.sender_email && <span className="form-error">{errors.sender_email.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email ID <span style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span></label>
                  <input {...register('email_id')} className="form-input" placeholder="Auto-generated if empty" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Content *</label>
                <textarea {...register('email_content')} className="form-input" placeholder="Paste the customer email here..." rows={7} />
                {errors.email_content && <span className="form-error">{errors.email_content.message}</span>}
              </div>

              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? <><Loader2 size={15} className="spin-icon" /> Processing…</> : <><Send size={15} /> Process with AI</>}
                </button>
                {result && <button type="button" className="btn btn-outline" onClick={handleReset}>Clear</button>}
              </div>
            </form>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ borderLeft: '3px solid var(--color-accent)' }}
            >
              <div className="card-header">AI Result</div>
              <div className="card-body stack">
                {/* Classification */}
                {result.classification && (
                  <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <span className={`badge ${intentColors[result.classification.intent] ?? 'badge-neutral'}`}>
                      Intent: {result.classification.intent}
                    </span>
                    <span className={`badge ${urgencyColors[result.classification.urgency] ?? 'badge-neutral'}`}>
                      Urgency: {result.classification.urgency}
                    </span>
                    <span className="badge badge-neutral">Topic: {result.classification.topic}</span>
                  </div>
                )}

                {/* Draft */}
                {result.draft_response && (
                  <div>
                    <div className="section-label">AI Draft Response</div>
                    <div className="draft-response">{result.draft_response}</div>
                  </div>
                )}

                {/* Thread ID */}
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Thread: <code>{result.thread_id}</code>
                </div>

                {/* Review Flag */}
                {result.requires_human_review && (
                  <div className="info-strip info-strip-warning">
                    <AlertTriangle size={15} />
                    This email has been flagged for human review — check the Human Review queue.
                  </div>
                )}
                {!result.requires_human_review && result.draft_response && (
                  <div className="info-strip info-strip-success">
                    <CheckCircle size={15} />
                    Reply drafted and sent automatically.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stepper Sidebar */}
      <div className="process-email-stepper">
        <div className="card">
          <div className="card-header">Processing Steps</div>
          <div className="card-body">
            <div className="stepper">
              {STEPS.map((step, i) => {
                const done = activeStep > i;
                const current = activeStep === i;
                return (
                  <div key={step} className="stepper-item">
                    <div className="stepper-connector-wrap">
                      <div className={`stepper-circle ${done ? 'done' : current ? 'current' : 'pending'}`}>
                        {done ? <CheckCircle size={14} /> : current ? <Loader2 size={14} className="spin-icon" /> : <Circle size={14} />}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`stepper-line ${done ? 'done' : ''}`} />
                      )}
                    </div>
                    <div className={`stepper-label ${done ? 'done' : current ? 'current' : 'pending'}`}>
                      <span className="stepper-num">{i + 1}</span>
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
