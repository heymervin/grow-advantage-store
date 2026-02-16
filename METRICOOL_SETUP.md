# Metricool Integration Setup Guide

This guide will help you set up the Control Dashboard to pull Instagram analytics from Metricool API.

## 📋 Prerequisites

1. **Metricool Subscription** (Required)
   - Subscribe to [Metricool Advanced Plan](https://metricool.com/pricing/) ($39/month) or higher
   - API access is NOT available on Free or Starter plans
   - Advanced plan includes unlimited API calls

2. **Client Instagram Accounts**
   - Clients must have Instagram Business or Creator accounts
   - Clients connect their Instagram to Metricool (they do this themselves)

## 🚀 Setup Steps

### Step 1: Subscribe to Metricool

1. Go to [Metricool.com](https://metricool.com)
2. Sign up for an account
3. Upgrade to **Advanced Plan** ($39/month billed annually, or $49/month billed monthly)
4. Confirm API access is enabled in your plan

### Step 2: Get API Credentials

1. Log into your Metricool account
2. Go to **Settings** (gear icon in top right)
3. Click on **API** section in the left sidebar
4. Copy your:
   - **API Token** (long alphanumeric string)
   - **User ID** (numeric ID)

### Step 3: Configure Environment Variables

1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your credentials:
   ```env
   VITE_METRICOOL_API_TOKEN=your_actual_api_token_here
   VITE_METRICOOL_USER_ID=your_actual_user_id_here
   ```

3. Save the file (it's already in `.gitignore`, so it won't be committed)

### Step 4: Connect Client Instagram Accounts

For each client (e.g., Imogen):

1. **In Metricool**: Click "Add Brand" (or "Add Account")
2. **Client connects their Instagram**:
   - Client logs into Metricool (you can give them limited access)
   - Client clicks "Connect Instagram"
   - Client authorizes Metricool to access their Instagram Business/Creator account
3. **Get the Blog ID**:
   - After connecting, go to the brand/account settings
   - Find the **Blog ID** (also called Brand ID or Account ID)
   - This is a numeric ID like `12345678`

### Step 5: Configure Client in Dashboard

1. Open `src/pages/ControlDashboard.tsx`
2. Find the `clientConfigs` object
3. Add the client's `blogId`:

```typescript
const clientConfigs: Record<string, {
  name: string;
  blogId: string;
  username: string;
}> = {
  imogen: {
    name: "Inside Out Style",
    blogId: "12345678", // 👈 Add the Blog ID from Metricool here
    username: "@insideoutstyle",
  },
  // Add more clients here
  newclient: {
    name: "Client Name",
    blogId: "87654321",
    username: "@clienthandle",
  },
};
```

### Step 6: Test the Integration

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:8080/control-dashboard?client=imogen
   ```

3. You should see Instagram metrics loading from Metricool

## 🔧 Metricool API Reference

### Base URL
```
https://app.metricool.com/api
```

### Authentication
All requests require an `Authorization` header:
```
Authorization: Bearer YOUR_API_TOKEN
```

### Example API Call
```javascript
fetch('https://app.metricool.com/api/instagram/metrics?userId=YOUR_USER_ID&blogId=CLIENT_BLOG_ID&startDate=2024-02-01&endDate=2024-02-12', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  }
})
```

### Available Metrics
- `followers` - Total follower count
- `following` - Accounts followed
- `posts` - Total number of posts
- `reach` - Unique accounts reached
- `impressions` - Total views
- `profile_visits` - Profile page views
- `accounts_reached` - Unique accounts that saw content

## 📊 Dashboard Features

### Time Period Selector
The dashboard includes a segmented control to switch between:
- **Last 7 Days** (7D on mobile)
- **Last 30 Days** (30D on mobile)
- **This Month** (MTD on mobile)

The UI/UX design follows [Nielsen Norman Group best practices](https://www.nngroup.com) for analytics dashboards.

### Metrics Displayed

**Overview Cards:**
1. Followers
2. Accounts Reached
3. Impressions
4. Reach
5. Profile Visits
6. Following
7. Total Posts

**Engagement Overview:**
1. Reach Rate (%)
2. Average Impressions per Post
3. Profile Visits Rate (%)

## 🏢 For Agencies: Multi-Client Setup

### Client Workflow

1. **Onboarding a New Client:**
   ```
   1. Agency adds client as "Brand" in Metricool
   2. Send client login link to Metricool (limited access to their brand only)
   3. Client connects their Instagram via Metricool UI
   4. Agency gets the blogId from Metricool
   5. Agency adds blogId to clientConfigs in code
   6. Client can view their dashboard at: /control-dashboard?client=clientname
   ```

2. **Client Isolation:**
   - Each client only sees their own brand in Metricool
   - Metricool handles all OAuth with Instagram (secure)
   - Your dashboard pulls data via API (no client passwords needed)

3. **Scaling:**
   - Advanced Plan: Unlimited brands/clients
   - Custom Plan: White-label option available
   - One API token works for all clients (different blogIds)

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use environment variables** - Never hardcode API tokens
3. **Client data isolation** - Each client has separate blogId
4. **API token rotation** - Regenerate tokens periodically in Metricool settings

## 🐛 Troubleshooting

### Error: "API credentials not configured"
- Check that `.env` file exists
- Verify `VITE_METRICOOL_API_TOKEN` and `VITE_METRICOOL_USER_ID` are set
- Restart dev server after adding env vars

### Error: "Client Metricool blogId not configured"
- Add the client's `blogId` to `clientConfigs` in `ControlDashboard.tsx`
- Get blogId from Metricool Settings > Brands

### Error: "Metricool API error: 401"
- Invalid API token
- Regenerate token in Metricool Settings > API
- Update `.env` file with new token

### Error: "Metricool API error: 403"
- API access not available on your plan
- Upgrade to Advanced plan ($39/mo) or higher

### No data showing
- Ensure client's Instagram is connected in Metricool
- Check that blogId is correct
- Verify date range (recent data may take time to process)
- Check Metricool dashboard directly to confirm data is available

## 💰 Cost Breakdown

**For Agency with 10 Clients:**
- Metricool Advanced: $39/month (covers all clients)
- Hosting: ~$20/month (Vercel/Netlify)
- **Total: ~$59/month**

**vs. Alternatives:**
- AgencyAnalytics: ~$300-500/month for 10-20 clients
- Supermetrics: ~$200+/month
- Custom Meta API: $0/month (but requires more dev time)

## 📚 Additional Resources

- [Metricool API Documentation](https://help.metricool.com/en/article/basic-guide-for-api-integration-abukgf/)
- [Metricool API PDF](https://static.metricool.com/API+DOC/API+English.pdf)
- [Instagram Metrics Guide](https://help.metricool.com/en/article/instagram-metrics-12vpkyb/)
- [Metricool Pricing](https://metricool.com/pricing/)

## 🎯 Next Steps

1. [ ] Subscribe to Metricool Advanced plan
2. [ ] Get API credentials from Metricool settings
3. [ ] Configure `.env` file
4. [ ] Connect client Instagram accounts
5. [ ] Get blogIds for each client
6. [ ] Update `clientConfigs` with blogIds
7. [ ] Test dashboard with real data
8. [ ] Deploy to production

## 🤝 Support

If you need help:
1. Check Metricool help docs: https://help.metricool.com
2. Contact Metricool support (available on Advanced plan)
3. Review this guide for common issues
