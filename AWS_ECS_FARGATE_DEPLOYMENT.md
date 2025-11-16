# AWS ECS Fargate Deployment Guide - Fashion Fusion
## Complete Setup with RDS PostgreSQL & Secrets Manager

This guide shows you how to deploy the Fashion Fusion e-commerce application on AWS ECS Fargate with RDS PostgreSQL database and Secrets Manager for environment variables.

---

## 🎯 Architecture Overview

```
GitHub → ECR (Docker Images) → ECS Fargate → RDS PostgreSQL
                                    ↓
                            Secrets Manager
```

**Components:**
- **Frontend**: Nginx serving React app (Port 80)
- **Backend**: Express API server (Port 3000)
- **Database**: AWS RDS PostgreSQL
- **Secrets**: AWS Secrets Manager
- **Load Balancer**: Application Load Balancer (ALB)

---

## ⚠️ Key Requirements for This Application

### 1. **Database Connection** (CRITICAL)
Your ECS tasks MUST be able to connect to RDS. This requires:
- ✅ RDS in a **private subnet** with security group allowing ECS tasks
- ✅ ECS tasks in **same VPC** as RDS
- ✅ Security group rules allowing port 5432 (PostgreSQL) from ECS to RDS
- ✅ DATABASE_URL secret correctly formatted in Secrets Manager

### 2. **Product Images**
This application uses **DummyJSON CDN** for product images:
- ✅ No S3 bucket needed
- ✅ ECS tasks need **internet access** (via NAT Gateway or public subnet)
- ✅ Images loaded from: `https://cdn.dummyjson.com`

---

## 📋 Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Docker installed locally
- GitHub repository
- Node.js 20+ installed

---

## 🔐 Step 1: Create Secrets in AWS Secrets Manager

### 1.1: Database URL Secret

```bash
# Format: postgresql://username:password@host:port/database
aws secretsmanager create-secret \
  --name fashion-fusion/database-url \
  --description "PostgreSQL connection string for Fashion Fusion" \
  --secret-string "postgresql://postgres:YOUR_RDS_PASSWORD@YOUR_RDS_ENDPOINT:5432/fashion_db" \
  --region us-east-1

# Example:
# postgresql://postgres:SecurePass123@fashion-db.abc123.us-east-1.rds.amazonaws.com:5432/fashion_db
```

### 1.2: JWT Secrets

```bash
# Generate secure JWT secrets
aws secretsmanager create-secret \
  --name fashion-fusion/jwt-access-secret \
  --description "JWT access token secret" \
  --secret-string "$(openssl rand -base64 32)" \
  --region us-east-1

aws secretsmanager create-secret \
  --name fashion-fusion/jwt-refresh-secret \
  --description "JWT refresh token secret" \
  --secret-string "$(openssl rand -base64 32)" \
  --region us-east-1
```

### 1.3: Verify Secrets

```bash
# List all secrets
aws secretsmanager list-secrets --region us-east-1

# Get secret ARN (save this for task definition)
aws secretsmanager describe-secret \
  --secret-id fashion-fusion/database-url \
  --region us-east-1 \
  --query 'ARN' \
  --output text
```

---

## 🗄️ Step 2: Create RDS PostgreSQL Database

### 2.1: Create DB Subnet Group

```bash
# List your VPC subnets
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=YOUR_VPC_ID" \
  --query "Subnets[*].{ID:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock}" \
  --output table

# Create subnet group (use 2+ subnets in different AZs)
aws rds create-db-subnet-group \
  --db-subnet-group-name fashion-db-subnet-group \
  --db-subnet-group-description "Subnet group for Fashion Fusion DB" \
  --subnet-ids subnet-xxxxx subnet-yyyyy \
  --region us-east-1
```

### 2.2: Create Security Group for RDS

```bash
# Create security group
aws ec2 create-security-group \
  --group-name fashion-rds-sg \
  --description "Security group for Fashion Fusion RDS" \
  --vpc-id YOUR_VPC_ID \
  --region us-east-1

# Allow PostgreSQL from ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group YOUR_ECS_SECURITY_GROUP_ID \
  --region us-east-1
```

### 2.3: Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier fashion-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username postgres \
  --master-user-password STRONG_PASSWORD_HERE \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name fashion-db-subnet-group \
  --db-name fashion_db \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --region us-east-1

# Get RDS endpoint (wait 5-10 minutes for creation)
aws rds describe-db-instances \
  --db-instance-identifier fashion-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 2.4: Update Database URL Secret

```bash
# Update the secret with actual RDS endpoint
aws secretsmanager update-secret \
  --secret-id fashion-fusion/database-url \
  --secret-string "postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/fashion_db" \
  --region us-east-1
```

---

## 🔑 Step 3: Create IAM Roles

### 3.1: ECS Task Execution Role (CRITICAL)

This role allows ECS to pull secrets from Secrets Manager:

```bash
# Create trust policy
cat > ecs-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name FashionFusionTaskExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Attach managed policy for ECR and CloudWatch
aws iam attach-role-policy \
  --role-name FashionFusionTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager
cat > secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:fashion-fusion/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name FashionFusionTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document file://secrets-policy.json
```

### 3.2: ECS Task Role

```bash
# Create task role (for application permissions)
aws iam create-role \
  --role-name FashionFusionTaskRole \
  --assume-role-policy-document file://ecs-trust-policy.json
```

---

## 🐳 Step 4: Build and Push Docker Images to ECR

### 4.1: Create ECR Repositories

```bash
# Create frontend repository
aws ecr create-repository \
  --repository-name fashion-frontend \
  --region us-east-1

# Create backend repository
aws ecr create-repository \
  --repository-name fashion-backend \
  --region us-east-1

# Get repository URIs
aws ecr describe-repositories \
  --repository-names fashion-frontend fashion-backend \
  --query 'repositories[*].[repositoryName,repositoryUri]' \
  --output table
```

### 4.2: Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build frontend
docker build -f deployment/frontend/Dockerfile \
  -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest .

# Build backend
docker build -f deployment/backend/Dockerfile \
  -t YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest .

# Push images
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest
```

---

## 📝 Step 5: Create ECS Task Definition

Create `ecs-task-definition-updated.json`:

```json
{
  "family": "fashion-fusion-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/FashionFusionTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/FashionFusionTaskRole",
  "containerDefinitions": [
    {
      "name": "fashion-frontend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "dependsOn": [
        {
          "containerName": "fashion-backend",
          "condition": "HEALTHY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-create-group": "true",
          "awslogs-group": "/ecs/fashion-fusion",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    },
    {
      "name": "fashion-backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fashion-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DOCKER_MODE",
          "value": "true"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:fashion-fusion/database-url-XXXXXX"
        },
        {
          "name": "JWT_ACCESS_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:fashion-fusion/jwt-access-secret-XXXXXX"
        },
        {
          "name": "JWT_REFRESH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:fashion-fusion/jwt-refresh-secret-XXXXXX"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-create-group": "true",
          "awslogs-group": "/ecs/fashion-fusion",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

### Register Task Definition

```bash
# Update YOUR_ACCOUNT_ID and secret ARNs in the file first
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition-updated.json \
  --region us-east-1
```

---

## 🌐 Step 6: Create Application Load Balancer

### 6.1: Create ALB

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name fashion-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --region us-east-1
```

### 6.2: Create Target Group

```bash
# Create target group
aws elbv2 create-target-group \
  --name fashion-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id YOUR_VPC_ID \
  --target-type ip \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-east-1
```

### 6.3: Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:loadbalancer/app/fashion-alb/XXXXXX \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:targetgroup/fashion-frontend-tg/XXXXXX
```

---

## 🚀 Step 7: Create ECS Cluster and Service

### 7.1: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name fashion-cluster \
  --region us-east-1
```

### 7.2: Create ECS Service

```bash
aws ecs create-service \
  --cluster fashion-cluster \
  --service-name fashion-service \
  --task-definition fashion-fusion-task:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:YOUR_ACCOUNT_ID:targetgroup/fashion-frontend-tg/XXXXXX,containerName=fashion-frontend,containerPort=80" \
  --health-check-grace-period-seconds 120 \
  --region us-east-1
```

---

## 🔍 Step 8: Verify Deployment

### 8.1: Check Task Status

```bash
# List tasks
aws ecs list-tasks \
  --cluster fashion-cluster \
  --service-name fashion-service \
  --region us-east-1

# Describe task
TASK_ARN=$(aws ecs list-tasks --cluster fashion-cluster --service-name fashion-service --query 'taskArns[0]' --output text)

aws ecs describe-tasks \
  --cluster fashion-cluster \
  --tasks $TASK_ARN \
  --region us-east-1
```

### 8.2: Check Logs

```bash
# View backend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "backend"

# View frontend logs
aws logs tail /ecs/fashion-fusion --follow --filter-pattern "frontend"
```

### 8.3: Access Application

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --names fashion-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

Visit the DNS name in your browser: `http://fashion-alb-xxxxx.us-east-1.elb.amazonaws.com`

---

## 🛠️ Troubleshooting

### Issue 1: Database Connection Failed

**Symptoms:**
- Registration fails
- Backend logs show connection errors

**Solutions:**

1. **Check DATABASE_URL format:**
   ```bash
   # Should be: postgresql://username:password@host:port/database
   aws secretsmanager get-secret-value \
     --secret-id fashion-fusion/database-url \
     --query 'SecretString' \
     --output text
   ```

2. **Verify RDS is accessible from ECS:**
   ```bash
   # Check security group rules
   aws ec2 describe-security-groups \
     --group-ids YOUR_RDS_SECURITY_GROUP \
     --query 'SecurityGroups[0].IpPermissions'
   ```
   
   Must allow **port 5432** from **ECS security group**

3. **Test connection from ECS task:**
   ```bash
   # SSH into a running task (if enabled) or check logs
   aws logs tail /ecs/fashion-fusion --follow
   ```

### Issue 2: Product Images Not Loading

**Symptoms:**
- Homepage shows broken images
- Category cards have no images

**Solutions:**

1. **Verify ECS tasks have internet access:**
   - If in private subnet: Need NAT Gateway
   - If in public subnet: Need `assignPublicIp=ENABLED`

2. **Check outbound security group rules:**
   ```bash
   # ECS security group must allow outbound HTTPS (443)
   aws ec2 authorize-security-group-egress \
     --group-id YOUR_ECS_SECURITY_GROUP \
     --protocol tcp \
     --port 443 \
     --cidr 0.0.0.0/0
   ```

3. **Test CDN access from container:**
   ```bash
   # Exec into container
   curl -I https://cdn.dummyjson.com
   # Should return 200 OK
   ```

### Issue 3: Task Fails to Start

**Common Causes:**

1. **Secrets Manager permissions:**
   ```bash
   # Verify execution role has permissions
   aws iam get-role-policy \
     --role-name FashionFusionTaskExecutionRole \
     --policy-name SecretsManagerAccess
   ```

2. **Invalid secret ARN:**
   ```bash
   # Get correct ARN
   aws secretsmanager describe-secret \
     --secret-id fashion-fusion/database-url \
     --query 'ARN'
   ```

3. **Health check failing:**
   - Check if backend is listening on port 3000
   - Verify `/api/health` endpoint exists
   - Increase `startPeriod` in health check

### Issue 4: Frontend Can't Reach Backend

**Solution:**
In production with Docker mode, frontend connects to backend via localhost (same task). Verify:

```bash
# Check nginx.conf in frontend container
cat deployment/frontend/nginx.conf
# Should proxy /api to http://localhost:3000
```

---

## 📊 Monitoring & Maintenance

### CloudWatch Logs

```bash
# View all logs
aws logs tail /ecs/fashion-fusion --follow

# Filter for errors
aws logs tail /ecs/fashion-fusion --filter-pattern "ERROR"

# Get specific time range
aws logs tail /ecs/fashion-fusion --since 1h
```

### Force New Deployment

```bash
# After updating secrets or images
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --force-new-deployment \
  --region us-east-1
```

### Scale Service

```bash
# Increase to 2 tasks
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --desired-count 2 \
  --region us-east-1
```

---

## 💰 Cost Optimization

- **Fargate**: ~$0.04/hour for 1 vCPU, 2GB RAM = ~$30/month
- **RDS db.t3.micro**: ~$15/month
- **ALB**: ~$16/month
- **NAT Gateway**: ~$32/month (if using private subnets)
- **Total**: ~$95/month minimum

**To reduce costs:**
- Use public subnets (remove NAT Gateway): save $32/month
- Use RDS reserved instances: save 30-40%
- Use Fargate Spot: save up to 70%

---

## 🔒 Security Best Practices

1. ✅ Use Secrets Manager for all credentials
2. ✅ RDS in private subnet with restrictive security groups
3. ✅ Enable VPC Flow Logs
4. ✅ Use HTTPS with ACM certificate on ALB
5. ✅ Enable CloudWatch Logs encryption
6. ✅ Implement least privilege IAM roles
7. ✅ Enable RDS encryption at rest
8. ✅ Enable automated RDS backups

---

## 📚 References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Secrets Manager Integration](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

---

**🎉 Congratulations!** Your Fashion Fusion application is now running on AWS ECS Fargate with RDS and Secrets Manager!
