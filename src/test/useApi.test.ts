import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi, useMutation } from '../hooks/useApi';
import { mockApiResponse, mockFetch, mockFetchError } from './utils';

// Mock API function
const mockApiFunction = vi.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useApi(mockApiFunction));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('should execute API call successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useApi(mockApiFunction));
    
    await result.current.execute();
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(true);
  });

  it('should handle API call errors', async () => {
    const mockError = new Error('API Error');
    mockApiFunction.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useApi(mockApiFunction));
    
    await expect(result.current.execute()).rejects.toThrow('API Error');
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.success).toBe(false);
  });

  it('should execute immediately when immediate is true', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    renderHook(() => useApi(mockApiFunction, { immediate: true }));
    
    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalled();
    });
  });

  it('should call onSuccess callback', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    const onSuccess = vi.fn();
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useApi(mockApiFunction, { onSuccess }));
    
    await result.current.execute();
    
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('should call onError callback', async () => {
    const mockError = new Error('API Error');
    const onError = vi.fn();
    
    mockApiFunction.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useApi(mockApiFunction, { onError }));
    
    await expect(result.current.execute()).rejects.toThrow();
    
    expect(onError).toHaveBeenCalled();
  });

  it('should reset state correctly', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useApi(mockApiFunction));
    
    await result.current.execute();
    expect(result.current.success).toBe(true);
    
    result.current.reset();
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });
});

describe('useMutation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMutation(mockApiFunction));
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it('should execute mutation successfully', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    const mutationData = { name: 'New Test' };
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useMutation(mockApiFunction));
    
    await result.current.mutate(mutationData);
    
    expect(mockApiFunction).toHaveBeenCalledWith(mutationData);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(true);
  });

  it('should handle mutation errors', async () => {
    const mockError = new Error('Mutation Error');
    const mutationData = { name: 'New Test' };
    
    mockApiFunction.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useMutation(mockApiFunction));
    
    await expect(result.current.mutate(mutationData)).rejects.toThrow('Mutation Error');
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.success).toBe(false);
  });

  it('should call onSuccess callback', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    const mutationData = { name: 'New Test' };
    const onSuccess = vi.fn();
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useMutation(mockApiFunction, { onSuccess }));
    
    await result.current.mutate(mutationData);
    
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('should call onError callback', async () => {
    const mockError = new Error('Mutation Error');
    const mutationData = { name: 'New Test' };
    const onError = vi.fn();
    
    mockApiFunction.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useMutation(mockApiFunction, { onError }));
    
    await expect(result.current.mutate(mutationData)).rejects.toThrow();
    
    expect(onError).toHaveBeenCalled();
  });

  it('should reset state correctly', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockResponse = mockApiResponse(mockData);
    const mutationData = { name: 'New Test' };
    
    mockApiFunction.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useMutation(mockApiFunction));
    
    await result.current.mutate(mutationData);
    expect(result.current.success).toBe(true);
    
    result.current.reset();
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });
});

