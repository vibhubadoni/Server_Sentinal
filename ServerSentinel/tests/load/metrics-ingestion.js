import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 agents
    { duration: '5m', target: 100 }, // Stay at 100 agents
    { duration: '2m', target: 500 }, // Ramp up to 500 agents
    { duration: '5m', target: 500 }, // Stay at 500 agents
    { duration: '2m', target: 1000 }, // Ramp up to 1000 agents
    { duration: '5m', target: 1000 }, // Stay at 1000 agents
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
    errors: ['rate<0.05'], // Custom error rate should be less than 5%
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const CLIENT_ID = __ENV.CLIENT_ID || 'test-client-id';
const CLIENT_TOKEN = __ENV.CLIENT_TOKEN || 'test-token';

export default function () {
  const payload = JSON.stringify({
    clientId: CLIENT_ID,
    timestamp: new Date().toISOString(),
    metrics: {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      memoryUsedMb: Math.floor(Math.random() * 16000),
      memoryTotalMb: 16000,
      diskUsedGb: Math.floor(Math.random() * 500),
      diskTotalGb: 500,
      networkRxBytes: Math.floor(Math.random() * 1000000),
      networkTxBytes: Math.floor(Math.random() * 500000),
      loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      processCount: Math.floor(Math.random() * 200) + 100,
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-client-token': CLIENT_TOKEN,
    },
  };

  const res = http.post(`${API_URL}/api/metrics/ingest`, payload, params);

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  errorRate.add(!success);

  // Simulate 5-second collection interval
  sleep(5);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = `\n${indent}Load Test Summary\n${indent}${'='.repeat(50)}\n\n`;
  
  summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += `${indent}Request Duration (p99): ${data.metrics.http_req_duration.values['p(99)']}ms\n`;
  summary += `${indent}Throughput: ${data.metrics.http_reqs.values.rate} req/s\n`;

  return summary;
}
