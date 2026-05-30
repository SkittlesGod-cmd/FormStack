# OAuth & Email Setup Guide

This guide walks you through setting up OAuth providers and customizing email templates in Supabase.

---

## OAuth Providers (Google & GitHub)

### Step 1: Enable OAuth in Supabase

1. Go to **Supabase Dashboard → Authentication → Providers**
2. Find **Google** or **GitHub** in the list
3. Toggle **Enable** to expand configuration options

---

### Google OAuth Setup

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services → Credentials**

#### 2. Create OAuth Credentials

1. Click **Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `FormLayer Supabase`
4. **Authorized redirect URIs**: Add:
   ```
   https://vcrntibadyvshzzglcfn.supabase.co/auth/v1/callback
   ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

#### 3. Add to Supabase

1. In Supabase Authentication → Providers → Google
2. Paste the **Client ID** and **Client Secret**
3. Click **Save**

---

### GitHub OAuth Setup

#### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `FormLayer`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: 
     ```
     https://vcrntibadyvshzzglcfn.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a **Client Secret**

#### 2. Add to Supabase

1. In Supabase Authentication → Providers → GitHub
2. Paste the **Client ID** and **Client Secret**
3. Click **Save**

---

### Add Buttons to Sign-In Page

Once OAuth is configured, you can add social login buttons. Add this to your sign-in page:

```tsx
// Add Google sign-in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});

// Add GitHub sign-in
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});
```

---

## Email Templates

### Customize Email Templates

1. Go to **Supabase Dashboard → Authentication → Email Templates**
2. You'll see templates for:
   - **Confirm signup** - New user verification
   - **Reset password** - Password reset link
   - **Magic link** - Passwordless login

### Template Variables

Use these placeholders in your templates:

| Variable | Description |
|----------|-------------|
| `{{ .Token }}` | Confirmation/reset token |
| `{{ .Email }}` | User's email address |
| `{{ .TokenURL }}` | Full URL with token |
| `{{ .SiteURL }}` | Your site URL |
| `{{ .RedirectURL }}` | Redirect after action |

### Example: Custom Password Reset Email

```html
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password. This link expires in 1 hour.</p>
<a href="{{ .TokenURL }}" style="display: inline-block; background: #7F77DD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
  Reset Password
</a>
<p>If you didn't request this, you can safely ignore this email.</p>
```

---

## Configure Redirect URLs

### Add Allowed Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add your sites:

```
http://localhost:3000
http://localhost:3000/dashboard
http://localhost:3000/auth/callback
https://formlayer.co
https://formlayer.co/dashboard
https://formlayer.co/auth/callback
```

3. Click **Save**

---

## Testing

1. Open incognito/private browser
2. Go to `/sign-in`
3. Test each OAuth provider
4. Test magic link flow
5. Test password reset

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth redirect fails | Check URL configuration, ensure exact match |
| Email not received | Check spam folder, verify email template configured |
| Token expired | Request new email, links expire after 1 hour |
| CORS errors | Add exact origin to allowed origins in settings |

---

## Next Steps

After OAuth is set up:
1. Add social login buttons to sign-in page
2. Update middleware to handle OAuth redirects
3. Test full signup/login flow with each provider