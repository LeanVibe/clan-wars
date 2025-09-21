# GitHub Secrets Configuration

This document outlines all the required secrets and environment variables for the Ninja Clan Wars CI/CD pipeline.

## 🔐 Required Secrets

### Deployment Secrets

#### Vercel Deployment
```
VERCEL_TOKEN
- Description: Vercel authentication token for deployments
- Required for: Production and preview deployments
- How to get: Vercel Dashboard > Settings > Tokens
- Scope: Account-level token with deployment permissions
```

```
VERCEL_ORG_ID
- Description: Vercel organization ID
- Required for: All Vercel deployments
- How to get: Vercel Dashboard > Settings > General
- Example: team_abc123def456
```

```
VERCEL_PROJECT_ID
- Description: Vercel project ID for the application
- Required for: All Vercel deployments
- How to get: Project Settings > General in Vercel
- Example: prj_abc123def456ghi789
```

#### Netlify Deployment (Backup)
```
NETLIFY_AUTH_TOKEN
- Description: Netlify authentication token
- Required for: Netlify preview deployments
- How to get: Netlify Dashboard > User Settings > Applications
- Scope: Full access to deploy sites
```

```
NETLIFY_SITE_ID
- Description: Netlify site ID for the project
- Required for: Netlify deployments
- How to get: Site Settings > General > Site ID
- Example: abc123def-456g-789h-012i-345jklmnopqr
```

### Monitoring & Analytics

#### Code Coverage
```
CODECOV_TOKEN
- Description: Codecov token for uploading coverage reports
- Required for: CI pipeline coverage reporting
- How to get: Codecov.io > Repository Settings > Repository Upload Token
- Optional: Can be skipped if not using Codecov
```

#### Lighthouse CI
```
LHCI_GITHUB_APP_TOKEN
- Description: Lighthouse CI GitHub App token
- Required for: Performance testing in CI
- How to get: Install Lighthouse CI GitHub App
- Optional: Can be skipped for basic performance checks
```

#### Security Scanning
```
SEMGREP_APP_TOKEN
- Description: Semgrep token for security scanning
- Required for: SAST security scanning
- How to get: Semgrep.dev > Settings > Tokens
- Optional: Can be skipped for basic security
```

### Notifications

#### Slack Integration
```
SLACK_WEBHOOK_URL
- Description: Slack webhook URL for deployment notifications
- Required for: Team notifications (optional)
- How to get: Slack App > Incoming Webhooks
- Format: https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/your-webhook-token-here
```

## 🏗️ Environment Variables

### Application Configuration

#### Production Environment
```
VITE_APP_VERSION
- Description: Application version number
- Set by: CI/CD pipeline automatically
- Example: v1.2.3
```

```
VITE_APP_ENVIRONMENT
- Description: Current environment name
- Set by: CI/CD pipeline automatically
- Values: production | preview | development
```

```
VITE_APP_BUILD_TIME
- Description: Build timestamp
- Set by: CI/CD pipeline automatically
- Format: ISO 8601 (2023-12-01T10:30:00Z)
```

```
VITE_APP_COMMIT_SHA
- Description: Git commit SHA
- Set by: CI/CD pipeline automatically
- Example: abc123def456
```

#### Preview Environment
```
VITE_APP_PR_NUMBER
- Description: Pull request number for preview builds
- Set by: Preview deployment workflow
- Example: 42
```

## 📋 Setup Checklist

### Initial Setup
- [ ] Create Vercel account and project
- [ ] Generate Vercel deployment token
- [ ] Get Vercel organization and project IDs
- [ ] Create Netlify account (optional backup)
- [ ] Set up Codecov integration (optional)
- [ ] Configure Slack webhook (optional)

### GitHub Repository Secrets
Navigate to: `Repository Settings > Secrets and variables > Actions`

#### Production Secrets (Required)
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

#### Optional Secrets
- [ ] `NETLIFY_AUTH_TOKEN`
- [ ] `NETLIFY_SITE_ID`
- [ ] `CODECOV_TOKEN`
- [ ] `LHCI_GITHUB_APP_TOKEN`
- [ ] `SEMGREP_APP_TOKEN`
- [ ] `SLACK_WEBHOOK_URL`

### Environment Variables
Environment variables are automatically set by the CI/CD pipeline and don't need manual configuration.

## 🔒 Security Best Practices

### Secret Management
1. **Rotation**: Rotate tokens every 90 days
2. **Scope**: Use minimum required permissions
3. **Monitoring**: Monitor secret usage in audit logs
4. **Access**: Limit access to secrets to essential team members

### Token Permissions

#### Vercel Token Scopes
- Deploy to projects
- Read project settings
- Access deployment logs

#### Netlify Token Scopes
- Deploy sites
- Access site settings
- Read deployment status

#### GitHub Token (Automatic)
- Contents: read
- Actions: read
- Pull requests: write (for comments)
- Deployments: write

## 🚨 Troubleshooting

### Common Issues

#### "Vercel deployment failed"
1. Check `VERCEL_TOKEN` is valid and not expired
2. Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
3. Ensure token has deployment permissions

#### "Netlify deployment failed"
1. Verify `NETLIFY_AUTH_TOKEN` is valid
2. Check `NETLIFY_SITE_ID` matches your site
3. Confirm token has deploy permissions

#### "Codecov upload failed"
1. Check `CODECOV_TOKEN` is set correctly
2. Verify repository is configured in Codecov
3. Check coverage file is generated correctly

### Secret Validation

You can test secrets by running the workflows with manual triggers:

```bash
# Test deployment workflow
gh workflow run deploy.yml --ref main

# Test preview workflow (requires PR)
gh workflow run preview.yml

# Test release workflow
gh workflow run release.yml -f version=v1.0.0-test
```

## 📞 Support

### Getting Help
1. Check workflow logs in GitHub Actions
2. Verify all required secrets are set
3. Test individual deployment steps manually
4. Contact DevOps team for token renewal

### Emergency Contacts
- **Platform Issues**: Contact hosting provider support
- **Token Expiry**: DevOps team lead
- **Security Concerns**: Security team

## 📝 Maintenance

### Regular Tasks
- [ ] Review and rotate tokens quarterly
- [ ] Update documentation when adding new secrets
- [ ] Monitor secret usage and access logs
- [ ] Test backup deployment methods monthly

### When Adding New Secrets
1. Document the secret in this file
2. Add to setup checklist
3. Update troubleshooting guide
4. Test in non-production environment first
5. Notify team of new requirements