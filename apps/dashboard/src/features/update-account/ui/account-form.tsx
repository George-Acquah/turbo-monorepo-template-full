'use client';
import { useActionState } from 'react';
import { Button, Checkbox, Label } from '@workspace/client-ui-primitives';
import { Input, FieldError, PhoneField, COUNTRY_DIAL_CODES } from '@workspace/client-ui-forms';
import type { Account } from '@/entities/account';
import { updateAccount } from '../api/update-account';
import { initialAccountState } from '../model/state';

export function AccountForm({ account }: { account: Account }) {
  const [state, action, pending] = useActionState(updateAccount, initialAccountState);
  const errors = state.status === 'error' ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-5">
      {state.status === 'success' && (
        <p role="status" className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">Saved.</p>
      )}
      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" defaultValue={account.firstName} />
          <FieldError errors={errors} field="firstName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" defaultValue={account.lastName} />
          <FieldError errors={errors} field="lastName" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <PhoneField
            id="phone"
            name="phone"
            defaultValue={account.phone}
            defaultCountry={account.country}
            error={Boolean(errors?.phone)}
          />
          <FieldError errors={errors} field="phone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            name="country"
            defaultValue={account.country ?? 'GH'}
            className="h-10 w-full rounded-lg border border-input bg-surface-2/40 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors} field="country" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal">Your goal</Label>
        <Input id="goal" name="goal" defaultValue={account.goal ?? ''} placeholder="What do you want to achieve?" />
        <FieldError errors={errors} field="goal" />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface-2/40 px-4 py-3">
        <Label htmlFor="marketingOptIn" className="cursor-pointer">
          <span className="block text-sm font-medium text-foreground">Marketing email</span>
          <span className="block text-xs text-muted-foreground">Occasional updates about programmes and events.</span>
        </Label>
        <Checkbox id="marketingOptIn" name="marketingOptIn" defaultChecked={account.marketingOptIn} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </form>
  );
}
