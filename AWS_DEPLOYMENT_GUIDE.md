# AWS Deployment Guide - Fashion Fusion E-Commerce

Complete guide to deploy your Fashion Fusion application to AWS using CodePipeline, ECR, and ECS Fargate.

## Architecture Overview

```
GitHub → CodePipeline → CodeBuild → ECR → ECS Fargate
                           ↓
                      (Build Images)
```

**Components:**
- **Frontend**: Nginx serving React app (Port 80)
- **Backend**: Express API server (Port 3000)
- **Database**: AWS RDS PostgreSQL or external database
- **Load Balancer**: Application Load Balancer (ALB)

---

## Prerequisites

### 1. AWS Account Setup
- AWS Account with admin access
- AWS CLI installed and configured
- AWS Account ID (replace `<AWS_ACCOUNT_ID>` below)

### 2. Required AWS Services
- **ECR**: Container registry (2 repositories)
- **ECS**: Container orchestration
- **RDS**: PostgreSQL database (or external DB)
- **VPC**: With public/private subnets
- **ALB**: Application Load Balancer
- **Secrets Manager**: For sensitive data
- **CloudWatch**: For logs
- **CodePipeline**: CI/CD automation
- **CodeBuild**: Build Docker images

---

## Step 1: Create ECR Repositories

Create two ECR repositories for frontend and backend:

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
  --region us-east-1
```

**Save the repository URIs** - you'll need them later:
- `<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend`
- `<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/fashion-backend`

183631348877.dkr.ecr.us-east-1.amazonaws.com/fashion-frontend
---

## Step 2: Create RDS PostgreSQL Database

### Option A: Using AWS Console
1. Go to RDS → Create database
2. **Engine**: PostgreSQL 16
3. **Template**: Production (or Dev/Test)
4. **DB instance**: db.t3.micro (or larger)
5. **DB name**: `fashion_db`
6. **Username**: `postgres`
7. **Password**: (create a strong password)
8. **VPC**: Select your VPC
9. **Public access**: No (use private subnet)
10. **Security group**: Allow PostgreSQL (5432) from ECS tasks

### Option B: Using AWS CLI
```bash
# First create vpc subnet-group and security group
aws ec2 describe-vpcs --output table
# List your VPC subnets to pick at least two private subnets in different Availability Zones:

aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0ed2789978e42d3f1" \
  --query "Subnets[*].{ID:SubnetId,AZ:AvailabilityZone,Name:Tags[?Key=='Name']|[0].Value}" \
  --output table

aws rds create-db-subnet-group \
  --db-subnet-group-name fashion-db-subnet-group \
  --db-subnet-group-description "Subnet group for Fashion Fusion DB" \
  --subnet-ids subnet-0a7c311e17a414fe4  subnet-085f384f49fce050b subnet-0bf79100952f0a44f \
  --region us-east-1 

# rds subnet group
aws rds describe-db-subnet-groups --output table

#vpc Security group
aws ec2 describe-security-groups --output table

aws rds create-db-instance \
  --db-instance-identifier fashion-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 17.2 \
  --master-username postgres \
  --master-user-password STRONG_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-072190dc3348e9dca \
  --db-subnet-group-name default-vpc-0ed2789978e42d3f1 \
  --no-publicly-accessible
```

**Get the database endpoint:**
```bash
aws rds describe-db-instances \
  --db-instance-identifier fashion-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```
fashion-db.cng8gm8gi1fu.us-east-1.rds.amazonaws.com
---

## Step 3: Store Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name fashion-fusion/database-url \
  --secret-string "postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/fashion_db" \
  --region us-east-1

# JWT Access Secret (generate a random 32-char string)
aws secretsmanager create-secret \
  --name fashion-fusion/jwt-access-secret \
  --secret-string "$(openssl rand -base64 32)" \
  --region us-east-1

# JWT Refresh Secret
aws secretsmanager create-secret \
  --name fashion-fusion/jwt-refresh-secret \
  --secret-string "$(openssl rand -base64 32)" \
  --region us-east-1

# Optional: Cloudinary secrets (if using image uploads)
aws secretsmanager create-secret \
  --name fashion-fusion/cloudinary-cloud-name \
  --secret-string "YOUR_CLOUDINARY_CLOUD_NAME" \
  --region us-east-1
```

---

## Step 4: Create IAM Roles

### 4.1: ECS Task Execution Role

```bash
# Create trust policy
cat > ecs-task-execution-trust-policy.json <<EOF
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
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-task-execution-trust-policy.json

# Attach managed policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create custom policy for Secrets Manager access
cat > ecs-secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:<AWS_ACCOUNT_ID>:secret:fashion-fusion/*"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document file://ecs-secrets-policy.json
```

### 4.2: ECS Task Role (for application permissions)

```bash
# Create task role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://ecs-task-execution-trust-policy.json

# Add policies as needed (S3, CloudWatch, etc.)
```

### 4.3: CodeBuild Service Role

```bash
# Create trust policy for CodeBuild
cat > codebuild-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name CodeBuildServiceRole \
  --assume-role-policy-document file://codebuild-trust-policy.json

# Create policy for CodeBuild
cat > codebuild-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::codepipeline-us-east-1-*/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name CodeBuildServiceRole \
  --policy-name CodeBuildPolicy \
  --policy-document file://codebuild-policy.json
```

---

## Step 5: Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/fashion-fusion \
  --region us-east-1
```

---

## Step 6: Update ECS Task Definition

Edit `ecs-task-definition.json` and replace:
- `<AWS_ACCOUNT_ID>` with your AWS account ID
- Verify ARNs for secrets match your Secrets Manager secrets

Then register the task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1
```

---

## Step 7: Create Application Load Balancer

### 7.1: Create ALB

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name fashion-alb \
  --subnets subnet-XXXXXX subnet-YYYYYY \
  --security-groups sg-XXXXXXXX \
  --scheme internet-facing \
  --type application \
  --region us-east-1


# List security group rules
aws ec2 describe-security-groups \
  --query "SecurityGroups[*].{ID:GroupId,Name:GroupName}" \
  --output table

#list subnets
aws ec2 describe-subnets --output table

```
### 7.2: Create Target Group

```bash
# Create target group for frontend
aws elbv2 create-target-group \
  --name fashion-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-XXXXXXXX \
  --target-type ip \
  --health-check-path / \
  --region us-east-1
```

### 7.3: Create Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:<AWS_ACCOUNT_ID>:loadbalancer/app/fashion-alb/XXXXXXXXX \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<AWS_ACCOUNT_ID>:targetgroup/fashion-frontend-tg/XXXXXXXXX
```

---

## Step 8: Create ECS Cluster and Service

### 8.1: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name fashion-cluster \
  --region us-east-1
```

### 8.2: Create ECS Service

```bash
aws ecs create-service \
  --cluster fashion-cluster \
  --service-name fashion-service \
  --task-definition fashion-fusion-task:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-XXXXXX,subnet-YYYYYY],securityGroups=[sg-XXXXXXXX],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<AWS_ACCOUNT_ID>:targetgroup/fashion-frontend-tg/XXXXXXXXX,containerName=fashion-frontend,containerPort=80" \
  --health-check-grace-period-seconds 120 \
  --region us-east-1
```

---

## Step 9: Create CodeBuild Project

```bash
aws codebuild create-project \
  --name fashion-fusion-build \
  --source type=CODEPIPELINE \
  --artifacts type=CODEPIPELINE \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_MEDIUM,privilegedMode=true \
  --service-role arn:aws:iam::<AWS_ACCOUNT_ID>:role/CodeBuildServiceRole \
  --region us-east-1
```

**Environment variables for CodeBuild** (add these in the Console or via update-project):
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_DEFAULT_REGION`: `us-east-1`
- `ECR_REPOSITORY_FRONTEND`: `fashion-frontend`
- `ECR_REPOSITORY_BACKEND`: `fashion-backend`
- `CONTAINER_NAME_FRONTEND`: `fashion-frontend`
- `CONTAINER_NAME_BACKEND`: `fashion-backend`

---

## Step 10: Create CodePipeline

### Via AWS Console (Recommended):

1. **Navigate to CodePipeline** → Create pipeline
2. **Pipeline name**: `fashion-fusion-pipeline`
3. **Service role**: Create new service role
4. **Source**:
   - Provider: GitHub (Version 2)
   - Connect to GitHub
   - Select repository and branch
5. **Build**:
   - Provider: AWS CodeBuild
   - Project name: `fashion-fusion-build`
6. **Deploy**:
   - Provider: Amazon ECS
   - Cluster name: `fashion-cluster`
   - Service name: `fashion-service`
   - Image definitions file: `imagedefinitions.json`
7. **Review and create**

---

## Step 11: Test the Pipeline

1. Push a change to your GitHub repository
2. Watch CodePipeline automatically trigger
3. Monitor build progress in CodeBuild
4. Verify images pushed to ECR
5. Watch ECS service update with new task definition
6. Access your application via ALB DNS name

```bash
# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --names fashion-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

---

## Environment Variables Reference

### CodeBuild Environment Variables:
```
AWS_ACCOUNT_ID=<your-account-id>
AWS_DEFAULT_REGION=us-east-1
ECR_REPOSITORY_FRONTEND=fashion-frontend
ECR_REPOSITORY_BACKEND=fashion-backend
CONTAINER_NAME_FRONTEND=fashion-frontend
CONTAINER_NAME_BACKEND=fashion-backend
```

### Backend Container Environment Variables (in Task Definition):
```
PORT=3000
NODE_ENV=production
DOCKER_MODE=true
DATABASE_URL=<from Secrets Manager>
JWT_ACCESS_SECRET=<from Secrets Manager>
JWT_REFRESH_SECRET=<from Secrets Manager>
```

---

## Security Best Practices

1. **Use Secrets Manager** for all sensitive data
2. **Private subnets** for ECS tasks and RDS
3. **Security groups**:
   - ALB: Allow HTTP/HTTPS from internet
   - ECS: Allow traffic from ALB only
   - RDS: Allow PostgreSQL from ECS only
4. **Enable CloudWatch Logs** for debugging
5. **Use IAM roles** with least privilege
6. **Enable AWS WAF** on ALB (optional)

---

## Cost Optimization

- **Fargate Spot**: Use Fargate Spot for non-critical workloads
- **Auto Scaling**: Configure ECS service auto-scaling
- **RDS**: Use db.t3.micro for testing, scale up for production
- **ALB**: Delete if not using (costs ~$16/month)

---

## Troubleshooting

### Build fails in CodeBuild:
- Check CodeBuild logs in CloudWatch
- Verify ECR permissions in IAM role
- Ensure privileged mode is enabled

### ECS task fails to start:
- Check ECS task logs in CloudWatch
- Verify secrets exist in Secrets Manager
- Check security group rules
- Verify task role has correct permissions

### Database connection fails:
- Verify DATABASE_URL in Secrets Manager
- Check RDS security group allows ECS tasks
- Ensure RDS is in accessible subnet

### Images not updating:
- Verify imagedefinitions.json is generated correctly
- Check ECS service is set to use latest task definition
- Force new deployment if needed:
  ```bash
  aws ecs update-service \
    --cluster fashion-cluster \
    --service fashion-service \
    --force-new-deployment
  ```

---

## Maintenance Commands

### Force new deployment:
```bash
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --force-new-deployment
```

### View service status:
```bash
aws ecs describe-services \
  --cluster fashion-cluster \
  --services fashion-service
```

### View task logs:
```bash
# Get task ARN first
TASK_ARN=$(aws ecs list-tasks \
  --cluster fashion-cluster \
  --service-name fashion-service \
  --query 'taskArns[0]' \
  --output text)

# View logs in CloudWatch
aws logs tail /ecs/fashion-fusion --follow
```

---

## Next Steps

1. **Custom Domain**: Add Route 53 + ACM certificate
2. **HTTPS**: Configure ALB listener with SSL
3. **Monitoring**: Set up CloudWatch alarms
4. **Auto Scaling**: Configure target tracking
5. **Blue/Green Deployment**: Use CodeDeploy for zero-downtime deployments

---

## Support

For issues or questions:
- Check CloudWatch Logs for detailed error messages
- Review AWS documentation
- Contact AWS Support for infrastructure issues

---

**Congratulations!** Your Fashion Fusion app is now deployed on AWS with a complete CI/CD pipeline! 🎉
