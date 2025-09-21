# CI/CD Troubleshooting Guide

This guide provides comprehensive troubleshooting steps for the Ninja Clan Wars CI/CD pipeline.

## 🚨 Common Issues & Solutions

### Build Failures

#### Issue: "Bun install failed"
**Symptoms**: 
- `bun install --frozen-lockfile` fails in CI
- Dependency resolution errors
- Lock file out of sync

**Solutions**:
```bash
# 1. Update lock file locally
rm bun.lockb
bun install

# 2. Commit updated lock file
git add bun.lockb
git commit -m "fix: update bun lockfile"

# 3. Clear CI cache (re-run workflow)
gh workflow run ci.yml --ref main
```

**Prevention**:
- Always commit `bun.lockb` changes
- Use `bun install --frozen-lockfile` in CI
- Regular dependency updates

#### Issue: "Build compilation errors"
**Symptoms**:
- `bun run build` fails
- JavaScript/TypeScript errors
- Missing dependencies

**Diagnosis**:
```bash
# Test build locally
bun run build

# Check for type errors
bun x tsc --noEmit

# Verify all imports
bun run lint
```

**Solutions**:
1. **Fix import paths**: Ensure all imports are correct
2. **Type issues**: Add proper type annotations
3. **Missing files**: Verify all referenced files exist
4. **Environment variables**: Check required env vars are set

#### Issue: "Vite build out of memory"
**Symptoms**:
- Build process killed
- "JavaScript heap out of memory"
- Build hangs indefinitely

**Solutions**:
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" bun run build

# Optimize build configuration
# In vite.config.js:
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'game-core': ['@clan-wars/game-core'],
          'vendor': ['lit', 'three']
        }
      }
    }
  }
})
```

### Test Failures

#### Issue: "Unit tests timeout"
**Symptoms**:
- Tests hang without completing
- Vitest runner never finishes
- Memory leaks in test environment

**Solutions**:
```bash
# 1. Run tests with timeout
bun run test -- --testTimeout 10000

# 2. Check for async issues
# Look for unresolved promises in tests

# 3. Clean up test resources
// In test files:
afterEach(() => {
  // Clean up DOM, timers, etc.
  cleanup();
});
```

#### Issue: "E2E tests fail in CI but pass locally"
**Symptoms**:
- Playwright tests fail only in GitHub Actions
- Browser-specific issues
- Timing/race conditions

**Diagnosis**:
```bash
# Run E2E tests with debug info
bun x playwright test --debug

# Check browser compatibility
bun x playwright test --browser=chromium --browser=firefox

# Test with CI-like conditions
bun x playwright test --headed=false
```

**Solutions**:
```javascript
// Increase timeouts for CI
// In playwright.config.js:
export default defineConfig({
  use: {
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  expect: {
    timeout: 10000
  }
});

// Add explicit waits
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="game-board"]');
```

### Deployment Failures

#### Issue: "Vercel deployment failed"
**Symptoms**:
- Deployment status shows failed
- "Build failed" or "Function timeout"
- Invalid configuration errors

**Diagnosis**:
```bash
# Check Vercel logs
vercel logs

# Validate configuration
vercel dev

# Test build locally
bun run build
```

**Solutions**:
1. **Token Issues**:
   ```bash
   # Update Vercel token
   gh secret set VERCEL_TOKEN --body "new-token"
   
   # Verify token permissions
   vercel whoami
   ```

2. **Configuration Issues**:
   ```json
   // Verify vercel.json
   {
     "buildCommand": "cd apps/pwa && bun run build",
     "outputDirectory": "apps/pwa/dist",
     "installCommand": "bun install"
   }
   ```

3. **Build Timeout**:
   ```json
   // In vercel.json
   {
     "functions": {
       "app/api/*.js": {
         "maxDuration": 30
       }
     }
   }
   ```

#### Issue: "Netlify deployment failed"
**Symptoms**:
- Netlify build fails
- "Build script returned non-zero exit code"
- Site not found errors

**Solutions**:
```bash
# 1. Check build settings
# In netlify.toml:
[build]
  base = "apps/pwa"
  command = "bun run build"
  publish = "dist"

# 2. Verify site ID
gh secret set NETLIFY_SITE_ID --body "correct-site-id"

# 3. Test build locally
netlify dev
```

### Performance Issues

#### Issue: "Lighthouse CI fails"
**Symptoms**:
- Performance scores below threshold
- Budget exceeded warnings
- Core Web Vitals failures

**Diagnosis**:
```bash
# Run Lighthouse locally
bun x lighthouse http://localhost:5173 \
  --output html \
  --chrome-flags="--headless"

# Check bundle size
bun run build
du -sh apps/pwa/dist/*
```

**Solutions**:
1. **Bundle Size Optimization**:
   ```javascript
   // Code splitting
   const GameComponent = lazy(() => import('./GameComponent'));
   
   // Tree shaking
   import { specificFunction } from 'library/specific';
   ```

2. **Performance Budgets**:
   ```json
   // Adjust thresholds in performance-budget.json
   {
     "budgets": [{
       "path": "/*",
       "timings": [{
         "metric": "first-contentful-paint",
         "budget": 2500  // Increased from 2000
       }]
     }]
   }
   ```

3. **Image Optimization**:
   ```javascript
   // Use WebP format
   // Lazy load images
   // Compress images
   ```

#### Issue: "Load tests failing"
**Symptoms**:
- High response times
- Error rates above threshold
- Server timeouts

**Solutions**:
```bash
# 1. Check server capacity
# Monitor Vercel/Netlify metrics

# 2. Optimize critical rendering path
# Reduce JavaScript execution time
# Minimize render-blocking resources

# 3. Implement caching
# Add proper cache headers
# Use service worker for asset caching
```

### Security Scan Failures

#### Issue: "Semgrep security violations"
**Symptoms**:
- SAST scan finds security issues
- Vulnerable code patterns detected
- Dependency vulnerabilities

**Solutions**:
```bash
# 1. Run security scan locally
bun x semgrep --config=auto

# 2. Fix common issues
# Remove console.log statements
# Sanitize user inputs
# Update vulnerable dependencies

# 3. Exclude false positives
# Create .semgrepignore file
```

#### Issue: "Dependency audit failures"
**Symptoms**:
- `bun audit` shows vulnerabilities
- High/critical severity issues
- Outdated dependencies

**Solutions**:
```bash
# 1. Update dependencies
bun update

# 2. Audit and fix
bun audit --fix

# 3. Override if necessary (with caution)
# Add to package.json:
{
  "overrides": {
    "vulnerable-package": "^fixed-version"
  }
}
```

## 🔍 Debugging Workflows

### GitHub Actions Debugging

#### Enable Debug Logging
```bash
# Set repository secret
gh secret set ACTIONS_STEP_DEBUG --body "true"
gh secret set ACTIONS_RUNNER_DEBUG --body "true"
```

#### Debug Specific Steps
```yaml
- name: Debug Info
  run: |
    echo "Runner OS: $RUNNER_OS"
    echo "GitHub Event: $GITHUB_EVENT_NAME"
    echo "Ref: $GITHUB_REF"
    echo "SHA: $GITHUB_SHA"
    env
```

#### SSH into Runner (Emergency)
```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure()
```

### Local Simulation

#### Simulate CI Environment
```bash
# Use same Node/Bun versions
nvm use 20
bun --version  # Should match CI

# Use frozen lockfile
rm node_modules
bun install --frozen-lockfile

# Run full CI suite locally
bun run lint
bun run test
bun run test:e2e
bun run build
```

#### Test with Act (GitHub Actions locally)
```bash
# Install act
brew install act

# Run specific workflow
act -j build-validation

# Debug workflow
act -j build-validation --verbose
```

## 📊 Monitoring & Alerts

### Workflow Monitoring

#### Check Workflow Status
```bash
# List recent runs
gh run list --limit 20

# Check specific workflow
gh run list --workflow=ci.yml

# View run details
gh run view RUN_ID

# Download artifacts
gh run download RUN_ID --name build-artifacts
```

#### Set up Monitoring Alerts
```yaml
# In workflow files, add notification steps
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Performance Monitoring

#### Dashboard Setup
- **Vercel Analytics**: Monitor Core Web Vitals
- **GitHub Insights**: Track workflow success rates
- **Lighthouse CI**: Performance trend analysis

#### Custom Metrics
```javascript
// Add performance markers in app
performance.mark('game-init-start');
// ... game initialization
performance.mark('game-init-end');
performance.measure('game-init', 'game-init-start', 'game-init-end');
```

## 🛠️ Emergency Procedures

### Rollback Procedures

#### Quick Rollback (Vercel)
```bash
# Via Vercel CLI
vercel rollback

# Via GitHub Actions
gh workflow run deploy.yml \
  --ref previous-stable-commit \
  -f environment=production
```

#### Emergency Hotfix
```bash
# 1. Create hotfix branch from last stable
git checkout -b hotfix/emergency-fix last-stable-tag

# 2. Apply minimal fix
# ... make changes

# 3. Fast-track deployment
gh workflow run deploy.yml \
  --ref hotfix/emergency-fix \
  -f skip_tests=true  # Only in extreme emergencies
```

### Incident Response

#### Service Down
1. **Immediate**: Check hosting provider status
2. **Verify**: Test alternate deployment (Netlify)
3. **Communicate**: Update status page/team
4. **Investigate**: Review recent deployments
5. **Rollback**: If necessary, revert to last known good

#### Security Incident
1. **Stop**: Pause all deployments
2. **Assess**: Review security scan results
3. **Patch**: Apply security fixes
4. **Test**: Comprehensive security validation
5. **Deploy**: Coordinated security release

## 📚 Reference

### Log Locations
- **GitHub Actions**: Workflow run logs
- **Vercel**: Deployment function logs
- **Netlify**: Build and function logs
- **Lighthouse**: Performance reports in artifacts

### Useful Commands
```bash
# GitHub CLI commands
gh workflow list
gh run list --limit 10
gh run view --log
gh run rerun RUN_ID

# Vercel commands
vercel logs
vercel ls
vercel rollback

# Local debugging
bun run test -- --reporter=verbose
bun x playwright test --debug
bun x lighthouse http://localhost:5173
```

### Configuration Files
- `.github/workflows/*.yml` - Workflow definitions
- `vercel.json` - Vercel deployment config
- `netlify.toml` - Netlify deployment config
- `performance-budget.json` - Performance thresholds
- `.lighthouserc.js` - Lighthouse CI config

### Support Escalation
1. **Level 1**: Check this guide and workflow logs
2. **Level 2**: Contact DevOps team with workflow URLs
3. **Level 3**: Emergency escalation for production issues
4. **Level 4**: Security team for security incidents