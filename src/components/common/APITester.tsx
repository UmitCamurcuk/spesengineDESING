import React, { useState } from 'react';
import { Play, Code, Copy, Check, Globe, Key, FileText, Send } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { APIEndpoint } from '../../types/common';

interface APITesterProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
}

// Mock API endpoints
const mockAPIEndpoints: APIEndpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/attributes/{id}',
    description: 'Get attribute details',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Attribute ID', example: 'attr-1' }
    ],
    responseExample: {
      id: 'attr-1',
      name: 'Product Status',
      type: 'select',
      required: true,
      options: ['active', 'draft', 'inactive']
    },
    requiresAuth: true,
    permissions: ['attributes:read']
  },
  {
    id: '2',
    method: 'PUT',
    path: '/api/attributes/{id}',
    description: 'Update attribute',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Attribute ID', example: 'attr-1' }
    ],
    requestBody: {
      name: 'Product Status',
      description: 'Current status of the product',
      required: true
    },
    responseExample: {
      id: 'attr-1',
      name: 'Product Status',
      description: 'Current status of the product',
      updatedAt: '2024-01-25T10:30:00Z'
    },
    requiresAuth: true,
    permissions: ['attributes:update']
  },
  {
    id: '3',
    method: 'DELETE',
    path: '/api/attributes/{id}',
    description: 'Delete attribute',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Attribute ID', example: 'attr-1' }
    ],
    responseExample: {
      message: 'Attribute deleted successfully'
    },
    requiresAuth: true,
    permissions: ['attributes:delete']
  },
  {
    id: '4',
    method: 'POST',
    path: '/api/attributes/{id}/validate',
    description: 'Validate attribute value',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Attribute ID', example: 'attr-1' }
    ],
    requestBody: {
      value: 'active'
    },
    responseExample: {
      valid: true,
      errors: []
    },
    requiresAuth: true,
    permissions: ['attributes:validate']
  }
];

export const APITester: React.FC<APITesterProps> = ({
  entityType,
  entityId,
  editMode = false
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(mockAPIEndpoints[0]);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResponse({
        status: 200,
        statusText: 'OK',
        data: selectedEndpoint.responseExample,
        headers: {
          'content-type': 'application/json',
          'x-response-time': '45ms'
        }
      });
      setLoading(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'success';
      case 'POST': return 'primary';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">API Testing</h3>
          <p className="text-sm text-muted-foreground">Test API endpoints for this {entityType}</p>
        </div>
        <Badge variant="primary" size="sm">
          <Globe className="h-3 w-3 mr-1" />
          Live API
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints List */}
        <Card>
          <CardHeader 
            title="Available Endpoints" 
            subtitle="Select an endpoint to test"
          />
          <div className="space-y-2">
            {mockAPIEndpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => setSelectedEndpoint(endpoint)}
                className={`w-full p-3 text-left border rounded-lg transition-all duration-200 ${
                  selectedEndpoint?.id === endpoint.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getMethodColor(endpoint.method) as any} size="sm">
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-foreground">
                      {endpoint.path.replace('{id}', entityId)}
                    </code>
                  </div>
                  {endpoint.requiresAuth && (
                    <Key className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{endpoint.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Request Builder */}
        <Card>
          <CardHeader 
            title="Request Builder" 
            subtitle="Configure and send requests"
          />
          {selectedEndpoint && (
            <div className="space-y-4">
              {/* Endpoint Info */}
              <div className="p-3 bg-muted/60 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={getMethodColor(selectedEndpoint.method) as any} size="sm">
                    {selectedEndpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-foreground">
                    {selectedEndpoint.path.replace('{id}', entityId)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedEndpoint.path.replace('{id}', entityId))}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{selectedEndpoint.description}</p>
              </div>

              {/* Parameters */}
              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/60 rounded">
                        <div>
                          <span className="text-sm font-medium text-foreground">{param.name}</span>
                          {param.required && <span className="text-error ml-1">*</span>}
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        </div>
                        <Badge variant="outline" size="sm">{param.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedEndpoint.requestBody && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Request Body
                  </label>
                  <textarea
                    value={requestBody || JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring font-mono text-sm bg-background"
                    placeholder="Enter request body (JSON)"
                  />
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleTest}
                loading={loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader 
            title="Response" 
            subtitle={`${response.status} ${response.statusText}`}
          />
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center space-x-4">
              <Badge 
                variant={response.status < 300 ? 'success' : response.status < 400 ? 'warning' : 'error'} 
                size="sm"
              >
                {response.status} {response.statusText}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Response time: {response.headers['x-response-time']}
              </span>
            </div>

            {/* Headers */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Response Headers</h4>
              <div className="bg-muted/60 rounded-lg p-3">
                <pre className="text-xs text-foreground">
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Response Body</h4>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                  className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
