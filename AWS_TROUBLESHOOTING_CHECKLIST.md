# AWS Deployment Troubleshooting Checklist
## Fashion Fusion - Quick Issue Resolution Guide

Based on your specific issues: **registration failing** and **product images not loading** in AWS ECS Fargate.

---

## ✅ Pre-Deployment Checklist

Before deploying, verify these are in place:

### 1. Database Setup
- [ ] RDS PostgreSQL instance created
- [ ] RDS is in a **private subnet**
- [ ] RDS security group allows port 5432 from ECS security group
- [ ] Database name: `fashion_db`
- [ ] Master username matches your DATABASE_URL
- [ ] Password matches your DATABASE_URL

### 2. Secrets Manager
- [ ] `fashion-fusion/database-url` secret created
- [ ] DATABASE_URL format: `postgresql://username:password@host:port/database`
- [ ] `fashion-fusion/jwt-access-secret` created
- [ ] `fashion-fusion/jwt-refresh-secret` created
- [ ] All secret ARNs noted for task definition

### 3. IAM Roles
- [ ] Task Execution Role created with:
  - [ ] `AmazonECSTaskExecutionRolePolicy` attached
  - [ ] Custom Secrets Manager access policy attached
  - [ ] Permission to access `/ecs/fashion-fusion` log group
- [ ] Task Role created

### 4. Networking
- [ ] VPC with public/private subnets
- [ ] ECS security group allows outbound HTTPS (port 443)
- [ ] NAT Gateway configured (if using private subnets)
- [ ] Or ECS tasks in public subnet with `assignPublicIp=ENABLED`

---

## 🔴 Issue 1: Registration Failing

### Symptoms
- Users can't create accounts
- Backend returns database connection errors
- CloudWatch logs show PostgreSQL connection failures

### Root Causes & Solutions

#### Cause A: Invalid DATABASE_URL Format

**Check:**
```bash
aws secretsmanager get-secret-value \
  --secret-id fashion-fusion/database-url \
  --query 'SecretString' \
  --output text
```

**Expected format:**
```
postgresql://postgres:YOUR_PASSWORD@your-rds-endpoint.region.rds.amazonaws.com:5432/fashion_db
```

**Common mistakes:**
- ❌ `postgres://` instead of `postgresql://`
- ❌ Wrong port (not 5432)
- ❌ Wrong database name (not `fashion_db`)
- ❌ Special characters in password not URL-encoded

**Fix:**
```bash
# Update with correct format
aws secretsmanager update-secret \
  --secret-id fashion-fusion/database-url \
  --secret-string "postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/fashion_db"
```

#### Cause B: ECS Can't Reach RDS

**Check security groups:**
```bash
# Get RDS security group rules
aws ec2 describe-security-groups \
  --group-ids YOUR_RDS_SECURITY_GROUP_ID \
  --query 'SecurityGroups[0].IpPermissions'
```

**Required rule:**
- Type: PostgreSQL
- Protocol: TCP
- Port: 5432
- Source: ECS security group ID

**Fix:**
```bash
aws ec2 authorize-security-group-ingress \
  --group-id YOUR_RDS_SECURITY_GROUP_ID \
  --protocol tcp \
  --port 5432 \
  --source-group YOUR_ECS_SECURITY_GROUP_ID
```

#### Cause C: Secret ARN Incorrect in Task Definition

**Check your task definition:**
```json
"secrets": [
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:fashion-fusion/database-url-XXXXXX"
  }
]
```

**Get correct ARN:**
```bash
aws secretsmanager describe-secret \
  --secret-id fashion-fusion/database-url \
  --query 'ARN' \
  --output text
```

**Fix:**
Update task definition with correct ARN, then re-register:
```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-updated.json
```

#### Cause D: Missing Database Migrations

The application auto-runs migrations on startup, but check logs:

```bash
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "migration"
```

If migrations fail, you may need to run them manually:

```bash
# Connect to RDS from a bastion host or local machine with RDS access
psql postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/fashion_db

# Run migrations manually if needed
# Or connect via ECS Exec and run: npm run db:push
```

---

## 🔴 Issue 2: Product Images Not Loading

### Symptoms
- Homepage hero section loads
- Category cards show no images
- Product thumbnails are broken
- Browser console shows network errors

### Root Causes & Solutions

#### Cause A: ECS Tasks Have No Internet Access

**This is the #1 cause!** ECS tasks need internet access to load images from `https://cdn.dummyjson.com`

**Check your network configuration:**

**Option 1: Public Subnet (Recommended for testing)**
```bash
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-PUBLIC1,subnet-PUBLIC2],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

**Option 2: Private Subnet with NAT Gateway**
1. Create NAT Gateway in public subnet
2. Update private subnet route table to route 0.0.0.0/0 to NAT Gateway
3. Deploy ECS tasks to private subnet:
```bash
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-PRIVATE1,subnet-PRIVATE2],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}"
```

#### Cause B: Security Group Blocks Outbound HTTPS

**Check outbound rules:**
```bash
aws ec2 describe-security-groups \
  --group-ids YOUR_ECS_SECURITY_GROUP_ID \
  --query 'SecurityGroups[0].IpPermissionsEgress'
```

**Required rule:**
- Type: HTTPS
- Protocol: TCP
- Port: 443
- Destination: 0.0.0.0/0

**Fix:**
```bash
aws ec2 authorize-security-group-egress \
  --group-id YOUR_ECS_SECURITY_GROUP_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

#### Cause C: Frontend Can't Reach Backend API

**Symptom:** Images load but no products show

**Check:**
1. Verify nginx.conf proxies `/api` to backend
2. Check that both containers are in same task
3. Verify backend is healthy

**View logs:**
```bash
# Backend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "backend"

# Frontend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "frontend"
```

**Fix nginx config if needed:**
```nginx
# In deployment/frontend/nginx.conf
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 🧪 Testing Checklist

After deployment, test each component:

### 1. Backend Health Check
```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names fashion-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test health endpoint
curl http://$ALB_DNS/api/health
# Expected: {"status":"ok"}
```

### 2. Database Connection
```bash
# Test products endpoint
curl http://$ALB_DNS/api/products
# Expected: JSON array of products
```

### 3. Registration
```bash
# Test registration
curl -X POST http://$ALB_DNS/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
# Expected: {"user":{...},"accessToken":"..."}
```

### 4. Product Images
```bash
# Check if frontend can load external images
curl -I https://cdn.dummyjson.com/products/1/thumbnail.jpg
# Expected: 200 OK

# Test from within ECS task (if exec enabled)
aws ecs execute-command \
  --cluster fashion-cluster \
  --task TASK_ID \
  --container fashion-backend \
  --command "curl -I https://cdn.dummyjson.com/products/1/thumbnail.jpg" \
  --interactive
```

---

## 📊 Debugging Commands

### View Live Logs
```bash
# All logs
aws logs tail /ecs/fashion-fusion --follow

# Backend only
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "backend"

# Errors only
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "ERROR"

# Database connection issues
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "database"
```

### Check Task Status
```bash
# List running tasks
aws ecs list-tasks \
  --cluster fashion-cluster \
  --service-name fashion-service

# Describe task
TASK_ARN=$(aws ecs list-tasks --cluster fashion-cluster --service-name fashion-service --query 'taskArns[0]' --output text)

aws ecs describe-tasks \
  --cluster fashion-cluster \
  --tasks $TASK_ARN \
  --query 'tasks[0].{Status:lastStatus,Health:healthStatus,Containers:containers[*].{Name:name,Status:lastStatus,Health:healthStatus}}'
```

### Check Service Events
```bash
# Recent service events (helpful for deployment failures)
aws ecs describe-services \
  --cluster fashion-cluster \
  --services fashion-service \
  --query 'services[0].events[0:10]'
```

---

## 🔄 Force Redeploy After Fixes

After fixing issues, force a new deployment:

```bash
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --force-new-deployment \
  --region us-east-1
```

---

## ✅ Success Indicators

When everything is working correctly, you should see:

**CloudWatch Logs:**
```
✅ Auto-seed completed successfully
✅ serving on port 3000
✅ Database already has 100 products
```

**Task Status:**
```
Status: RUNNING
Health: HEALTHY
```

**Browser:**
```
✅ Homepage loads with hero image
✅ Product categories show thumbnails
✅ Registration creates account successfully
✅ Products display with images
✅ Cart and wishlist work
```

---

## 🆘 Still Having Issues?

1. **Check all secrets are correct:**
   ```bash
   aws secretsmanager list-secrets --query 'SecretList[?Name contains fashion-fusion]'
   ```

2. **Verify IAM permissions:**
   ```bash
   aws iam get-role-policy \
     --role-name FashionFusionTaskExecutionRole \
     --policy-name SecretsManagerAccess
   ```

3. **Test RDS connectivity from EC2 instance in same VPC:**
   ```bash
   psql postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/fashion_db -c "SELECT version();"
   ```

4. **Enable ECS Exec for debugging:**
   ```bash
   aws ecs update-service \
     --cluster fashion-cluster \
     --service fashion-service \
     --enable-execute-command
   ```

---

## 📞 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ResourceInitializationError` | Can't access secrets | Check execution role permissions |
| `ECONNREFUSED` | Can't reach database | Check security groups |
| `getaddrinfo ENOTFOUND` | Invalid RDS endpoint | Verify DATABASE_URL |
| `password authentication failed` | Wrong credentials | Update secret with correct password |
| `database "fashion_db" does not exist` | Database not created | Create database in RDS |
| `Network error` for images | No internet access | Add NAT Gateway or use public subnet |

---

**🎯 Quick Win:** Most issues are due to security group rules or subnet configuration. Start there!
