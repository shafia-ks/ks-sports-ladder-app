# Production Deployment & Update Strategy

## 🚀 Initial Production Deployment

### **Step 1: Choose Your Hosting Platform**

**Recommended: Vercel** (Best for Next.js)
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for every PR
- ✅ Free tier available

**Alternative: Netlify, Railway, or AWS Amplify**

---

### **Step 2: Set Up Production Environment**

#### **A. Create Production Supabase Project**
1. Go to https://supabase.com/dashboard
2. Create a **new project** (separate from development)
3. Note down:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### **B. Run Database Migrations**
```bash
# Link to production project
npx supabase link --project-ref your-production-project-ref

# Push all migrations
npx supabase db push

# Verify migrations
npx supabase db diff
```

#### **C. Configure Environment Variables in Vercel**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add for **Production**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
   ```

---

### **Step 3: Deploy**

#### **Option A: Deploy via Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects Next.js
4. Click "Deploy"

#### **Option B: Deploy via CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🔄 Maintaining Updates (Post-Production)

### **Strategy: Git-Based Deployment Workflow**

```
Development → Staging → Production
    ↓           ↓           ↓
   main      preview     production
```

---

### **Recommended Branch Strategy**

#### **Branch Structure:**
```
main (development)
  ↓
staging (pre-production testing)
  ↓
production (live users)
```

#### **Or Simpler:**
```
main (production - always stable)
  ↑
develop (active development)
  ↑
feature/* (feature branches)
```

---

## 📋 Update Workflow (Step-by-Step)

### **Scenario 1: Small Bug Fix or Feature**

#### **1. Develop Locally**
```bash
# Create feature branch
git checkout -b fix/button-overflow

# Make changes
# Test locally: npm run dev

# Commit
git add .
git commit -m "fix: prevent button overflow on mobile"
```

#### **2. Push and Create PR**
```bash
git push origin fix/button-overflow
```

- Go to GitHub → Create Pull Request
- Vercel automatically creates a **preview deployment**
- Test the preview URL (e.g., `your-app-git-fix-button-overflow.vercel.app`)

#### **3. Review and Merge**
- Review code
- Test preview deployment
- Merge PR to `main`

#### **4. Automatic Production Deployment**
- Vercel automatically deploys `main` to production
- Live in ~2 minutes ✅

---

### **Scenario 2: Database Schema Change**

#### **1. Create Migration Locally**
```bash
# Make schema changes in Supabase Studio (local)
# Or create migration file manually

# Generate migration
npx supabase db diff -f add_new_column

# Test locally
npx supabase db reset
npm run dev
```

#### **2. Commit Migration**
```bash
git add supabase/migrations/
git commit -m "feat: add user preferences table"
git push
```

#### **3. Deploy to Production**
```bash
# After code is deployed, run migration on production
npx supabase link --project-ref your-production-project-ref
npx supabase db push
```

**⚠️ Important:** Run migrations **before** deploying code that depends on them!

---

### **Scenario 3: Major Feature Release**

#### **1. Use Staging Environment**

**Set up staging:**
- Create a staging Supabase project
- Deploy to Vercel staging environment
- Add staging environment variables

**Workflow:**
```bash
# Develop on feature branch
git checkout -b feature/new-ranking-system

# Test locally
npm run dev

# Push to staging branch
git checkout staging
git merge feature/new-ranking-system
git push origin staging
```

- Vercel deploys staging branch to staging URL
- Test thoroughly on staging

#### **2. Deploy to Production**
```bash
# Merge to main
git checkout main
git merge staging
git push origin main
```

- Vercel auto-deploys to production

---

## 🛡️ Safety Best Practices

### **1. Always Test Before Production**
```bash
# Local testing
npm run dev
npm run build  # Test production build
npm run start  # Test production mode locally

# Type checking
npm run type-check

# Linting
npm run lint
```

### **2. Use Preview Deployments**
- Every PR gets a unique preview URL
- Test changes before merging
- Share with team/testers

### **3. Database Migration Safety**
```bash
# Always backup before migration
# In Supabase Dashboard: Database → Backups → Create Backup

# Test migration on staging first
npx supabase db push --db-url your-staging-url

# Then production
npx supabase db push --db-url your-production-url
```

### **4. Rollback Strategy**

**If deployment breaks:**

**Option A: Revert via Vercel**
- Vercel Dashboard → Deployments → Previous deployment → "Promote to Production"

**Option B: Revert via Git**
```bash
# Revert last commit
git revert HEAD
git push origin main
```

**Option C: Redeploy specific commit**
```bash
# Find working commit
git log

# Deploy specific commit via Vercel CLI
vercel --prod --force
```

---

## 📊 Monitoring & Maintenance

### **1. Set Up Monitoring**
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking (already configured in your app)
- **Supabase Dashboard** - Database performance, API usage

### **2. Regular Maintenance**
```bash
# Weekly: Update dependencies
npm outdated
npm update

# Monthly: Major version updates
npm install package@latest

# Always test after updates!
npm run build
```

### **3. Database Maintenance**
- Monitor Supabase usage (Database size, API requests)
- Review slow queries in Supabase Dashboard
- Set up database backups (automatic in Supabase)

---

## 🔄 Continuous Deployment (CD) Setup

### **Automatic Deployment Pipeline:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run type-check
      
      - name: Build
        run: npm run build
      
      # Vercel handles actual deployment automatically
```

---

## 📝 Update Checklist

Before every production deployment:

- [ ] Code reviewed and approved
- [ ] Tests passing locally
- [ ] Preview deployment tested
- [ ] Database migrations tested on staging
- [ ] Environment variables updated (if needed)
- [ ] Breaking changes documented
- [ ] Rollback plan ready
- [ ] Team notified of deployment

---

## 🚨 Emergency Hotfix Process

For critical bugs in production:

```bash
# 1. Create hotfix branch from production
git checkout main
git checkout -b hotfix/critical-bug

# 2. Fix and test
# Make minimal changes
npm run build
npm run start

# 3. Deploy immediately
git add .
git commit -m "hotfix: fix critical bug"
git push origin hotfix/critical-bug

# 4. Merge to main (Vercel auto-deploys)
# Create PR and merge immediately

# 5. Backport to develop
git checkout develop
git merge hotfix/critical-bug
```

---

## 📈 Recommended Update Schedule

### **Daily:**
- Monitor error logs (Sentry)
- Check Vercel deployment status

### **Weekly:**
- Review and merge small PRs
- Update dependencies (patch versions)
- Review analytics

### **Monthly:**
- Major dependency updates
- Database performance review
- Security audit
- Backup verification

### **Quarterly:**
- Major feature releases
- Database optimization
- Infrastructure review

---

## 🎯 Summary: Simple Update Workflow

**For most updates:**

1. **Develop locally** → Test → Commit
2. **Push to GitHub** → Creates preview deployment
3. **Test preview** → Looks good?
4. **Merge to main** → Auto-deploys to production ✅

**For database changes:**

1. Create migration locally
2. Test migration on staging
3. Deploy code to production
4. Run migration on production database

**That's it!** Vercel handles the rest automatically. 🚀

---

## 🔗 Useful Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Migrations:** https://supabase.com/docs/guides/cli/local-development
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## 💡 Pro Tips

1. **Use environment-specific configs** - Different Supabase projects for dev/staging/prod
2. **Never test on production** - Always use staging
3. **Keep main branch stable** - Only merge tested code
4. **Automate everything** - Let Vercel handle deployments
5. **Monitor actively** - Catch issues before users report them
