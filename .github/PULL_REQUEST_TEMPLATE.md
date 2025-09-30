# Pull Request

## Description

<!-- Provide a clear and concise description of the changes -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Code style/refactoring (no functional changes)
- [ ] 🧪 Test updates
- [ ] ⚙️ Configuration changes

## Changes Made

<!-- List the specific changes made in this PR -->

- 
- 
- 

## Related Issues

<!-- Link to related issues, e.g., "Fixes #123" or "Relates to #456" -->

Fixes #
Relates to #

## Testing

### Local Testing

- [ ] Tested with `npm run workers:dev`
- [ ] Ran `./test-parallel-reasoning-v2.sh` successfully
- [ ] All TypeScript types compile without errors
- [ ] No console errors or warnings

### Production Testing (if applicable)

- [ ] Deployed to production
- [ ] Verified all 7 MCP tools work
- [ ] Tested session persistence
- [ ] Verified ChatGPT integration

## Documentation

- [ ] Updated `PARALLEL_REASONING_GUIDE.md` (if functionality changed)
- [ ] Updated `CHATGPT_INTEGRATION.md` (if user-facing changes)
- [ ] Updated `REPOSITORY_STATUS.md` (if major changes)
- [ ] Updated `AGENT.md` (if agent instructions changed)
- [ ] Added JSDoc comments to new functions

## Checklist

### Code Quality

- [ ] Code follows TypeScript strict mode
- [ ] No `any` types (unless absolutely necessary)
- [ ] Descriptive variable and function names
- [ ] Functions are focused and under 50 lines
- [ ] Error handling implemented
- [ ] Input validation added where needed

### MCP Protocol

- [ ] Follows MCP 2024-11-05 specification
- [ ] Uses JSON-RPC 2.0 format correctly
- [ ] SSE streaming works (if applicable)
- [ ] Tool schemas are valid

### Session Management

- [ ] Uses `idFromString()` for Durable Objects (NOT `idFromName()`)
- [ ] State persists correctly in Durable Objects
- [ ] Session not found errors handled gracefully
- [ ] No data loss on session operations

### Business Domain

- [ ] Changes respect business consulting focus
- [ ] No software development personas added
- [ ] Use cases remain: market entry, M&A, strategy, etc.
- [ ] Agent personas are appropriate for business analysis

### Performance

- [ ] Minimized Durable Objects writes
- [ ] No heavy dependencies added
- [ ] Bundle size remains reasonable
- [ ] Optimized for Cloudflare Workers edge

## Screenshots/Logs (if applicable)

<!-- Add screenshots or logs demonstrating the changes -->

```
Paste relevant logs here
```

## Deployment Notes

<!-- Any special considerations for deployment? -->

- [ ] No special deployment steps required
- [ ] Requires environment variable changes
- [ ] Requires Durable Objects migration
- [ ] Other (explain below):

## Rollback Plan

<!-- How can this change be rolled back if needed? -->

## Additional Context

<!-- Add any other context about the PR here -->

---

## For Reviewers

### Focus Areas

<!-- What should reviewers pay special attention to? -->

- 
- 

### Questions

<!-- Any specific questions for reviewers? -->

- 
- 

---

**By submitting this PR, I confirm that:**

- [ ] I have read `AGENT.md` and followed the guidelines
- [ ] I have tested the changes locally
- [ ] I have updated relevant documentation
- [ ] The code is ready for production deployment
- [ ] I understand the business consulting domain focus

