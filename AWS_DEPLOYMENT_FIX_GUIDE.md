# AWS CloudFormation Deployment Fix Guide

## Problem Summary

Your CloudFormation deployment was running but the database connection and product data weren't working because the backend container was missing critical environment variables and secrets.

## Root Causes Identified

1. **Missing PORT Environment Variable**
   - Backend was defaulting to port 5000 instead of 3000
   - ALB health checks and container health checks were failing
   - Frontend couldn't communicate with backend

2. **Missing DOCKER_MODE Environment Variable**
   - Backend was trying to serve static files
   - Should let nginx (frontend container) handle static assets

3. **Missing JWT Secrets**
   - JWT_ACCESS_SECRET and JWT_REFRESH_SECRET were not configured
   - User authentication was completely broken
   - Login/register endpoints would fail

4. **Missing Health Check**
   - No health check on backend container
   - ECS couldn't determine if backend was ready
   - Frontend might start before backend is available

5. **Missing Container Dependency**
   - Frontend wasn't waiting for backend to be healthy
   - Race condition on startup

## What Was Fixed

### 1. Added New CloudFormation Parameters

```yaml
JwtAccessSecretArn:
  Type: String
  Default: ''
  Description: 'ARN of the Secrets Manager secret that contains JWT_ACCESS_SECRET'

JwtRefreshSecretArn:
  Type: String
  Default: ''
  Description: 'ARN of the Secrets Manager secret that contains JWT_REFRESH_SECRET'
```

### 2. Updated Backend Container Configuration

**Added Environment Variables:**
```yaml
Environment:
  - Name: NODE_ENV
    Value: production
  - Name: PORT
    Value: '3000'          # NEW - Forces backend to use port 3000
  - Name: DOCKER_MODE
    Value: 'true'          # NEW - Tells backend not to serve static files
```

**Added Secrets:**
```yaml
Secrets:
  - Name: DATABASE_URL
    ValueFrom: !Ref DatabaseSecretArn
  - Name: JWT_ACCESS_SECRET      # NEW
    ValueFrom: !Ref JwtAccessSecretArn
  - Name: JWT_REFRESH_SECRET     # NEW
    ValueFrom: !Ref JwtRefreshSecretArn
```

**Added Health Check:**
```yaml
HealthCheck:
  Command:
    - CMD-SHELL
    - curl -f http://localhost:3000/api/health || exit 1
  Interval: 30
  Timeout: 5
  Retries: 3
  StartPeriod: 60    # Gives backend 60 seconds to start and seed database
```

### 3. Added Frontend Container Dependency

```yaml
DependsOn:
  - ContainerName: fashion-backend
    Condition: HEALTHY    # Frontend waits for backend to pass health check
```

## Deployment Steps

### Step 1: Get Your JWT Secret ARNs

From AWS Secrets Manager console, get the full ARNs for:
- `fashion-fusion/jwt-access-secret`
- `fashion-fusion/jwt-refresh-secret`

They should look like:
- `arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/jwt-access-secret-K4FBwU`
- `arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/jwt-refresh-secret-56VAyt`

### Step 2: Update CloudFormation Stack

Run this command with your actual JWT secret ARNs:

```powershell
aws cloudformation deploy `
    --template-file cloudformation/fashion-fusion-infra.yaml `
    --stack-name fashion-fusion-infra `
    --parameter-overrides `
        AwsAccountId='183631348877' `
        GitHubConnectionArn='arn:aws:codestar-connections:us-east-1:183631348877:connection/d8ecb6f3-c558-4cf1-8248-cc3e32dd5714' `
        GitHubRepo='Whoisabi/Fashion-Fusion' `
        GitHubBranch='main' `
        VpcId='vpc-0ed2789978e42d3f1' `
        SubnetIds='subnet-085f384f49fce050b,subnet-0bf79100952f0a44f' `
        ServiceSecurityGroup='sg-0a472b67f81fd8045' `
        AlbSecurityGroup='sg-0442640b52ab727e6' `
        DatabaseSecretArn='arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/database-url-YrnhZs' `
        DockerHubSecretArn='arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/dockerhub-credentials-NVNJZ2' `
        JwtAccessSecretArn='arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/jwt-access-secret-XXXXXX' `
        JwtRefreshSecretArn='arn:aws:secretsmanager:us-east-1:183631348877:secret:fashion-fusion/jwt-refresh-secret-XXXXXX' `
    --capabilities CAPABILITY_NAMED_IAM
```

**Replace `XXXXXX` with your actual secret suffixes!**

### Step 3: Wait for Stack Update

```powershell
aws cloudformation wait stack-update-complete --stack-name fashion-fusion-infra
```

### Step 4: Trigger Pipeline to Redeploy

The stack update will create a new task definition, but you need to trigger the pipeline to rebuild and deploy the containers:

```powershell
# Trigger the pipeline
aws codepipeline start-pipeline-execution --name fashion-fusion-pipeline
```

Or push a commit to your GitHub repository to trigger the pipeline automatically.

### Step 5: Monitor ECS Service

```powershell
# Check service status
aws ecs describe-services --cluster fashion-cluster --services fashion-service

# Check task status
aws ecs list-tasks --cluster fashion-cluster --service-name fashion-service

# Get task details (replace TASK_ID with actual task ID from previous command)
aws ecs describe-tasks --cluster fashion-cluster --tasks TASK_ID
```

### Step 6: Check Logs

```powershell
# Backend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "backend"

# Frontend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "frontend"
```

## What Should Happen Now

1. **Stack Update**: CloudFormation will update the task definition with new environment variables and secrets
2. **ECS Deployment**: ECS will create new tasks with the updated configuration
3. **Backend Health Check**: Backend will:
   - Start on port 3000 (correct port)
   - Connect to database using DATABASE_URL
   - Run migrations automatically
   - Seed products if database is empty
   - Pass health check at `/api/health`
4. **Frontend Start**: After backend is HEALTHY, frontend will start
5. **Database Seeding**: Your entrypoint script automatically seeds 100 products on first run

## Verification Steps

### 1. Check ALB Health

```powershell
# Get ALB DNS name
aws cloudformation describe-stacks --stack-name fashion-fusion-infra --query "Stacks[0].Outputs[?OutputKey=='ALBDnsName'].OutputValue" --output text
```

Visit the ALB URL in your browser - you should see the Fashion-Fusion homepage with products.

### 2. Test Backend API

```powershell
# Replace with your ALB DNS
$ALB_DNS = "fashion-fusion-alb-XXXXXXXXX.us-east-1.elb.amazonaws.com"

# Test health endpoint
curl "http://$ALB_DNS/api/health"

# Test products endpoint
curl "http://$ALB_DNS/api/products"
```

### 3. Check Database Products

Connect to your database and verify products were seeded:

```sql
SELECT COUNT(*) FROM products;
-- Should return 100
```

## Common Issues and Solutions

### Issue: Backend Health Check Still Failing

**Check:**
```powershell
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "backend" --since 10m
```

**Common Causes:**
- Database connection failed (check DATABASE_URL secret)
- Migrations failed (check logs for SQL errors)
- Port mismatch (verify PORT=3000 is set)

### Issue: No Products in Database

**Check Seeding Logs:**
```powershell
aws logs tail /ecs/fashion-fusion --filter-pattern "seed" --since 30m
```

**Manual Seed (if needed):**
```powershell
# Get task ID
TASK_ID=$(aws ecs list-tasks --cluster fashion-cluster --service-name fashion-service --query "taskArns[0]" --output text | sed 's/.*\///')

# Run seed command
aws ecs execute-command \
    --cluster fashion-cluster \
    --task $TASK_ID \
    --container fashion-backend \
    --interactive \
    --command "npx tsx server/seed.ts"
```

### Issue: JWT Secrets Not Found

Verify the secrets exist and the ECS Task Execution Role has permission:

```powershell
# Test secret retrieval
aws secretsmanager get-secret-value --secret-id fashion-fusion/jwt-access-secret
```

If this fails, check the IAM role permissions in the CloudFormation template (ECSTaskExecutionRole should have secretsmanager:GetSecretValue).

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Backend PORT | 5000 (default) | 3000 (explicit) |
| DOCKER_MODE | Not set | true |
| JWT_ACCESS_SECRET | Missing | From Secrets Manager |
| JWT_REFRESH_SECRET | Missing | From Secrets Manager |
| Health Check | None | `/api/health` on port 3000 |
| Frontend Dependency | None | Waits for backend HEALTHY |

## Expected Result

After deployment:
- ✅ Backend starts on port 3000
- ✅ Backend connects to PostgreSQL database
- ✅ Migrations run automatically
- ✅ Database seeds with 100 products
- ✅ Health check passes at `/api/health`
- ✅ Frontend starts after backend is healthy
- ✅ Application accessible via ALB
- ✅ User authentication works (JWT tokens)
- ✅ Products load on homepage
- ✅ All API endpoints functional

## Need Help?

If you're still experiencing issues:

1. Check CloudWatch Logs for specific error messages
2. Verify all secret ARNs are correct
3. Ensure security groups allow traffic on port 3000 (backend) and port 80 (frontend)
4. Check ECS task definitions were updated correctly
5. Verify IAM role permissions for Secrets Manager access
