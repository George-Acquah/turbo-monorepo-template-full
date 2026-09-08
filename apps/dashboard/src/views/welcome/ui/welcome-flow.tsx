'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button, Label } from '@workspace/client-ui-primitives';
import { Input } from '@workspace/client-ui-forms';
import { StepProgress } from '@/widgets/onboarding';
import { completeOnboarding } from '@/features/complete-onboarding';
import { saveOnboardingProfile } from '@/features/save-onboarding-profile';
import { DeskIllustration, QuestionsIllustration } from './illustrations';

const EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'Brand new' },
  { value: 'learning', label: 'Still learning the basics' },
  { value: 'breakeven', label: 'Comfortable, not expert' },
  { value: 'profitable', label: 'Experienced' },
] as const;

export interface WelcomeContext {
  firstName: string;
  experience: string | null;
  goal: string | null;
}

const TOTAL_STEPS = 2;

export function WelcomeFlow({ ctx }: { ctx: WelcomeContext }) {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState(ctx.experience ?? '');
  const [goal, setGoal] = useState(ctx.goal ?? '');
  const [finishing, startFinish] = useTransition();
  const [savingProfile, startSaveProfile] = useTransition();

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const finish = () => startFinish(() => completeOnboarding());

  const saveProfileThenFinish = () =>
    startSaveProfile(async () => {
      await saveOnboardingProfile({ experience: experience as never, goal });
      finish();
    });

  return (
    <div className="glass-strong w-full max-w-lg rounded-2xl p-6 shadow-elevation-3 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <StepProgress current={step} total={TOTAL_STEPS} />
        <button
          type="button"
          onClick={finish}
          disabled={finishing}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Skip to dashboard
        </button>
      </div>

      {step === 1 && (
        <Step
          illustration={<DeskIllustration />}
          title={ctx.firstName ? `Welcome, ${ctx.firstName}.` : 'Welcome.'}
          body="This is your dashboard shell. One quick step and you're set — you can change everything later in Account."
        >
          <PrimaryRow>
            <Button onClick={next} size="sm">
              Get started
              <ArrowRight className="size-4" />
            </Button>
          </PrimaryRow>
        </Step>
      )}

      {step === 2 && (
        <Step
          illustration={<QuestionsIllustration />}
          title="A couple of quick questions"
          body="This helps tailor your experience. You can change these later in Account."
        >
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="experience">How would you describe yourself?</Label>
              <select
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-surface-2/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <option value="">Prefer not to say</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">What do you want to get out of this?</Label>
              <Input
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. ship faster"
                maxLength={200}
              />
            </div>
          </div>
          <PrimaryRow>
            <Button variant="ghost" size="sm" onClick={finish} disabled={savingProfile || finishing}>
              Skip
            </Button>
            <Button size="sm" onClick={saveProfileThenFinish} disabled={savingProfile || finishing}>
              {(savingProfile || finishing) && <Loader2 className="size-4 animate-spin" />}
              Finish
              <ArrowRight className="size-4" />
            </Button>
          </PrimaryRow>
        </Step>
      )}
    </div>
  );
}

function Step({
  illustration,
  title,
  body,
  children,
}: {
  illustration: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="py-2">{illustration}</div>
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  );
}

function PrimaryRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center gap-3 pt-2">{children}</div>;
}
