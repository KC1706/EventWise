# EventWise Support Guide

## Getting Help

### Documentation
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./docs/api.md) (coming soon)
- [User Guide](./docs/user-guide.md) (coming soon)

### Common Issues

#### Firebase Connection Issues
- Verify all Firebase environment variables are set
- Check Firebase project is active
- Ensure Firestore is enabled

#### Stripe Payment Issues
- Verify Stripe keys are correct
- Check webhook endpoint is configured
- Ensure products/prices exist in Stripe

#### AI Features Not Working
- Verify GOOGLE_AI_API_KEY is set
- Check API quota limits
- Ensure model name is correct

## Feature Requests

Open an issue on GitHub with the `feature-request` label.

## Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
