# CloudFormation Deployment Guide - Fashion Fusion
## 100% Automated Infrastructure as Code - Zero Manual Steps

This guide uses the `complete-stack.yaml` CloudFormation template to deploy the entire Fashion Fusion infrastructure automatically with **NO manual configuration** required.

---

## 🎯 What Gets Created Automatically

### ✅ Database & Secrets
- **RDS PostgreSQL 16.3** instance with encryption
- **3 Secrets Manager secrets** (auto-generated):
  - Database master password
  - JWT access token secret
  - JWT refresh token secret  
- **DATABASE_URL** secret (auto-constructed from RDS endpoint)

### ✅ Networking
- **3 Security Groups** with proper ingress/egress rules:
  - ALB Security Group (internet → ALB)
  - ECS Security Group (ALB → ECS, ECS → RDS, ECS → internet)
  - RDS Security Group (ECS → RDS)
- **DB Subnet Group** for RDS

### ✅ Container Infrastructure
- **2 ECR Repositories** (frontend & backend) with lifecycle policies
- **ECS Fargate Cluster** with Container Insights
- **ECS Task Definition** with secrets injection
- **ECS Service** with auto-scaling and circuit breaker

### ✅ Load Balancing
- **Application Load Balancer** (ALB)
- **Target Group** with health checks
- **HTTP Listener** on port 80

### ✅ CI/CD Pipeline
- **CodeBuild Project** for Docker image builds
- **CodePipeline** connected to GitHub
- **S3 Bucket** for pipeline artifacts
- **IAM Roles** with least privilege permissions

### ✅ Monitoring
- **CloudWatch Log Groups** with 30-day retention
- **Container Insights** enabled

---

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS Account with admin access
- AWS CLI installed and configured
- Correct AWS region set (e.g., `us-east-1`)

```bash
# Verify AWS configuration
aws sts get-caller-identity
aws configure get region
```

### 2. VPC and Subnets
You need an existing VPC with:
- **2+ Public Subnets** (in different AZs) for ALB and ECS
- **2+ Private Subnets** (in different AZs) for RDS

```bash
# List your VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].{VpcId:VpcId,Name:Tags[?Key==`Name`].Value|[0]}' --output table

# List subnets for your VPC
VPC_ID="vpc-xxxxx"  # Replace with your VPC ID
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].{SubnetId:SubnetId,AZ:AvailabilityZone,Type:Tags[?Key==`Name`].Value|[0],CIDR:CidrBlock}' \
  --output table
```

**Note your subnet IDs:**
- Public subnets: `subnet-xxxxx`, `subnet-yyyyy`
- Private subnets: `subnet-aaaaa`, `subnet-bbbbb`

### 3. GitHub Connection (One-Time Manual Step)

Create a CodeStar connection to GitHub **via AWS Console** (cannot be automated):

1. Go to **AWS Console → Developer Tools → Settings → Connections**
2. Click **Create connection**
3. Select **GitHub**
4. Name: `fashion-fusion-github`
5. Click **Connect to GitHub**
6. Authorize AWS
7. **Copy the Connection ARN** (looks like: `arn:aws:codestar-connections:us-east-1:123456789:connection/xxxxx`)

This is the **ONLY manual step** required!

---

## 🚀 Deployment Steps

### Step 1: Prepare Parameters File

Create `parameters.json` with your values:

```json
[
  {
    "ParameterKey": "GitHubConnectionArn",
    "ParameterValue": "arn:aws:codestar-connections:us-east-1:YOUR_ACCOUNT_ID:connection/xxxxx"
  },
  {
    "ParameterKey": "GitHubRepo",
    "ParameterValue": "YourUsername/Fashion-Fusion"
  },
  {
    "ParameterKey": "GitHubBranch",
    "ParameterValue": "main"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxx"
  },
  {
    "ParameterKey": "PublicSubnetIds",
    "ParameterValue": "subnet-public1,subnet-public2"
  },
  {
    "ParameterKey": "PrivateSubnetIds",
    "ParameterValue": "subnet-private1,subnet-private2"
  },
  {
    "ParameterKey": "DBInstanceClass",
    "ParameterValue": "db.t3.micro"
  },
  {
    "ParameterKey": "DBAllocatedStorage",
    "ParameterValue": "20"
  },
  {
    "ParameterKey": "DBName",
    "ParameterValue": "fashion_db"
  },
  {
    "ParameterKey": "DBMasterUsername",
    "ParameterValue": "postgres"
  },
  {
    "ParameterKey": "DesiredTaskCount",
    "ParameterValue": "1"
  },
  {
    "ParameterKey": "TaskCpu",
    "ParameterValue": "1024"
  },
  {
    "ParameterKey": "TaskMemory",
    "ParameterValue": "2048"
  }
]
```

### Step 2: Validate CloudFormation Template

```bash
aws cloudformation validate-template \
  --template-body file://cloudformation/complete-stack.yaml
```

### Step 3: Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Monitor deployment progress:**

```bash
# Watch stack events (updates every 5 seconds)
aws cloudformation describe-stack-events \
  --stack-name fashion-fusion \
  --query 'StackEvents[*].[Timestamp,ResourceType,ResourceStatus,ResourceStatusReason]' \
  --output table

# Or use wait command (blocks until complete)
aws cloudformation wait stack-create-complete \
  --stack-name fashion-fusion
```

**Deployment takes approximately 15-20 minutes:**
- RDS creation: ~10 minutes
- ECS service startup: ~5 minutes
- Other resources: ~5 minutes

### Step 4: Build and Push Initial Docker Images

While the stack creates, build and push your Docker images:

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

# Login to ECR
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push frontend
docker build -f deployment/frontend/Dockerfile \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fashion-frontend:latest .
  
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fashion-frontend:latest

# Build and push backend
docker build -f deployment/backend/Dockerfile \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fashion-backend:latest .
  
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/fashion-backend:latest
```

### Step 5: Verify Stack Creation

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].StackStatus' \
  --output text
# Expected: CREATE_COMPLETE

# Get all outputs
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 6: Access Your Application

```bash
# Get Application URL
APP_URL=$(aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text)

echo "Application URL: $APP_URL"
```

Visit the URL in your browser!

---

## 🔄 CI/CD Pipeline Usage

After initial deployment, the pipeline automatically builds and deploys on every push to your GitHub branch:

### Trigger a Deployment

```bash
# Just push to GitHub
git add .
git commit -m "Deploy update"
git push origin main

# Pipeline automatically:
# 1. Detects the push
# 2. Builds Docker images
# 3. Pushes to ECR
# 4. Updates ECS service
```

### Monitor Pipeline

```bash
# Get pipeline execution status
aws codepipeline get-pipeline-state \
  --name fashion-fusion-pipeline \
  --query 'stageStates[*].{Stage:stageName,Status:latestExecution.status}' \
  --output table
```

---

## 📊 Stack Outputs Reference

After deployment, get these important values:

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}' \
  --output table
```

**Key Outputs:**

| Output | Description | Usage |
|--------|-------------|-------|
| `ApplicationURL` | Public URL of your app | Visit in browser |
| `RDSEndpoint` | Database endpoint | For direct DB access |
| `DatabaseURLSecretArn` | DATABASE_URL secret ARN | Already configured in ECS |
| `FrontendECRUri` | Frontend ECR repository | For manual pushes |
| `BackendECRUri` | Backend ECR repository | For manual pushes |
| `PipelineName` | CodePipeline name | Monitor deployments |

---

## 🔐 Accessing Secrets

All secrets are auto-generated. To view them:

```bash
# View DATABASE_URL
aws secretsmanager get-secret-value \
  --secret-id fashion-fusion/database-url \
  --query 'SecretString' \
  --output text

# View JWT secrets
aws secretsmanager get-secret-value \
  --secret-id fashion-fusion/jwt-access-secret \
  --query 'SecretString' \
  --output text
  
aws secretsmanager get-secret-value \
  --secret-id fashion-fusion/jwt-refresh-secret \
  --query 'SecretString' \
  --output text
```

---

## 🛠️ Troubleshooting

### Stack Creation Failed

```bash
# Check which resource failed
aws cloudformation describe-stack-events \
  --stack-name fashion-fusion \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
  --output table

# Common issues:
# 1. Subnet IDs invalid → Verify subnets exist in VPC
# 2. GitHub connection not authorized → Complete Step 3 prerequisites
# 3. ECR images missing → Push initial images (Step 4)
```

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster fashion-cluster \
  --services fashion-service \
  --query 'services[0].events[0:5]' \
  --output table

# Check task status
TASK_ARN=$(aws ecs list-tasks \
  --cluster fashion-cluster \
  --service-name fashion-service \
  --query 'taskArns[0]' \
  --output text)

aws ecs describe-tasks \
  --cluster fashion-cluster \
  --tasks $TASK_ARN \
  --query 'tasks[0].{Status:lastStatus,StoppedReason:stoppedReason}' \
  --output table

# View logs
aws logs tail /ecs/fashion-fusion --follow
```

### Database Connection Issues

```bash
# Verify security group allows ECS → RDS
ECS_SG=$(aws cloudformation describe-stack-resources \
  --stack-name fashion-fusion \
  --logical-resource-id ECSSecurityGroup \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)

RDS_SG=$(aws cloudformation describe-stack-resources \
  --stack-name fashion-fusion \
  --logical-resource-id RDSSecurityGroup \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)

# Check RDS security group ingress rules
aws ec2 describe-security-groups \
  --group-ids $RDS_SG \
  --query 'SecurityGroups[0].IpPermissions'
```

### Force Service Restart

```bash
# After fixing issues, force new deployment
aws ecs update-service \
  --cluster fashion-cluster \
  --service fashion-service \
  --force-new-deployment
```

---

## 🔄 Update Stack

To update the infrastructure (e.g., change instance size):

```bash
# Update parameters.json with new values

# Update stack
aws cloudformation update-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for update to complete
aws cloudformation wait stack-update-complete \
  --stack-name fashion-fusion
```

---

## 🗑️ Delete Stack

To completely remove all resources:

```bash
# Delete stack (keeps RDS snapshot)
aws cloudformation delete-stack \
  --stack-name fashion-fusion

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name fashion-fusion

# Manually empty and delete S3 bucket
BUCKET_NAME=$(aws cloudformation describe-stack-resources \
  --stack-name fashion-fusion \
  --logical-resource-id PipelineArtifactBucket \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text)
  
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME
```

---

## 💰 Cost Estimate

Monthly costs with default parameters:

| Resource | Cost |
|----------|------|
| RDS db.t3.micro | ~$15 |
| ECS Fargate (1 task, 1 vCPU, 2GB) | ~$30 |
| Application Load Balancer | ~$16 |
| NAT Gateway (if private subnets) | ~$32 |
| S3, CloudWatch, Secrets Manager | ~$5 |
| **Total** | **~$98/month** |

**Cost optimization:**
- Use public subnets for ECS (remove NAT Gateway): save $32/month
- Use db.t4g.micro (ARM): save $3/month
- Use Fargate Spot: save ~$20/month

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Stack status is `CREATE_COMPLETE`
- [ ] Application URL loads successfully
- [ ] Products display with images
- [ ] User registration works
- [ ] Shopping cart functions correctly
- [ ] CodePipeline shows successful execution
- [ ] CloudWatch logs show no errors
- [ ] RDS shows healthy status

---

## 📞 Support Commands

```bash
# View all stack resources
aws cloudformation describe-stack-resources \
  --stack-name fashion-fusion \
  --query 'StackResources[*].{Type:ResourceType,ID:PhysicalResourceId,Status:ResourceStatus}' \
  --output table

# Export stack template
aws cloudformation get-template \
  --stack-name fashion-fusion \
  --query 'TemplateBody' \
  > deployed-template.yaml

# List all CloudFormation stacks
aws cloudformation list-stacks \
  --query 'StackSummaries[?StackStatus!=`DELETE_COMPLETE`].[StackName,StackStatus]' \
  --output table
```

---

## 🎯 Quick Deployment Command

All-in-one deployment:

```bash
aws cloudformation create-stack \
  --stack-name fashion-fusion \
  --template-body file://cloudformation/complete-stack.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 && \
aws cloudformation wait stack-create-complete --stack-name fashion-fusion && \
echo "✅ Stack created successfully!" && \
aws cloudformation describe-stacks \
  --stack-name fashion-fusion \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
  --output text
```

---

**🎉 Congratulations!** Your Fashion Fusion e-commerce platform is deployed with 100% Infrastructure as Code!
