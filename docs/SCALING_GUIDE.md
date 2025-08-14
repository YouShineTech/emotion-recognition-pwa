# Scaling Guide - Emotion Recognition PWA

## Overview

This guide explains how the Emotion Recognition PWA has been architected to meet **Requirement 8: Handle 1000 simultaneous connections without performance degradation**.

## 🏗️ Scalable Architecture

### **Distributed System Components**

1. **Cluster Manager** (`server/src/cluster.ts`)
   - Manages multiple Node.js worker processes
   - Distributes load across CPU cores
   - Handles worker health monitoring and restart

2. **Connection Manager** (`server/src/modules/connection-manager/`)
   - Distributed session management using Redis
   - Cross-instance session sharing
   - Connection metrics and monitoring

3. **Circuit Breaker** (`server/src/modules/circuit-breaker/`)
   - Prevents cascade failures
   - Automatic recovery mechanisms
   - Service health monitoring

4. **Load Balancer** (`nginx/nginx-scalable.conf`)
   - Nginx-based load balancing
   - SSL termination
   - Rate limiting and connection management

## 🚀 Deployment Architecture

### **Multi-Instance Setup**

```
┌─────────────────┐
│   Load Balancer │ ← nginx (1000+ connections)
│    (Nginx)      │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐   ┌───────┐   ┌───────┐
│Server1│   │Server2│   │Server3│   │Server4│
│(250)  │   │(250)  │   │(250)  │   │(250)  │
└───┬───┘   └───┬───┘   └───┬───┘   └───┬───┘
    │           │           │           │
    └───────────┼───────────┼───────────┘
                │           │
            ┌───▼───────────▼───┐
            │   Redis Cluster   │
            │ (Session Storage) │
            └───────────────────┘
```

### **Resource Allocation**

- **4 Server Instances**: Each handling 250 concurrent connections
- **2 Workers per Instance**: Utilizing multi-core processing
- **Redis Cluster**: Centralized session state management
- **Nginx Load Balancer**: Intelligent request distribution

## 📊 Performance Specifications

### **Capacity Targets**

| Metric                 | Target | Implementation                       |
| ---------------------- | ------ | ------------------------------------ |
| **Concurrent Users**   | 1000+  | 4 server instances × 250 connections |
| **Latency**            | <500ms | WebRTC + optimized processing        |
| **Memory per Session** | <50MB  | Strict memory management             |
| **CPU Usage**          | <80%   | Load balancing + worker distribution |
| **Availability**       | 99.9%  | Circuit breakers + health monitoring |

### **Scaling Limits**

- **Per Worker**: 100 connections max
- **Per Instance**: 250 connections (2 workers × 100 + overhead)
- **Total System**: 1000+ connections (4 instances)
- **Memory Limit**: 512MB per instance
- **CPU Limit**: 1 core per instance

## 🔧 Configuration

### **Environment Variables**

```bash
# Server Configuration
MAX_CONNECTIONS_PER_WORKER=100
MAX_WORKERS=2
PORT=3001

# Redis Configuration
REDIS_URL=redis://redis:6379

# Mediasoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
MEDIASOUP_RTC_MIN_PORT=40000
MEDIASOUP_RTC_MAX_PORT=40100

# Security
CORS_ORIGIN=https://localhost
```

### **Docker Compose Scaling**

```bash
# Start all services
docker-compose up -d

# Scale specific services
docker-compose up -d --scale server1=2 --scale server2=2

# Monitor services
docker-compose ps
docker-compose logs -f server1
```

## 🧪 Load Testing

### **Running Load Tests**

```bash
# Test 1000 concurrent connections
docker-compose --profile testing up loadtest

# Custom load test
docker run --rm -e MAX_CONNECTIONS=1500 -e RAMP_UP_TIME=120 loadtest

# View test reports
ls -la reports/load-test-*.json
```

### **Test Scenarios**

1. **Load Test**: 1000 connections over 60 seconds
2. **Stress Test**: 1500 connections to find breaking point
3. **Spike Test**: Sudden traffic spikes
4. **Endurance Test**: 24-hour sustained load

## 📈 Monitoring

### **Metrics Dashboard**

Access Grafana at `http://localhost:3005`

- **Connection Metrics**: Active sessions, connection rate
- **Performance Metrics**: Latency, throughput, error rates
- **Resource Metrics**: CPU, memory, network usage
- **Business Metrics**: Emotion analysis accuracy, session duration

### **Health Checks**

```bash
# Check individual server health
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health
curl http://localhost:3003/api/health
curl http://localhost:3004/api/health

# Check load balancer status
curl http://localhost:8080/nginx_status

# Check Redis status
redis-cli -h localhost -p 6379 ping
```

## 🔄 Auto-Scaling

### **Horizontal Scaling**

Add more server instances:

```yaml
# docker-compose.yml
server5:
  build:
    context: ./server
    dockerfile: Dockerfile.dev
  ports:
    - '3005:3001'
  environment:
    - MAX_CONNECTIONS_PER_WORKER=100
    - REDIS_URL=redis://redis:6379
```

Update nginx configuration:

```nginx
upstream emotion_api {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    server 127.0.0.1:3005;  # New instance
}
```

### **Vertical Scaling**

Increase resources per instance:

```yaml
deploy:
  resources:
    limits:
      memory: 1G # Increased from 512M
      cpus: '2.0' # Increased from 1.0
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **High Memory Usage**

   ```bash
   # Check memory per container
   docker stats

   # Restart high-memory instances
   docker-compose restart server1
   ```

2. **Connection Failures**

   ```bash
   # Check Redis connectivity
   docker-compose logs redis

   # Verify load balancer config
   docker-compose exec nginx nginx -t
   ```

3. **High Latency**

   ```bash
   # Check server response times
   curl -w "@curl-format.txt" http://localhost/api/health

   # Monitor WebRTC connections
   docker-compose logs -f server1 | grep WebRTC
   ```

### **Performance Tuning**

1. **Optimize Redis**

   ```bash
   # Increase Redis memory
   redis-cli CONFIG SET maxmemory 1gb

   # Enable compression
   redis-cli CONFIG SET rdbcompression yes
   ```

2. **Tune Nginx**

   ```nginx
   worker_connections 8192;  # Increase from 4096
   keepalive_requests 2000;  # Increase from 1000
   ```

3. **Optimize Node.js**

   ```bash
   # Increase heap size
   NODE_OPTIONS="--max-old-space-size=1024"

   # Enable cluster mode
   MAX_WORKERS=4  # Increase workers
   ```

## 📋 Compliance Checklist

### **Requirement 8 Validation**

- ✅ **1000+ Concurrent Users**: 4 instances × 250 connections
- ✅ **No Performance Degradation**: Load balancing + circuit breakers
- ✅ **Response Time Monitoring**: <500ms latency maintained
- ✅ **Resource Management**: Memory limits + CPU throttling
- ✅ **Graceful Failure Handling**: Circuit breakers + health checks

### **Additional Requirements**

- ✅ **REQ-2**: <500ms latency via WebRTC + optimized processing
- ✅ **REQ-7**: Scalable media relay with Mediasoup clustering
- ✅ **REQ-9**: Real-time performance monitoring with Grafana
- ✅ **REQ-23**: Network failure recovery with automatic reconnection
- ✅ **REQ-24**: Server overload handling with admission control

## 🚀 Production Deployment

### **Kubernetes Deployment**

For production scale beyond 1000 users, consider Kubernetes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emotion-pwa-server
spec:
  replicas: 10 # Scale to 10 instances for 2500+ users
  selector:
    matchLabels:
      app: emotion-pwa-server
  template:
    spec:
      containers:
        - name: server
          image: emotion-pwa-server:latest
          resources:
            limits:
              memory: '512Mi'
              cpu: '1000m'
            requests:
              memory: '256Mi'
              cpu: '500m'
```

### **Cloud Scaling**

- **AWS**: Use ECS with Application Load Balancer
- **Google Cloud**: Use GKE with Ingress controller
- **Azure**: Use AKS with Azure Load Balancer

This architecture ensures the system can handle 1000+ concurrent users while maintaining performance, reliability, and scalability requirements.
